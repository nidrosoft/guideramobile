/**
 * TRANSCRIBE AUDIO — Whisper Speech-to-Text Edge Function
 *
 * Receives base64-encoded audio and returns transcribed text using OpenAI Whisper.
 * Used by the Journal voice memo feature.
 */

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY') || '';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { audioBase64, mimeType } = await req.json();

    if (!audioBase64) {
      return new Response(
        JSON.stringify({ error: 'audioBase64 is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    if (!OPENAI_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'OpenAI API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // Decode base64 to binary
    const binaryString = atob(audioBase64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    // Determine file extension from MIME type
    const ext = mimeType?.includes('mp4') ? 'm4a'
      : mimeType?.includes('wav') ? 'wav'
      : mimeType?.includes('webm') ? 'webm'
      : mimeType?.includes('ogg') ? 'ogg'
      : 'm4a'; // default for iOS

    // Build multipart form data for Whisper API
    const boundary = '----FormBoundary' + Date.now();
    const formParts: Uint8Array[] = [];
    const enc = new TextEncoder();

    // File field
    formParts.push(enc.encode(
      `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="audio.${ext}"\r\nContent-Type: ${mimeType || 'audio/m4a'}\r\n\r\n`
    ));
    formParts.push(bytes);
    formParts.push(enc.encode('\r\n'));

    // Model field
    formParts.push(enc.encode(
      `--${boundary}\r\nContent-Disposition: form-data; name="model"\r\n\r\nwhisper-1\r\n`
    ));

    // Response format
    formParts.push(enc.encode(
      `--${boundary}\r\nContent-Disposition: form-data; name="response_format"\r\n\r\ntext\r\n`
    ));

    // End boundary
    formParts.push(enc.encode(`--${boundary}--\r\n`));

    // Combine all parts
    const totalLength = formParts.reduce((sum, part) => sum + part.length, 0);
    const body = new Uint8Array(totalLength);
    let offset = 0;
    for (const part of formParts) {
      body.set(part, offset);
      offset += part.length;
    }

    // Call OpenAI Whisper
    const res = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
      },
      body: body,
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Whisper API error ${res.status}: ${errText}`);
    }

    const transcription = await res.text();

    return new Response(
      JSON.stringify({ success: true, transcription: transcription.trim() }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (err: any) {
    console.error('transcribe-audio error:', err);
    return new Response(
      JSON.stringify({ error: err.message || 'Transcription failed' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
