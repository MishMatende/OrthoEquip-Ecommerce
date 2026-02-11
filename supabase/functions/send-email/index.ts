import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { Resend } from "npm:resend";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  // Handle preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { to, subject, html } = await req.json();

    if (!to || !subject || !html) {
      return new Response(
        JSON.stringify({ error: "Missing email fields" }),
        { status: 400, headers: corsHeaders }
      );
    }

    const { data, error } = await resend.emails.send({
      from: "Balm Ortho Medical Supplies <quotes@balmorthomedical.com>",
      to,
      subject,
      html,
    });

    if (error) {
      console.error("Resend error:", error);
      return new Response(JSON.stringify(error), {
        status: 500,
        headers: corsHeaders,
      });
    }

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: corsHeaders,
    });
  } catch (err) {
    console.error("Email function error:", err);
    return new Response(
      JSON.stringify({ error: "Failed to send email" }),
      { status: 500, headers: corsHeaders }
    );
  }
});
