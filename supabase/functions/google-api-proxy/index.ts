import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const GOOGLE_API_KEY = Deno.env.get("GOOGLE_API_KEY") || Deno.env.get("EXPO_PUBLIC_GOOGLE_MAPS_API_KEY") || "";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * GOOGLE API PROXY
 * 
 * Proxies Google Cloud Vision, Translation, and Places API calls
 * so the API key is never exposed to the client.
 * 
 * Actions:
 *   vision    — Image annotation (OCR, landmark, object detection)
 *   translate — Text translation
 *   detect    — Language detection
 *   languages — List supported languages
 */
Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (!GOOGLE_API_KEY) {
    return new Response(
      JSON.stringify({ error: "Google API key not configured" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const body = await req.json();
    const { action } = body;

    // ── Vision API ──
    if (action === "vision") {
      const { base64Image, features } = body;
      if (!base64Image || !features) {
        return Response.json({ error: "Missing base64Image or features" }, { status: 400, headers: corsHeaders });
      }

      const res = await fetch(`https://vision.googleapis.com/v1/images:annotate?key=${GOOGLE_API_KEY}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requests: [{ image: { content: base64Image }, features }],
        }),
      });

      const data = await res.json();
      return Response.json(
        { result: data.responses?.[0] || null },
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── Translation API ──
    if (action === "translate") {
      const { text, target, source } = body;
      if (!text || !target) {
        return Response.json({ error: "Missing text or target language" }, { status: 400, headers: corsHeaders });
      }

      const reqBody: any = { q: text, target, format: "text" };
      if (source) reqBody.source = source;

      const res = await fetch(`https://translation.googleapis.com/language/translate/v2?key=${GOOGLE_API_KEY}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(reqBody),
      });

      const data = await res.json();
      const translation = data.data?.translations?.[0];
      return Response.json(
        { translatedText: translation?.translatedText, detectedSourceLanguage: translation?.detectedSourceLanguage },
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── Language Detection ──
    if (action === "detect") {
      const { text } = body;
      if (!text) {
        return Response.json({ error: "Missing text" }, { status: 400, headers: corsHeaders });
      }

      const res = await fetch(`https://translation.googleapis.com/language/translate/v2/detect?key=${GOOGLE_API_KEY}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ q: text }),
      });

      const data = await res.json();
      const detection = data.data?.detections?.[0]?.[0];
      return Response.json(
        { language: detection?.language, confidence: detection?.confidence },
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── Supported Languages ──
    if (action === "languages") {
      const { target } = body;
      const url = `https://translation.googleapis.com/language/translate/v2/languages?key=${GOOGLE_API_KEY}&target=${target || "en"}`;
      const res = await fetch(url);
      const data = await res.json();
      return Response.json(
        { languages: data.data?.languages || [] },
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return Response.json(
      { error: `Unknown action: ${action}` },
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("[google-api-proxy] Error:", err);
    return Response.json(
      { error: "Internal error" },
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
