/**
 * PROCESS EMAIL IMPORT
 *
 * Three responsibilities, routed off the request body:
 *  1. Resend inbound webhook  (body.type === "email.received")
 *     - Resolves the user from the import+{userId}@guidera.one recipient.
 *     - Fetches the email body from the Resend Received-Emails API.
 *     - Parses a travel booking with AI (Gemini primary, Haiku fallback).
 *     - Writes an `email_imports` row the app can poll.
 *  2. App poll             (body.action === "check-imports")
 *  3. App import           (body.action === "import-booking")
 *
 * Deployed with verify_jwt = false because Resend cannot send a Supabase JWT.
 * Auth for the app actions is by userId scoping against the service-role client.
 */

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { guardAiRequest, AI_LIMITS } from "../_shared/aiRateGuard.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
const GOOGLE_AI_API_KEY = Deno.env.get("GOOGLE_AI_API_KEY") || "";
const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY") || "";
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") || "";

// Keep these aligned with supabase/functions/_shared/scanTicketModelConfig.ts
const GEMINI_MODEL = "gemini-3.5-flash";
const HAIKU_MODEL = "claude-haiku-4-5-20251001";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, svix-id, svix-timestamp, svix-signature",
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// --- AI Booking Parser -------------------------------------------------------

const SCHEMA = `{
  "found": true/false,
  "category": "flight" | "hotel" | "car" | "experience" | "other",
  "title": "short title e.g. United Airlines LAX to NRT",
  "provider": "airline/hotel/company",
  "confirmationNumber": "booking ref / PNR",
  "startDate": "YYYY-MM-DDTHH:mm:ss (include time if known, else YYYY-MM-DD) — departure / check-in",
  "endDate": "YYYY-MM-DDTHH:mm:ss or YYYY-MM-DD or null — arrival / check-out",
  "returnDate": "YYYY-MM-DD or null — only for round-trip tickets (look for a RETURN label)",
  "tripDurationDays": null,
  "startLocation": { "name": "departure CITY name", "code": "IATA code", "city": "", "country": "", "terminal": "" },
  "endLocation": { "name": "arrival CITY name", "code": "IATA code", "city": "", "country": "", "terminal": "" },
  "details": {
    "flightNumber": "e.g. EK226",
    "seatNumber": "e.g. 12A",
    "cabin": "Economy / Premium Economy / Business / First",
    "gate": "gate if shown",
    "boardingGroup": "group if shown",
    "airline": "full airline name",
    "route": "e.g. DXB \u2192 SIN",
    "hotelName": "",
    "carCompany": "",
    "isRoundTrip": false
  },
  "pricing": { "total": null, "currency": "USD" },
  "travelers": [{ "name": "" }],
  "confidence": 0.0 to 1.0
}`;

const RULES =
  `Extract ALL available information. Never guess — if a field is not present, use null/"" and lower the confidence.
For airports, set startLocation.code / endLocation.code to the IATA code, and set name + city to the CITY served by the airport, never the airport name (e.g. CDG -> Paris, NRT -> Tokyo, SIN -> Singapore).
Direction: "FROM"/"DEPARTURE"/"ORIGIN" = startLocation; "TO"/"ARRIVAL"/"DESTINATION" = endLocation. Do not swap them.
Times: use ISO format "YYYY-MM-DDTHH:mm:ss". If arrival shows "+1", add one day to endDate.
Round-trip: if a RETURN date is shown, set returnDate and details.isRoundTrip = true.
If no travel booking is found: { "found": false }`;

const TEXT_PROMPT = (content: string) =>
  `You are a travel booking extraction AI. Extract booking details from this forwarded email confirmation.

Return ONLY valid JSON (no markdown, no explanation):
${SCHEMA}

${RULES}

Email:
${content}`;

const IMAGE_PROMPT =
  `You are a travel booking extraction AI. This image is a travel document (boarding pass, e-ticket, hotel/car/booking confirmation, or itinerary). Read it carefully and extract the booking details.

Return ONLY valid JSON (no markdown, no explanation):
${SCHEMA}

${RULES}`;

