import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY") || "";
const ELEVENLABS_API_KEY = Deno.env.get("ELEVENLABS_API_KEY") || "";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * TTS EDGE FUNCTION
 * 
 * Primary: OpenAI TTS (tts-1 model, 6 natural voices)
 * Fallback: ElevenLabs (most human-sounding voices)
 * Last resort: Returns error (client falls back to expo-speech on-device)
 * 
 * Retry: Up to 2 retries with 1s delay on primary before falling to secondary.
 * 
 * POST body:
 *   text: string          — Text to speak
 *   language: string      — Language code (e.g. 'en', 'fr', 'es')
 *   voiceGender: string   — 'MALE' or 'FEMALE'
 *   speed: number         — 0.5 to 2.0 (default 1.0)
 */

// OpenAI voice mapping — 6 voices available
// alloy: neutral, echo: male, fable: British male, onyx: deep male, nova: female, shimmer: soft female
const OPENAI_VOICES: Record<string, { male: string; female: string }> = {
  default: { male: "onyx", female: "nova" },
};

// ElevenLabs multilingual voice IDs (from their free/starter voices)
const ELEVENLABS_VOICES = {
  female: "21m00Tcm4TlvDq8ikWAM", // Rachel — calm, clear female
  male: "ErXwobaYiN019PkySvjV",   // Antoni — warm male
};

/**
 * Call OpenAI TTS API. Returns base64 MP3 audio.
 */
async function callOpenAI(
  text: string,
  voice: string,
  speed: number,
): Promise<string> {
  const response = await fetch("https://api.openai.com/v1/audio/speech", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini-tts",
      input: text,
      voice,
      speed,
      response_format: "mp3",
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`OpenAI TTS error ${response.status}: ${errText}`);
  }

  // Response is binary MP3 — convert to base64
  const arrayBuffer = await response.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Call ElevenLabs TTS API. Returns base64 MP3 audio.
 */
async function callElevenLabs(
  text: string,
  voiceId: string,
): Promise<string> {
  const response = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
    {
      method: "POST",
      headers: {
        "xi-api-key": ELEVENLABS_API_KEY,
        "Content-Type": "application/json",
        "Accept": "audio/mpeg",
      },
      body: JSON.stringify({
        text,
        model_id: "eleven_multilingual_v2",
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
          style: 0.3,
        },
      }),
    },
  );

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`ElevenLabs error ${response.status}: ${errText}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Retry helper — retries a function up to maxRetries times with delay.
 */
async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number,
  delayMs: number,
  label: string,
): Promise<T> {
  let lastError: Error | null = null;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err as Error;
      if (attempt < maxRetries) {
        console.warn(`[tts] ${label} attempt ${attempt + 1} failed: ${lastError.message}. Retrying in ${delayMs}ms...`);
        await new Promise((r) => setTimeout(r, delayMs));
      }
    }
  }
  throw lastError;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    const { text, language, voiceGender, speed } = await req.json();

    if (!text || !text.trim()) {
      return Response.json(
        { error: "Missing text" },
        { status: 400, headers: corsHeaders },
      );
    }

    const isMale = voiceGender === "MALE";
    const ttsSpeed = Math.max(0.5, Math.min(2.0, speed || 1.0));
    let audioContent: string | null = null;
    let provider = "none";

    // ── PRIMARY: OpenAI TTS (with retry) ──
    if (OPENAI_API_KEY) {
      const openaiVoice = isMale
        ? OPENAI_VOICES.default.male
        : OPENAI_VOICES.default.female;

      try {
        audioContent = await withRetry(
          () => callOpenAI(text, openaiVoice, ttsSpeed),
          1,    // 1 retry (2 total attempts)
          1000, // 1 second delay between retries
          "OpenAI",
        );
        provider = "openai";
      } catch (err) {
        console.error("[tts] OpenAI failed after retries:", (err as Error).message);
      }
    }

    // ── FALLBACK: ElevenLabs ──
    if (!audioContent && ELEVENLABS_API_KEY) {
      const elevenVoice = isMale
        ? ELEVENLABS_VOICES.male
        : ELEVENLABS_VOICES.female;

      try {
        audioContent = await withRetry(
          () => callElevenLabs(text, elevenVoice),
          1,
          1000,
          "ElevenLabs",
        );
        provider = "elevenlabs";
      } catch (err) {
        console.error("[tts] ElevenLabs failed after retries:", (err as Error).message);
      }
    }

    if (!audioContent) {
      return Response.json(
        {
          error: "All TTS providers failed. Client should fall back to on-device speech.",
          providers_tried: [
            OPENAI_API_KEY ? "openai" : null,
            ELEVENLABS_API_KEY ? "elevenlabs" : null,
          ].filter(Boolean),
        },
        { status: 503, headers: corsHeaders },
      );
    }

    return Response.json(
      {
        audioContent,
        provider,
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
