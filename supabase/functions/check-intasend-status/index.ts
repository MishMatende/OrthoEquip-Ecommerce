import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { order_id } = await req.json();

    const res = await fetch(
      "https://api.intasend.com/api/v1/payment/status/",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${Deno.env.get("INTASEND_SECRET_KEY")}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ api_ref: order_id }),
      }
    );

    const data = await res.json();

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error(e);
    return new Response("Status check failed", {
      status: 500,
      headers: corsHeaders,
    });
  }
});
