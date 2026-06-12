import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { checkRateLimit, rateLimitResponse } from "../_shared/rateLimiter.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") || "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const FEEDBACK_EMAIL = "feedback@guidera.one";

// SEC-05: Durable rate limiter (DB-backed, survives cold starts/redeploys)
const RATE_LIMIT = {
  maxRequests: 5,
  windowMinutes: 60,
  identifier: "send-crash-report",
};

Deno.serve(async (req: Request) => {
  const corsH = {
    "Access-Control-Allow-Origin": "",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  };

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsH });
  }

  try {
    // SEC-05: Rate limit by IP — 5 reports per hour max, persisted in the DB
    const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
      || req.headers.get("cf-connecting-ip")
      || "unknown";
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const limit = await checkRateLimit(supabase, `ip:${clientIp}`, RATE_LIMIT);
    if (!limit.allowed) {
      return rateLimitResponse(limit, corsH);
    }

    const body = await req.json();

    // SEC-05: Payload size validation
    const bodyStr = JSON.stringify(body);
    if (bodyStr.length > 50000) {
      return new Response(JSON.stringify({ error: "Payload too large" }), {
        status: 413,
        headers: { ...corsH, "Content-Type": "application/json" },
      });
    }

    const { errorName, errorMessage, componentStack, userEmail, deviceInfo, appVersion } = body;

    if (!errorName || !errorMessage) {
      return new Response(JSON.stringify({ error: "Missing error details" }), {
        status: 400,
        headers: { ...corsH, "Content-Type": "application/json" },
      });
    }

    // SECURITY: Escape HTML to prevent injection attacks
    const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

    const safeErrorName = esc(String(errorName).substring(0, 200));
    const safeErrorMessage = esc(String(errorMessage).substring(0, 2000));
    const safeStack = componentStack ? esc(String(componentStack).substring(0, 5000)) : '';
    const safeEmail = userEmail ? esc(String(userEmail).substring(0, 200)) : '';
    const safeDeviceInfo = deviceInfo ? esc(String(deviceInfo).substring(0, 500)) : '';

    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: #1a1a1a; border-radius: 12px; padding: 24px; margin-bottom: 16px;">
          <h2 style="color: #EF4444; margin: 0 0 8px 0; font-size: 18px;">🚨 Crash Report</h2>
          <p style="color: #999; margin: 0; font-size: 13px;">${new Date().toISOString()}</p>
        </div>

        <div style="background: #f8f8f8; border-radius: 12px; padding: 20px; margin-bottom: 16px;">
          <h3 style="color: #333; margin: 0 0 8px 0;">Error</h3>
          <p style="color: #EF4444; font-weight: 600; margin: 0 0 4px 0;">${safeErrorName}</p>
          <p style="color: #666; margin: 0;">${safeErrorMessage}</p>
        </div>

        ${safeStack ? `
        <div style="background: #1a1a1a; border-radius: 12px; padding: 20px; margin-bottom: 16px;">
          <h3 style="color: #ccc; margin: 0 0 8px 0; font-size: 14px;">Component Stack</h3>
          <pre style="color: #999; font-size: 11px; line-height: 1.5; white-space: pre-wrap; margin: 0; overflow-x: auto;">${safeStack}</pre>
        </div>
        ` : ''}

        ${safeEmail ? `
        <div style="background: #f0fdf4; border-radius: 12px; padding: 16px; margin-bottom: 16px;">
          <p style="color: #166534; margin: 0;"><strong>User Contact:</strong> ${safeEmail}</p>
        </div>
        ` : ''}

        ${safeDeviceInfo ? `
        <div style="background: #f8f8f8; border-radius: 12px; padding: 16px;">
          <h3 style="color: #333; margin: 0 0 8px 0; font-size: 14px;">Device Info</h3>
          <p style="color: #666; margin: 0; font-size: 12px;">${safeDeviceInfo}</p>
        </div>
        ` : ''}
      </div>
    `;

    // Send via Resend
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Guidera Crash Reports <noreply@guidera.one>",
        to: [FEEDBACK_EMAIL],
        subject: `[Crash] ${errorName}: ${errorMessage.substring(0, 80)}`,
        html,
        reply_to: userEmail || undefined,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("[send-crash-report] Resend error:", errText);
      return new Response(JSON.stringify({ error: "Failed to send report", detail: errText }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const data = await res.json();
    return new Response(JSON.stringify({ success: true, id: data.id }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[send-crash-report] Error:", err);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
