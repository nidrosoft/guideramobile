import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const GOOGLE_API_KEY = Deno.env.get("GOOGLE_API_KEY") || Deno.env.get("EXPO_PUBLIC_GOOGLE_MAPS_API_KEY") || "";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * GOOGLE API PROXY
 * 
 * Proxies Google Cloud Vision, Translation, Places, and TTS API calls
 * so the API key is never exposed to the client.
 * 
 * Actions:
 *   vision    — Image annotation (OCR, landmark, object detection)
 *   translate — Text translation
 *   detect    — Language detection
 *   languages — List supported languages
 *   tts       — Text-to-Speech with Google Neural2 voices
 */

/**
 * Select the best Neural2 voice for a language + gender combo.
 * Neural2 voices are the most natural-sounding Google TTS voices.
 * Falls back to language code only if no specific voice is mapped.
 */
function getVoiceName(lang: string, gender: string): string {
  const isMale = gender === "MALE";
  // Neural2 voice map — natural, human-like voices
  const voiceMap: Record<string, string> = {
    "en-US": isMale ? "en-US-Neural2-D" : "en-US-Neural2-F",
    "en-GB": isMale ? "en-GB-Neural2-D" : "en-GB-Neural2-F",
    "en-AU": isMale ? "en-AU-Neural2-D" : "en-AU-Neural2-A",
    "fr-FR": isMale ? "fr-FR-Neural2-D" : "fr-FR-Neural2-A",
    "es-ES": isMale ? "es-ES-Neural2-B" : "es-ES-Neural2-A",
    "es-US": isMale ? "es-US-Neural2-B" : "es-US-Neural2-A",
    "de-DE": isMale ? "de-DE-Neural2-D" : "de-DE-Neural2-A",
    "it-IT": isMale ? "it-IT-Neural2-C" : "it-IT-Neural2-A",
    "pt-BR": isMale ? "pt-BR-Neural2-B" : "pt-BR-Neural2-A",
    "pt-PT": isMale ? "pt-PT-Neural2-D" : "pt-PT-Neural2-A",
    "ja-JP": isMale ? "ja-JP-Neural2-C" : "ja-JP-Neural2-B",
    "ko-KR": isMale ? "ko-KR-Neural2-C" : "ko-KR-Neural2-A",
    "zh-CN": isMale ? "zh-CN-Neural2-D" : "zh-CN-Neural2-A",
    "zh-TW": isMale ? "zh-TW-Neural2-C" : "zh-TW-Neural2-A",
    "hi-IN": isMale ? "hi-IN-Neural2-C" : "hi-IN-Neural2-A",
    "ar-XA": isMale ? "ar-XA-Neural2-C" : "ar-XA-Neural2-A",
    "ru-RU": isMale ? "ru-RU-Neural2-D" : "ru-RU-Neural2-A",
    "nl-NL": isMale ? "nl-NL-Neural2-C" : "nl-NL-Neural2-A",
    "pl-PL": isMale ? "pl-PL-Neural2-B" : "pl-PL-Neural2-A",
    "sv-SE": isMale ? "sv-SE-Neural2-D" : "sv-SE-Neural2-A",
    "tr-TR": isMale ? "tr-TR-Neural2-E" : "tr-TR-Neural2-A",
    "th-TH": isMale ? "th-TH-Neural2-C" : "th-TH-Neural2-A",
    "vi-VN": isMale ? "vi-VN-Neural2-D" : "vi-VN-Neural2-A",
    "el-GR": isMale ? "el-GR-Neural2-B" : "el-GR-Neural2-A",
    "id-ID": isMale ? "id-ID-Neural2-C" : "id-ID-Neural2-A",
    "da-DK": isMale ? "da-DK-Neural2-D" : "da-DK-Neural2-A",
    "fi-FI": isMale ? "fi-FI-Neural2-B" : "fi-FI-Neural2-A",
    "nb-NO": isMale ? "nb-NO-Neural2-D" : "nb-NO-Neural2-A",
  };

  // Try exact match first, then language prefix
  if (voiceMap[lang]) return voiceMap[lang];
  const prefix = Object.keys(voiceMap).find(k => k.startsWith(lang.split("-")[0]));
  if (prefix) return voiceMap[prefix];
  // Fallback: return empty string and let Google auto-select
  return "";
}

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

    // ── Places Nearby Search ──
    if (action === "places_nearby") {
      const { latitude, longitude, radius, type, keyword } = body;
      if (!latitude || !longitude) return Response.json({ error: "Missing coordinates" }, { status: 400, headers: corsHeaders });
      let url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${latitude},${longitude}&radius=${radius || 3000}&key=${GOOGLE_API_KEY}`;
      if (type) url += `&type=${type}`;
      if (keyword) url += `&keyword=${encodeURIComponent(keyword)}`;
      const res = await fetch(url);
      const data = await res.json();
      return Response.json({ results: data.results || [], status: data.status }, { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // ── Places Text Search ──
    if (action === "places_search") {
      const { query } = body;
      if (!query) return Response.json({ error: "Missing query" }, { status: 400, headers: corsHeaders });
      const res = await fetch(`https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${GOOGLE_API_KEY}`);
      const data = await res.json();
      return Response.json({ results: data.results || [], status: data.status }, { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // ── Directions ──
    if (action === "directions") {
      const { origin, destination, mode } = body;
      if (!origin || !destination) return Response.json({ error: "Missing origin/destination" }, { status: 400, headers: corsHeaders });
      const res = await fetch(`https://maps.googleapis.com/maps/api/directions/json?origin=${origin}&destination=${destination}&mode=${mode || "walking"}&key=${GOOGLE_API_KEY}`);
      const data = await res.json();
      return Response.json(data, { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // ── Text-to-Speech (Google Cloud TTS with Neural2 voices) ──
    if (action === "tts") {
      const { text, languageCode, voiceGender } = body;
      if (!text) return Response.json({ error: "Missing text" }, { status: 400, headers: corsHeaders });

      const lang = languageCode || "en-US";
      // Use Neural2 voices for natural sound — fall back to Standard if unavailable
      const voiceName = getVoiceName(lang, voiceGender || "FEMALE");

      const res = await fetch(`https://texttospeech.googleapis.com/v1/text:synthesize?key=${GOOGLE_API_KEY}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          input: { text },
          voice: {
            languageCode: lang,
            name: voiceName,
            ssmlGender: voiceGender || "FEMALE",
          },
          audioConfig: {
            audioEncoding: "MP3",
            speakingRate: 0.95,
            pitch: 0,
            volumeGainDb: 0,
          },
        }),
      });

      const data = await res.json();
      if (data.error) {
        return Response.json({ error: data.error.message || "TTS failed" }, { status: 500, headers: corsHeaders });
      }
      return Response.json(
        { audioContent: data.audioContent, voiceName },
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── Place Photo URL ──
    if (action === "place_photo") {
      const { photoReference, maxWidth } = body;
      if (!photoReference) return Response.json({ error: "Missing photoReference" }, { status: 400, headers: corsHeaders });
      return Response.json(
        { url: `https://maps.googleapis.com/maps/api/place/photo?maxwidth=${maxWidth || 800}&photo_reference=${photoReference}&key=${GOOGLE_API_KEY}` },
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
