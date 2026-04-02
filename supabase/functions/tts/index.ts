import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const GOOGLE_AI_API_KEY = Deno.env.get("GOOGLE_AI_API_KEY") || "";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * TTS EDGE FUNCTION
 *
 * Uses Gemini TTS for high-quality, natural speech synthesis.
 * 
 * Model chain (in priority order):
 *   1. gemini-2.5-flash-preview-tts — Dedicated TTS model, highest quality
 *   2. gemini-2.0-flash — Stable model with AUDIO response modality
 *
 * Both produce the same natural HD voices (Kore, Puck, Aoede, etc.)
 * and return PCM audio at 24kHz 16-bit mono.
 *
 * POST body:
 *   text: string       — Text to speak
 *   voiceName: string  — Voice name (e.g. 'Kore', 'Puck', 'Aoede', 'Charon', 'Fenrir')
 *   language: string   — Language hint (auto-detected, optional)
 */

const GEMINI_BASE = "https://generativelanguage.googleapis.com/v1beta";

// Model fallback chain: dedicated TTS first, then stable flash
const TTS_MODELS = [
  "gemini-2.5-flash-preview-tts",
  "gemini-2.0-flash",
];

const DEFAULT_VOICE = "Kore";

/**
 * Call Gemini TTS with a specific model. Returns base64-encoded raw PCM audio.
 */
async function callGeminiTTS(
  apiKey: string,
  model: string,
  text: string,
  voiceName: string,
  timeoutMs = 15000,
): Promise<string> {
  const url = `${GEMINI_BASE}/models/${model}:generateContent?key=${apiKey}`;

  const body = {
    contents: [{ parts: [{ text }] }],
    generationConfig: {
      responseModalities: ["AUDIO"],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName },
        },
      },
    },
  };

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Gemini TTS (${model}) error ${response.status}: ${errText}`);
    }

    const data = await response.json();
    const audioData =
      data.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!audioData) throw new Error("No audio data returned from Gemini TTS");

    return audioData;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Convert raw PCM (16-bit, 24kHz, mono) to WAV by prepending a 44-byte header.
 */
function pcmToWav(pcmBase64: string): string {
  const pcmBytes = Uint8Array.from(atob(pcmBase64), (c) => c.charCodeAt(0));
  const numChannels = 1;
  const sampleRate = 24000;
  const bitsPerSample = 16;
  const byteRate = (sampleRate * numChannels * bitsPerSample) / 8;
  const blockAlign = (numChannels * bitsPerSample) / 8;
  const dataSize = pcmBytes.length;
  const headerSize = 44;
  const fileSize = headerSize + dataSize;

  const buffer = new ArrayBuffer(fileSize);
  const view = new DataView(buffer);

  const writeString = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  };

  writeString(0, "RIFF");
  view.setUint32(4, fileSize - 8, true);
  writeString(8, "WAVE");
  writeString(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitsPerSample, true);
  writeString(36, "data");
  view.setUint32(40, dataSize, true);

  const wavBytes = new Uint8Array(buffer);
  wavBytes.set(pcmBytes, headerSize);

  let binary = "";
  for (let i = 0; i < wavBytes.length; i++) {
    binary += String.fromCharCode(wavBytes[i]);
  }
  return btoa(binary);
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    const { text, voiceName } = await req.json();

    if (!text || !text.trim()) {
      return Response.json(
        { error: "Missing text" },
        { status: 400, headers: corsHeaders },
      );
    }

    if (!GOOGLE_AI_API_KEY) {
      return Response.json(
        { error: "GOOGLE_AI_API_KEY not configured" },
        { status: 500, headers: corsHeaders },
      );
    }

    const voice = voiceName || DEFAULT_VOICE;

    // Try each model in the fallback chain
    let pcmBase64: string | null = null;
    let usedModel = "";

    for (const model of TTS_MODELS) {
      try {
        console.log(`[tts] Trying model ${model} with voice ${voice}...`);
        const modelStart = Date.now();
        pcmBase64 = await callGeminiTTS(GOOGLE_AI_API_KEY, model, text, voice);
        usedModel = model;
        console.log(`[tts] ${model} succeeded in ${Date.now() - modelStart}ms`);
        break;
      } catch (err) {
        console.warn(`[tts] ${model} failed: ${(err as Error).message}`);
        // continue to next model
      }
    }

    if (!pcmBase64) {
      console.error("[tts] All models failed");
      return Response.json(
        {
          error:
            "TTS generation failed. Client should fall back to on-device speech.",
        },
        { status: 503, headers: corsHeaders },
      );
    }

    const wavBase64 = pcmToWav(pcmBase64);

    return Response.json(
      {
        audioContent: wavBase64,
        audioFormat: "wav",
        provider: "gemini",
        voiceName: voice,
        model: usedModel,
        duration: Date.now() - startTime,
      },
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("[tts] Unexpected error:", err);
    return Response.json(
      { error: (err as Error).message || "TTS failed" },
      { status: 500, headers: corsHeaders },
    );
  }
});