function extractJson(text: string): any | null {
  const m = text.match(/\{[\s\S]*\}/);
  if (!m) return null;
  try {
    return JSON.parse(m[0]);
  } catch {
    return null;
  }
}

// --- Text parsing ---
async function parseTextWithGemini(content: string): Promise<any> {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GOOGLE_AI_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: TEXT_PROMPT(content) }] }],
        generationConfig: { temperature: 0.1, maxOutputTokens: 2000 },
      }),
    },
  );
  if (!res.ok) throw new Error(`Gemini ${res.status}: ${await res.text()}`);
  const data = await res.json();
  const p = extractJson(data.candidates?.[0]?.content?.parts?.[0]?.text || "");
  if (!p) throw new Error("No JSON in Gemini response");
  p._model = GEMINI_MODEL;
  return p;
}

async function parseTextWithHaiku(content: string): Promise<any> {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: HAIKU_MODEL,
      max_tokens: 2000,
      messages: [{ role: "user", content: TEXT_PROMPT(content) }],
    }),
  });
  if (!res.ok) throw new Error(`Haiku ${res.status}: ${await res.text()}`);
  const data = await res.json();
  const p = extractJson(data.content?.[0]?.text || "");
  if (!p) throw new Error("No JSON in Haiku response");
  p._model = HAIKU_MODEL;
  return p;
}

// --- Image parsing (vision) ---
async function parseImageWithGemini(base64: string, mediaType: string): Promise<any> {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GOOGLE_AI_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{
          parts: [
            { inline_data: { mime_type: mediaType, data: base64 } },
            { text: IMAGE_PROMPT },
          ],
        }],
        generationConfig: { temperature: 0.1, maxOutputTokens: 2000, responseMimeType: "application/json" },
      }),
    },
  );
  if (!res.ok) throw new Error(`Gemini vision ${res.status}: ${await res.text()}`);
  const data = await res.json();
  const p = extractJson(data.candidates?.[0]?.content?.parts?.[0]?.text || "");
  if (!p) throw new Error("No JSON in Gemini vision response");
  p._model = `${GEMINI_MODEL}-vision`;
  return p;
}

async function parseImageWithHaiku(base64: string, mediaType: string): Promise<any> {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: HAIKU_MODEL,
      max_tokens: 2000,
      messages: [{
        role: "user",
        content: [
          { type: "image", source: { type: "base64", media_type: mediaType, data: base64 } },
          { type: "text", text: IMAGE_PROMPT },
        ],
      }],
    }),
  });
  if (!res.ok) throw new Error(`Haiku vision ${res.status}: ${await res.text()}`);
  const data = await res.json();
  const p = extractJson(data.content?.[0]?.text || "");
  if (!p) throw new Error("No JSON in Haiku vision response");
  p._model = `${HAIKU_MODEL}-vision`;
  return p;
}

// Pull inline base64 images out of forwarded HTML (e.g. a phone photo of a ticket).
function extractImagesFromHtml(html: string): { base64: string; mediaType: string }[] {
  if (!html) return [];
  const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/heic", "image/heif"];
  const out: { base64: string; mediaType: string }[] = [];
  const re = /data:(image\/[a-z0-9.+-]+);base64,([A-Za-z0-9+/=]+)/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    let mediaType = m[1].toLowerCase();
    if (mediaType === "image/jpg") mediaType = "image/jpeg";
    const base64 = m[2];
    if (base64.length < 1000) continue;        // skip tracking pixels / tiny icons
    if (base64.length > 20_000_000) continue;  // ~15MB cap
    if (!allowed.includes(mediaType)) continue;
    out.push({ base64, mediaType });
    if (out.length >= 3) break;
  }
  return out;
}

