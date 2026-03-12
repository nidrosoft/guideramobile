import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const DIDIT_API_URL = "https://verification.didit.me/v3/session/";
const DIDIT_API_KEY = Deno.env.get("DIDIT_API_KEY") ?? "";
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
    const { application_id } = await req.json();

    if (!application_id) {
      return Response.json(
        { error: "application_id is required" },
        { status: 400, headers: corsHeaders }
      );
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Get the application to find the Didit session ID
    const { data: app, error: appError } = await supabase
      .from("partner_applications")
      .select("didit_session_id, didit_verification_status, status")
      .eq("id", application_id)
      .single();

    if (appError || !app) {
      return Response.json(
        { error: "Application not found" },
        { status: 404, headers: corsHeaders }
      );
    }

    // If no session yet, return current DB status
    if (!app.didit_session_id) {
      return Response.json(
        {
          verification_status: app.didit_verification_status || "not_started",
          application_status: app.status,
          didit_live_status: null,
          verification_details: null,
        },
        { headers: corsHeaders }
      );
    }

    // Poll Didit API for live status
    let diditLiveStatus: string | null = null;
    let verificationDetails: Record<string, any> | null = null;

    if (DIDIT_API_KEY) {
      try {
        const diditResponse = await fetch(
          `${DIDIT_API_URL}${app.didit_session_id}/decision/`,
          {
            method: "GET",
            headers: {
              "x-api-key": DIDIT_API_KEY,
            },
          }
        );

        if (diditResponse.ok) {
          const diditData = await diditResponse.json();
          diditLiveStatus = diditData.status;

          // Map Didit status to internal
          // Must match DB check constraint: not_started, in_progress, approved, declined, expired, abandoned
          const statusMap: Record<string, string> = {
            "Approved": "approved",
            "Declined": "declined",
            "In Review": "in_progress",
            "Not Started": "not_started",
          };
          const internalStatus = statusMap[diditData.status] || "in_progress";

          // Sync status to DB if changed
          if (internalStatus && internalStatus !== app.didit_verification_status) {
            const updateData: Record<string, any> = {
              didit_verification_status: internalStatus,
              updated_at: new Date().toISOString(),
            };
            if (internalStatus === "approved") {
              updateData.status = "approved";
            } else if (internalStatus === "declined") {
              updateData.status = "rejected";
            }

            await supabase
              .from("partner_applications")
              .update(updateData)
              .eq("id", application_id);

            app.didit_verification_status = internalStatus;
            app.status = updateData.status || app.status;
          }

          // Extract key verification details
          const idVerification = diditData.id_verifications?.[0];
          const livenessCheck = diditData.liveness_checks?.[0];
          const faceMatch = diditData.face_matches?.[0];
          const amlScreening = diditData.aml_screenings?.[0];
          const ipAnalysis = diditData.ip_analyses?.[0];

          verificationDetails = {
            ...(idVerification && {
              id_first_name: idVerification.first_name,
              id_last_name: idVerification.last_name,
              id_nationality: idVerification.nationality,
            }),
            ...(livenessCheck && {
              liveness_status: livenessCheck.status,
            }),
            ...(faceMatch && {
              face_match_status: faceMatch.status,
            }),
            ...(amlScreening && {
              aml_status: amlScreening.status,
            }),
            ...(ipAnalysis && {
              is_vpn_or_tor: ipAnalysis.is_vpn_or_tor,
            }),
            created_at: diditData.created_at,
          };
        } else {
          console.warn("[didit-check-status] Didit API returned:", diditResponse.status);
        }
      } catch (pollErr) {
        console.warn("[didit-check-status] Didit API poll error:", pollErr);
      }
    }

    // Also check partner_verifications for webhook-delivered details
    if (!verificationDetails) {
      const { data: verification } = await supabase
        .from("partner_verifications")
        .select("*")
        .eq("application_id", application_id)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (verification) {
        verificationDetails = {
          id_first_name: verification.id_first_name,
          id_last_name: verification.id_last_name,
          id_nationality: verification.id_nationality,
          liveness_status: verification.liveness_status,
          face_match_status: verification.face_match_status,
          aml_status: verification.aml_status,
          phone_verified: verification.phone_verified,
          is_vpn_or_tor: verification.is_vpn_or_tor,
          created_at: verification.created_at,
        };
      }
    }

    return Response.json(
      {
        verification_status: app.didit_verification_status,
        application_status: app.status,
        didit_live_status: diditLiveStatus,
        verification_details: verificationDetails,
      },
      { headers: corsHeaders }
    );
  } catch (err) {
    console.error("[didit-check-status] Error:", err);
    return Response.json(
      { error: "Internal server error" },
      { status: 500, headers: corsHeaders }
    );
  }
});
