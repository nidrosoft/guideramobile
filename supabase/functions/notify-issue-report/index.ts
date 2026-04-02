import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") || "";
const TEAM_EMAIL = "feedback@guidera.one";
const CC_EMAIL = "cyriac@nidrosoft.com";

const corsHeaders = {
  "Access-Control-Allow-Origin": "",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const esc = (s: string) =>
  s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const CATEGORY_LABELS: Record<string, string> = {
  booking: "Booking Issue",
  trip: "Trip Planning",
  community: "Community",
  app: "App Problem",
  account: "Account Issue",
  other: "Other",
};

const PRIORITY_COLORS: Record<string, string> = {
  low: "#22C55E",
  medium: "#F59E0B",
  high: "#EF4444",
};

function buildTeamEmailHtml(report: Record<string, unknown>): string {
  const category = esc(String(report.category || "unknown"));
  const categoryLabel = CATEGORY_LABELS[category] || category;
  const priority = String(report.priority || "medium");
  const priorityColor = PRIORITY_COLORS[priority] || "#F59E0B";
  const title = esc(String(report.title || "No title"));
  const description = esc(String(report.description || "")).replace(
    /\n/g,
    "<br>"
  );
  const userEmail = esc(String(report.user_email || "Unknown"));
  const deviceInfo = report.device_info as Record<string, unknown> | null;
  const platform = deviceInfo
    ? esc(String(deviceInfo.platform || "unknown"))
    : "N/A";
  const osVersion = deviceInfo ? String(deviceInfo.version || "") : "";
  const userName = deviceInfo ? String(deviceInfo.user_name || "") : "";
  const userLocation = deviceInfo ? String(deviceInfo.user_location || "") : "";
  const createdAt = report.created_at
    ? new Date(String(report.created_at)).toLocaleString("en-US", {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : new Date().toLocaleString();

  const fromDisplay = userName ? `${esc(userName)} (${userEmail})` : userEmail;

  return `
<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:600px;margin:0 auto;padding:20px;background:#ffffff;">
  <div style="background:#0F172A;border-radius:12px;padding:24px;margin-bottom:16px;">
    <h2 style="color:#FFFFFF;margin:0 0 4px 0;font-size:20px;">📋 New Issue Report</h2>
    <p style="color:#94A3B8;margin:0;font-size:13px;">${createdAt}</p>
  </div>

  <div style="background:#F8FAFC;border-radius:12px;padding:20px;margin-bottom:16px;border-left:4px solid ${priorityColor};">
    <table style="width:100%;border-collapse:collapse;">
      <tr><td style="color:#64748B;padding:4px 12px 4px 0;font-size:13px;white-space:nowrap;vertical-align:top;">Category</td><td style="color:#1E293B;padding:4px 0;font-size:14px;font-weight:600;">${categoryLabel}</td></tr>
      <tr><td style="color:#64748B;padding:4px 12px 4px 0;font-size:13px;white-space:nowrap;vertical-align:top;">Priority</td><td style="padding:4px 0;"><span style="background:${priorityColor};color:#fff;padding:2px 10px;border-radius:12px;font-size:12px;font-weight:600;text-transform:uppercase;">${priority}</span></td></tr>
      <tr><td style="color:#64748B;padding:4px 12px 4px 0;font-size:13px;white-space:nowrap;vertical-align:top;">From</td><td style="color:#1E293B;padding:4px 0;font-size:14px;">${fromDisplay}</td></tr>${userLocation ? `
      <tr><td style="color:#64748B;padding:4px 12px 4px 0;font-size:13px;white-space:nowrap;vertical-align:top;">Location</td><td style="color:#1E293B;padding:4px 0;font-size:14px;">${esc(userLocation)}</td></tr>` : ""}
      <tr><td style="color:#64748B;padding:4px 12px 4px 0;font-size:13px;white-space:nowrap;vertical-align:top;">Device</td><td style="color:#1E293B;padding:4px 0;font-size:14px;">${platform}${osVersion ? " " + esc(osVersion) : ""}</td></tr>
    </table>
  </div>

  <div style="background:#FFFFFF;border:1px solid #E2E8F0;border-radius:12px;padding:20px;margin-bottom:16px;">
    <h3 style="color:#0F172A;margin:0 0 8px 0;font-size:16px;">${title}</h3>
    <p style="color:#475569;margin:0;font-size:14px;line-height:1.6;">${description}</p>
  </div>

  <div style="text-align:center;padding:12px;">
    <a href="https://supabase.com/dashboard/project/pkydmdygctojtfzbqcud/editor" style="color:#3B82F6;font-size:13px;text-decoration:none;">View in Supabase Dashboard →</a>
  </div>
</div>`;
}

function buildUserConfirmationHtml(
  title: string,
  category: string
): string {
  const categoryLabel = CATEGORY_LABELS[category] || category;

  return `
<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:600px;margin:0 auto;padding:20px;background:#ffffff;">
  <div style="text-align:center;padding:32px 20px;">
    <div style="width:64px;height:64px;background:#ECFDF5;border-radius:50%;margin:0 auto 16px;display:flex;align-items:center;justify-content:center;">
      <span style="font-size:32px;line-height:64px;">✅</span>
    </div>
    <h2 style="color:#0F172A;margin:0 0 8px 0;font-size:22px;">We've Received Your Report</h2>
    <p style="color:#64748B;margin:0 0 24px 0;font-size:15px;line-height:1.5;">
      Thank you for taking the time to report this issue. Your feedback helps us make Guidera better for everyone.
    </p>
  </div>

  <div style="background:#F8FAFC;border-radius:12px;padding:20px;margin-bottom:24px;">
    <table style="width:100%;border-collapse:collapse;">
      <tr><td style="color:#64748B;padding:6px 12px 6px 0;font-size:13px;">Issue</td><td style="color:#1E293B;padding:6px 0;font-size:14px;font-weight:600;">${esc(title)}</td></tr>
      <tr><td style="color:#64748B;padding:6px 12px 6px 0;font-size:13px;">Category</td><td style="color:#1E293B;padding:6px 0;font-size:14px;">${categoryLabel}</td></tr>
    </table>
  </div>

  <div style="background:#EFF6FF;border-radius:12px;padding:20px;margin-bottom:24px;">
    <h3 style="color:#1E40AF;margin:0 0 8px 0;font-size:14px;">What happens next?</h3>
    <ul style="color:#3B82F6;margin:0;padding-left:20px;font-size:14px;line-height:1.8;">
      <li>Our team will review your report within 24-48 hours</li>
      <li>We may reach out if we need additional details</li>
      <li>You'll receive an update once the issue is resolved</li>
    </ul>
  </div>

  <div style="text-align:center;padding:16px 0;border-top:1px solid #E2E8F0;">
    <p style="color:#94A3B8;margin:0;font-size:12px;">Guidera — Travel Smarter, Together</p>
  </div>
</div>`;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (!RESEND_API_KEY) {
    console.error("[notify-issue-report] RESEND_API_KEY not set");
    return new Response(
      JSON.stringify({ error: "Email service not configured" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  try {
    const body = await req.json();
    const { record } = body;

    if (!record) {
      return new Response(JSON.stringify({ error: "No record provided" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const results: { team?: string; user?: string; errors: string[] } = {
      errors: [],
    };

    // 1. Send notification to team (feedback@guidera.one + CC cyriac@nidrosoft.com)
    const teamRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Guidera Reports <noreply@guidera.one>",
        to: [TEAM_EMAIL],
        cc: [CC_EMAIL],
        subject: `[${String(record.priority || "medium").toUpperCase()}] ${CATEGORY_LABELS[record.category] || record.category}: ${String(record.title || "Issue Report").substring(0, 80)}`,
        html: buildTeamEmailHtml(record),
        reply_to: record.user_email || undefined,
      }),
    });

    if (teamRes.ok) {
      const data = await teamRes.json();
      results.team = data.id;
      console.log("[notify-issue-report] Team email sent:", data.id);
    } else {
      const err = await teamRes.text();
      console.error("[notify-issue-report] Team email failed:", err);
      results.errors.push(`Team email: ${err}`);
    }

    // 2. Send confirmation to user (if they have an email on file)
    if (record.user_email) {
      const userRes = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: "Guidera Support <support@guidera.one>",
          to: [record.user_email],
          subject: "We've received your report — Guidera Support",
          html: buildUserConfirmationHtml(
            String(record.title || "Your issue"),
            String(record.category || "other")
          ),
        }),
      });

      if (userRes.ok) {
        const data = await userRes.json();
        results.user = data.id;
        console.log(
          "[notify-issue-report] User confirmation sent:",
          data.id
        );
      } else {
        const err = await userRes.text();
        console.error("[notify-issue-report] User confirmation failed:", err);
        results.errors.push(`User email: ${err}`);
      }
    }

    return new Response(
      JSON.stringify({ success: true, ...results }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    console.error("[notify-issue-report] Error:", err);
    return new Response(
      JSON.stringify({
        error: err instanceof Error ? err.message : "Internal error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
