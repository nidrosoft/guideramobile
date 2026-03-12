import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const DIDIT_API_URL = "https://verification.didit.me/v3/session/";
const DIDIT_API_KEY = Deno.env.get("DIDIT_API_KEY") ?? "";
const DIDIT_WORKFLOW_ID = Deno.env.get("DIDIT_WORKFLOW_ID") ?? "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const {
      application_id,
      first_name,
      last_name,
      date_of_birth,
      email,
      phone,
    } = await req.json();

    if (!application_id) {
      return Response.json(
        { error: "application_id is required" },
        { status: 400, headers: corsHeaders }
      );
    }

    if (!DIDIT_API_KEY || !DIDIT_WORKFLOW_ID) {
      console.error("Missing DIDIT_API_KEY or DIDIT_WORKFLOW_ID");
      return Response.json(
        { error: "Verification service not configured" },
        { status: 500, headers: corsHeaders }
      );
    }

    // Build the Didit session request — only required fields
    const webhookUrl = `${SUPABASE_URL}/functions/v1/didit-webhook`;

    const sessionBody: Record<string, any> = {
      workflow_id: DIDIT_WORKFLOW_ID,
      vendor_data: application_id,
      callback: webhookUrl,
      language: "en",
    };

    // Check if application already has a session
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { data: existingApp } = await supabase
      .from("partner_applications")
      .select("didit_session_id, didit_verification_status")
      .eq("id", application_id)
      .maybeSingle();

    if (existingApp?.didit_session_id && existingApp.didit_verification_status === "in_progress") {
      // Return existing session info - fetch it from Didit
      console.log("[didit-create-session] Reusing existing session:", existingApp.didit_session_id);
      return Response.json(
        {
          session_id: existingApp.didit_session_id,
          verification_url: `https://verify.didit.me/en/session/${existingApp.didit_session_id}`,
          status: "Not Started",
        },
        { headers: corsHeaders }
      );
    }

    console.log("[didit-create-session] Creating session for application:", application_id, "body:", JSON.stringify(sessionBody));

    // Call Didit API
    const diditResponse = await fetch(DIDIT_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": DIDIT_API_KEY,
      },
      body: JSON.stringify(sessionBody),
    });

    if (!diditResponse.ok) {
      const errText = await diditResponse.text();
      console.error("[didit-create-session] Didit API error:", diditResponse.status, errText);
      return Response.json(
        { error: `Didit API error (${diditResponse.status}): ${errText}` },
        { status: 502, headers: corsHeaders }
      );
    }

    const diditData = await diditResponse.json();
    console.log("[didit-create-session] Session created:", JSON.stringify(diditData));

    const { error: updateError } = await supabase
      .from("partner_applications")
      .update({
        didit_session_id: diditData.session_id,
        didit_verification_status: "in_progress",
        status: "identity_verification",
        updated_at: new Date().toISOString(),
      })
      .eq("id", application_id);

    if (updateError) {
      console.error("[didit-create-session] DB update error:", updateError);
    }

    return Response.json(
      {
        session_id: diditData.session_id,
        session_token: diditData.session_token,
        verification_url: diditData.verification_url || diditData.url,
        status: diditData.status,
      },
      { headers: corsHeaders }
    );
  } catch (err) {
    console.error("[didit-create-session] Error:", err);
    return Response.json(
      { error: "Internal server error" },
      { status: 500, headers: corsHeaders }
    );
  }
});
