import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const DIDIT_WEBHOOK_SECRET = Deno.env.get("DIDIT_WEBHOOK_SECRET") ?? "";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-timestamp, x-signature, x-signature-v2, x-signature-simple",
};

const TIMESTAMP_TOLERANCE_SECONDS = 300; // per Didit docs: reject if older than 5 minutes

async function hmacHex(secret: string, content: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(content));
  return Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function timingSafeEqual(a: string, b: string): boolean {
  const encoder = new TextEncoder();
  const ab = encoder.encode(a);
  const bb = encoder.encode(b);
  if (ab.length !== bb.length) return false;
  let diff = 0;
  for (let i = 0; i < ab.length; i++) diff |= ab[i] ^ bb[i];
  return diff === 0;
}

// Didit's X-Signature-V2 signs the canonical JSON form: keys sorted,
// compact separators, Unicode preserved.
function canonicalJson(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  const obj = value as Record<string, unknown>;
  const keys = Object.keys(obj).sort();
  return `{${keys.map((k) => `${JSON.stringify(k)}:${canonicalJson(obj[k])}`).join(",")}}`;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    let sessionId: string | null = null;
    let status: string | null = null;
    let vendorData: string | null = null;
    let payload: Record<string, any> = {};

    // SECURITY: Only accept POST requests — GET is not a valid webhook method
    if (req.method !== "POST") {
      return Response.json(
        { error: "Webhooks must use POST." },
        { status: 405, headers: corsHeaders }
      );
    }

    // SECURITY: fail closed — without a secret every request would be trusted.
    if (!DIDIT_WEBHOOK_SECRET) {
      console.error("[didit-webhook] DIDIT_WEBHOOK_SECRET not configured — rejecting webhook");
      return Response.json(
        { error: "Webhook not configured" },
        { status: 503, headers: corsHeaders }
      );
    }

    const body = await req.text();
    payload = JSON.parse(body);

    // SECURITY: reject stale or missing timestamps (replay protection)
    const timestampHeader = req.headers.get("x-timestamp");
    const timestamp = timestampHeader ? parseInt(timestampHeader, 10) : NaN;
    if (
      !Number.isFinite(timestamp) ||
      Math.abs(Math.floor(Date.now() / 1000) - timestamp) > TIMESTAMP_TOLERANCE_SECONDS
    ) {
      console.error("[didit-webhook] Missing or stale x-timestamp — rejecting");
      return Response.json(
        { error: "Invalid timestamp" },
        { status: 401, headers: corsHeaders }
      );
    }

    // SECURITY: verify the HMAC signature. Didit sends three variants;
    // accept whichever verifies, preferring the ones that sign the full body.
    const signatureRaw = req.headers.get("x-signature");
    const signatureV2 = req.headers.get("x-signature-v2");
    const signatureSimple = req.headers.get("x-signature-simple");

    let verified = false;

    if (signatureRaw) {
      verified = timingSafeEqual(await hmacHex(DIDIT_WEBHOOK_SECRET, body), signatureRaw);
    }
    if (!verified && signatureV2) {
      verified = timingSafeEqual(
        await hmacHex(DIDIT_WEBHOOK_SECRET, canonicalJson(payload)),
        signatureV2
      );
    }
    if (!verified && signatureSimple) {
      const envelope = `${timestampHeader}:${payload.session_id ?? ""}:${payload.status ?? ""}:${payload.webhook_type ?? ""}`;
      verified = timingSafeEqual(
        await hmacHex(DIDIT_WEBHOOK_SECRET, envelope),
        signatureSimple
      );
    }

    if (!verified) {
      console.error("[didit-webhook] Signature verification failed — rejecting");
      return Response.json(
        { error: "Invalid signature" },
        { status: 401, headers: corsHeaders }
      );
    }

    sessionId = payload.session_id;
    status = payload.status;
    vendorData = payload.vendor_data;

    console.log(`[didit-webhook] Received: session=${sessionId}, status=${status}, vendor_data=${vendorData}`);

    if (!sessionId || !status) {
      return Response.json(
        { error: "Missing session_id or status" },
        { status: 400, headers: corsHeaders }
      );
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Map Didit status to our internal DB values (must match check constraint)
    // Allowed: not_started, in_progress, approved, declined, expired, abandoned
    const statusMap: Record<string, string> = {
      "Approved": "approved",
      "Declined": "declined",
      "In Review": "in_progress",
      "Not Started": "not_started",
    };
    const internalStatus = statusMap[status] || "in_progress";

    // If GET callback, look up application by session ID if no vendor_data
    let applicationId = vendorData;
    if (!applicationId && sessionId) {
      const { data: appLookup } = await supabase
        .from("partner_applications")
        .select("id")
        .eq("didit_session_id", sessionId)
        .maybeSingle();
      if (appLookup) applicationId = appLookup.id;
    }

    if (applicationId) {
      const updateData: Record<string, any> = {
        didit_verification_status: internalStatus,
        updated_at: new Date().toISOString(),
      };

      // If approved, move application status forward
      if (internalStatus === "approved") {
        updateData.status = "approved";
      } else if (internalStatus === "declined") {
        updateData.status = "rejected";
      }

      const { error: appError } = await supabase
        .from("partner_applications")
        .update(updateData)
        .eq("id", applicationId);

      if (appError) {
        console.error("[didit-webhook] Failed to update application:", appError);
      }
    }

    // Store detailed verification results in partner_verifications
    const verificationRecord: Record<string, any> = {
      application_id: applicationId,
      didit_session_id: sessionId,
      didit_status: internalStatus,
      webhook_type: "session_decision",
      vendor_data: vendorData,
      workflow_id: payload.workflow_id || null,
      raw_decision: payload,
    };

    // Extract ID verification details
    const idVerification = payload.id_verifications?.[0];
    if (idVerification) {
      verificationRecord.id_document_type = idVerification.document_type || null;
      verificationRecord.id_document_number = idVerification.document_number || null;
      verificationRecord.id_first_name = idVerification.first_name || null;
      verificationRecord.id_last_name = idVerification.last_name || null;
      verificationRecord.id_date_of_birth = idVerification.date_of_birth || null;
      verificationRecord.id_nationality = idVerification.nationality || null;
      verificationRecord.id_issuing_state = idVerification.issuing_state || null;
      verificationRecord.id_expiration_date = idVerification.expiration_date || null;
      verificationRecord.id_front_image_url = idVerification.front_image || null;
      verificationRecord.id_back_image_url = idVerification.back_image || null;
      verificationRecord.id_portrait_image_url = idVerification.portrait_image || null;
    }

    // Extract liveness check details
    const livenessCheck = payload.liveness_checks?.[0];
    if (livenessCheck) {
      verificationRecord.liveness_status = livenessCheck.status || null;
      verificationRecord.liveness_score = livenessCheck.score || null;
    }

    // Extract face match details
    const faceMatch = payload.face_matches?.[0];
    if (faceMatch) {
      verificationRecord.face_match_status = faceMatch.status || null;
      verificationRecord.face_match_score = faceMatch.score || null;
    }

    // Extract phone verification
    const phoneVerification = payload.phone_verifications?.[0];
    if (phoneVerification) {
      verificationRecord.phone_verified = phoneVerification.status === "Approved";
      verificationRecord.phone_number_full = phoneVerification.full_number || null;
    }

    // Extract AML screening
    const amlScreening = payload.aml_screenings?.[0];
    if (amlScreening) {
      verificationRecord.aml_status = amlScreening.status || null;
      verificationRecord.aml_total_hits = amlScreening.total_hits || 0;
    }

    // Extract IP analysis
    const ipAnalysis = payload.ip_analyses?.[0];
    if (ipAnalysis) {
      verificationRecord.ip_country = ipAnalysis.ip_country || null;
      verificationRecord.ip_city = ipAnalysis.ip_city || null;
      verificationRecord.is_vpn_or_tor = ipAnalysis.is_vpn_or_tor || false;
    }

    const { error: verifyError } = await supabase
      .from("partner_verifications")
      .upsert(verificationRecord, {
        onConflict: "didit_session_id",
        ignoreDuplicates: false,
      });

    if (verifyError) {
      console.error("[didit-webhook] Failed to store verification:", verifyError);
      // Try insert instead (if upsert fails due to missing unique constraint)
      const { error: insertError } = await supabase
        .from("partner_verifications")
        .insert(verificationRecord);

      if (insertError) {
        console.error("[didit-webhook] Insert also failed:", insertError);
      }
    }

    console.log(`[didit-webhook] Processed successfully: ${sessionId} -> ${internalStatus}`);

    return Response.json(
      { success: true },
      { headers: corsHeaders }
    );
  } catch (err) {
    console.error("[didit-webhook] Error:", err);
    return Response.json(
      { error: "Internal server error" },
      { status: 500, headers: corsHeaders }
    );
  }
});
