import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") || "";
const FEEDBACK_EMAIL = "feedback@guidera.one";

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
      },
    });
  }

  try {
    const { errorName, errorMessage, componentStack, userEmail, deviceInfo, appVersion } = await req.json();

    if (!errorName || !errorMessage) {
      return new Response(JSON.stringify({ error: "Missing error details" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Build the email HTML
    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: #1a1a1a; border-radius: 12px; padding: 24px; margin-bottom: 16px;">
          <h2 style="color: #EF4444; margin: 0 0 8px 0; font-size: 18px;">🚨 Crash Report</h2>
          <p style="color: #999; margin: 0; font-size: 13px;">${new Date().toISOString()}</p>
        </div>

        <div style="background: #f8f8f8; border-radius: 12px; padding: 20px; margin-bottom: 16px;">
          <h3 style="color: #333; margin: 0 0 8px 0;">Error</h3>
          <p style="color: #EF4444; font-weight: 600; margin: 0 0 4px 0;">${errorName}</p>
          <p style="color: #666; margin: 0;">${errorMessage}</p>
        </div>

        ${componentStack ? `
        <div style="background: #1a1a1a; border-radius: 12px; padding: 20px; margin-bottom: 16px;">
          <h3 style="color: #ccc; margin: 0 0 8px 0; font-size: 14px;">Component Stack</h3>
          <pre style="color: #999; font-size: 11px; line-height: 1.5; white-space: pre-wrap; margin: 0; overflow-x: auto;">${componentStack}</pre>
        </div>
        ` : ''}

        ${userEmail ? `
        <div style="background: #f0fdf4; border-radius: 12px; padding: 16px; margin-bottom: 16px;">
          <p style="color: #166534; margin: 0;"><strong>User Contact:</strong> ${userEmail}</p>
        </div>
        ` : ''}

        ${deviceInfo ? `
        <div style="background: #f8f8f8; border-radius: 12px; padding: 16px;">
          <h3 style="color: #333; margin: 0 0 8px 0; font-size: 14px;">Device Info</h3>
          <p style="color: #666; margin: 0; font-size: 12px;">${deviceInfo}</p>
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