async function parseBookingFromText(content: string): Promise<any> {
  if (!content || content.length < 30) return null;
  const clean = content
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .substring(0, 8000);
  if (clean.length < 30) return null;
  if (GOOGLE_AI_API_KEY) {
    try { return await parseTextWithGemini(clean); }
    catch (e) { console.warn("[EmailImport] Text Gemini failed:", e); }
  }
  if (ANTHROPIC_API_KEY) {
    try { return await parseTextWithHaiku(clean); }
    catch (e) { console.warn("[EmailImport] Text Haiku failed:", e); }
  }
  return null;
}

async function parseBookingFromImages(
  images: { base64: string; mediaType: string }[],
): Promise<any> {
  for (const img of images) {
    if (GOOGLE_AI_API_KEY) {
      try {
        const p = await parseImageWithGemini(img.base64, img.mediaType);
        if (p?.found) return p;
      } catch (e) { console.warn("[EmailImport] Image Gemini failed:", e); }
    }
    if (ANTHROPIC_API_KEY) {
      try {
        const p = await parseImageWithHaiku(img.base64, img.mediaType);
        if (p?.found) return p;
      } catch (e) { console.warn("[EmailImport] Image Haiku failed:", e); }
    }
  }
  return null;
}

// --- Resend Received-Emails API ---------------------------------------------
// The webhook payload does NOT include the body — fetch it by email_id.
// Content can take a moment to be available, so retry with backoff.
async function fetchEmailContent(
  emailId: string,
): Promise<{ text: string; html: string }> {
  if (!RESEND_API_KEY) {
    console.warn("[EmailImport] RESEND_API_KEY missing — cannot fetch content");
    return { text: "", html: "" };
  }
  if (!emailId) return { text: "", html: "" };

  // Resend can take a little while to make inbound content retrievable, so
  // retry generously before giving up (avoids premature "no booking").
  for (let attempt = 1; attempt <= 6; attempt++) {
    try {
      const res = await fetch(
        `https://api.resend.com/emails/receiving/${emailId}`,
        { headers: { Authorization: `Bearer ${RESEND_API_KEY}` } },
      );
      if (res.ok) {
        const data = await res.json();
        const html = data.html || "";
        const text = data.text || "";
        if (html || text) {
          console.log(
            `[EmailImport] Content fetched (attempt ${attempt}): html=${html.length}b text=${text.length}b`,
          );
          return { text, html };
        }
        console.log(`[EmailImport] Content empty (attempt ${attempt}), retrying`);
      } else {
        console.warn(
          `[EmailImport] Content fetch ${res.status} (attempt ${attempt})`,
        );
      }
    } catch (e) {
      console.warn(`[EmailImport] Content fetch error (attempt ${attempt}):`, e);
    }
    await new Promise((r) => setTimeout(r, attempt * 1500));
  }
  return { text: "", html: "" };
}

// --- Cover image -------------------------------------------------------------
const DP: Record<string, string> = {
  tokyo: "photo-1540959733332-eab4deabeeaf",
  paris: "photo-1502602898657-3e91760cbb34",
  london: "photo-1513635269975-59663e0ac1ad",
  "new york": "photo-1496442226666-8d4d0e62e6e9",
  dubai: "photo-1512453979798-5ea266f8880c",
  sydney: "photo-1506973035872-a4ec16b8e8d9",
  bali: "photo-1537996194471-e657df975ab4",
  bangkok: "photo-1508009603885-50cf7c579365",
  rome: "photo-1552832230-c0197dd311b5",
  amsterdam: "photo-1534351590666-13e3e96b5017",
  seoul: "photo-1534274988757-a28bf1a57c17",
  singapore: "photo-1525625293386-3f8f99389edd",
};
function getCoverImage(city: string): string {
  const c = (city || "").toLowerCase().trim();
  for (const [k, v] of Object.entries(DP)) {
    if (c.includes(k) || k.includes(c)) {
      return `https://images.unsplash.com/${v}?w=800&h=600&fit=crop&q=80`;
    }
  }
  return "https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800&h=600&fit=crop&q=80";
}

