/**
 * TRANSCRIBE AUDIO — Whisper Speech-to-Text Edge Function
 *
 * Receives base64-encoded audio and returns transcribed text using OpenAI Whisper.
 * Used by the Journal voice memo feature.
 */

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getUserIdFromRequest } from '../_shared/auth.ts';
import {
  beginAiInputGuard,
  setAiInputDedupeCache,
} from '../_shared/aiInputGuard.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-clerk-token',
};

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY') || '';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') || Deno.env.get('SUPABASE_ANON_PUBLIC_KEY') || '';
const MAX_AUDIO_BYTES = 12 * 1024 * 1024;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const bodyJson = await req.json();
    const { audioBase64, mimeType = 'audio/m4a' } = bodyJson;

    if (!audioBase64) {
      return new Response(
        JSON.stringify({ error: 'audioBase64 is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const guard = await beginAiInputGuard<{ success: boolean; transcription: string }>({
      req,
      body: bodyJson,
      supabase,
      kind: 'transcribe_audio',
      fieldName: 'audioBase64',
      maxBytes: MAX_AUDIO_BYTES,
      allowedMimeTypes: [
        'audio/m4a',
        'audio/mp4',
        'audio/x-m4a',
        'audio/wav',
        'audio/webm',
        'audio/ogg',
        'audio/mpeg',
        'audio/mp3',
      ],
      mimeType,
      corsHeaders,
      resolveUserId: () =>
        getUserIdFromRequest(req, bodyJson, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_ANON_KEY),
    });
    if (guard.response) return guard.response;

    if (!OPENAI_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'OpenAI API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // Decode base64 to binary
    const binaryString = atob(bodyJson.audioBase64);
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
    const responseBody = { success: true, transcription: transcription.trim() };
    if (guard.userId && guard.payloadHash) {
      await setAiInputDedupeCache(
        supabase,
        'transcribe_audio',
        guard.userId,
        guard.payloadHash,
        responseBody
      );
    }

    return new Response(
      JSON.stringify(responseBody),
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