// --- Main Handler ------------------------------------------------------------
Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  try {
    const body = await req.json();

    // 1) App: check-imports — poll for parsed/processing imports
    if (body.action === "check-imports") {
      const { userId } = body;
      if (!userId) throw new Error("userId required");
      const { data: imports } = await supabase
        .from("email_imports")
        .select("*")
        .eq("user_id", userId)
        .in("status", ["parsed", "imported", "processing", "pending", "no_booking"])
        .order("created_at", { ascending: false })
        .limit(5);
      return json({ imports: imports || [] });
    }

    // 2) App: import-booking — create a trip from a parsed import
    if (body.action === "import-booking") {
      const { userId, importId } = body;
      if (!userId || !importId) throw new Error("userId and importId required");

      const { data: imp } = await supabase
        .from("email_imports")
        .select("*")
        .eq("id", importId)
        .eq("user_id", userId)
        .single();
      if (!imp?.parsed_booking) throw new Error("Parsed booking not found");

      const bk = imp.parsed_booking;
      const dest =
        bk.endLocation?.city || bk.startLocation?.city || bk.title || "Trip";
      // startDate may now be an ISO datetime; trips store date-only columns.
      const startRaw = bk.startDate || new Date().toISOString();
      const sd = String(startRaw).split("T")[0];
      const ed = String(bk.returnDate || bk.endDate || startRaw).split("T")[0];
      const title = `${dest} ${new Date(sd).toLocaleString("en-US", {
        month: "short",
      })} ${new Date(sd).getFullYear()}`;

      const td: Record<string, any> = {
        user_id: userId,
        owner_id: userId,
        title,
        cover_image_url: getCoverImage(dest),
        destination: {
          name: dest,
          city: bk.endLocation?.city || dest,
          country: bk.endLocation?.country || "",
        },
        primary_destination_name: bk.endLocation?.city || dest,
        primary_destination_country: bk.endLocation?.country || "",
        start_date: sd,
        end_date: ed,
        state: "upcoming",
        status: "planning",
        created_via: "import_email",
        booking_count: 1,
      };
      if (bk.category === "flight") {
        td.has_flights = true;
        td.flight_count = 1;
      }
      if (bk.details?.airline) td.airline_name = bk.details.airline;
      if (bk.details?.cabin) td.cabin_class = bk.details.cabin;
      if (bk.details?.route) td.route = bk.details.route;
      if (bk.details?.flightNumber) td.flight_number = bk.details.flightNumber;
      if (bk.details?.seatNumber) td.seat_number = bk.details.seatNumber;
      // Persist the full departure datetime (ISO) when the email included a time,
      // so the departure monitor can compute an accurate "leave by".
      if (bk.category === "flight" && String(startRaw).includes("T")) {
        td.departure_time = startRaw;
      }

      const { data: trip, error: te } = await supabase
        .from("trips")
        .insert(td)
        .select("id")
        .single();
      if (te) throw new Error(te.message);

      await supabase.from("trip_bookings").insert({
        trip_id: trip.id,
        booking_id: trip.id,
        category: bk.category,
        booking_reference: bk.confirmationNumber,
        summary_title: bk.title,
        summary_subtitle: bk.provider || "",
        summary_datetime: bk.startDate,
        summary_price: bk.pricing?.total,
        summary_status: "confirmed",
        source: "import_email",
        added_by: userId,
      });

      await supabase
        .from("email_imports")
        .update({
          status: "imported",
          trip_id: trip.id,
          imported_at: new Date().toISOString(),
        })
        .eq("id", importId);

      return json({ success: true, tripId: trip.id, title });
    }

    // 3) Resend inbound webhook
    if (body.type === "email.received" && body.data) {
      const __rl = await guardAiRequest({
        req, body, supabase, config: AI_LIMITS.ocr,
        corsHeaders, supabaseUrl: SUPABASE_URL,
        serviceRoleKey: SUPABASE_SERVICE_KEY, anonKey: SUPABASE_ANON_KEY,
      });
      if (__rl) return __rl;

      const evt = body.data;
      const fromAddr = evt.from || "unknown";
      const toAddrs: string[] = Array.isArray(evt.to)
        ? evt.to
        : [evt.to].filter(Boolean);
      const subject = evt.subject || "No subject";
      const emailId = evt.email_id;
      console.log(
        `[EmailImport] Webhook: from=${fromAddr} to=${JSON.stringify(
          toAddrs,
        )} emailId=${emailId} subject="${subject}"`,
      );

      // Resolve the user from import+{userId}@guidera.one
      let userId: string | null = null;
      for (const addr of toAddrs) {
        const m = (addr || "").match(/import\+([0-9a-f-]{36})@/i);
        if (m) {
          userId = m[1];
          break;
        }
      }
      if (!userId) {
        console.warn(
          `[EmailImport] No import+{userId} recipient in ${JSON.stringify(toAddrs)}`,
        );
        return json({ ok: true, reason: "no_user_in_recipient" });
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("id", userId)
        .maybeSingle();
      if (!profile) {
        console.warn(`[EmailImport] No profile for userId ${userId}`);
        return json({ ok: true, reason: "unknown_user" });
      }

      // Body may be inline (forward-compat) or fetched via the API.
      let emailHtml = evt.html || "";
      let emailText = evt.text || "";
      if (!emailHtml && !emailText && emailId) {
        const c = await fetchEmailContent(emailId);
        emailHtml = c.html;
        emailText = c.text;
      }

      // Record the inbound email immediately so the app sees "processing".
      const { data: rec, error: ie } = await supabase
        .from("email_imports")
        .insert({
          user_id: userId,
          from_email: fromAddr,
          subject,
          status: "processing",
          raw_text: (emailText || "").substring(0, 50000),
          raw_html: (emailHtml || "").substring(0, 100000),
        })
        .select("id")
        .single();
      if (ie) {
        console.error("[EmailImport] Insert failed:", ie.message);
        return json({ ok: true, reason: "insert_failed", error: ie.message });
      }

      // The booking may be in the email text OR in an inline/attached image
      // (e.g. a forwarded photo of a boarding pass). Try image OCR first.
      const images = extractImagesFromHtml(emailHtml);
      console.log(
        `[EmailImport] Parsing: textLen=${(emailText || "").length} htmlLen=${(emailHtml || "").length} images=${images.length}`,
      );

      let parsed: any = null;
      if (images.length > 0) {
        parsed = await parseBookingFromImages(images);
      }
      if (!parsed?.found) {
        const textContent = emailText || emailHtml || `Subject: ${subject}`;
        const textParsed = await parseBookingFromText(textContent);
        if (textParsed?.found) parsed = textParsed;
        else if (!parsed) parsed = textParsed;
      }
      if (parsed && parsed.found) {
        await supabase
          .from("email_imports")
          .update({
            status: "parsed",
            parsed_booking: parsed,
            model_used: parsed._model || GEMINI_MODEL,
            confidence: parsed.confidence || 0.8,
            processed_at: new Date().toISOString(),
          })
          .eq("id", rec.id);
        console.log(`[EmailImport] SUCCESS: ${parsed.title} (${parsed._model})`);
      } else {
        await supabase
          .from("email_imports")
          .update({
            status: "no_booking",
            processed_at: new Date().toISOString(),
            error: "No booking found",
          })
          .eq("id", rec.id);
        console.log(`[EmailImport] No booking for user ${userId}`);
      }

      return json({
        received: true,
        importId: rec.id,
        found: parsed?.found || false,
      });
    }

    return json({ error: "Unknown action" }, 400);
  } catch (err: any) {
    console.error("[EmailImport] Error:", err);
    // Return 200 so Resend does not endlessly retry on parse-time errors.
    return json({ error: err.message }, 200);
  }
});
