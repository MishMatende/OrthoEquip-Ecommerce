import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  // ✅ CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const bodyText = await req.text();
    if (!bodyText) {
      return new Response("Empty body", {
        status: 400,
        headers: corsHeaders,
      });
    }

    const { phone, amount, order_id } = JSON.parse(bodyText);

    if (!phone || !amount || !order_id) {
      return new Response("Missing fields", {
        status: 400,
        headers: corsHeaders,
      });
    }

    const res = await fetch(
      "https://api.intasend.com/api/v1/payment/mpesa-stk-push/",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${Deno.env.get("INTASEND_SECRET_KEY")}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          phone_number: phone,
          amount,
          currency: "KES",
          wallet_id: Deno.env.get("INTASEND_WALLET_ID"),
          api_ref: order_id,
        }),
      }
    );

    const text = await res.text();

    let data;
    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      data = { raw: text };
    }

    console.log("INTASEND:", res.status, data);

    return new Response(JSON.stringify({ status: res.status, data }), {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    });
  } catch (e) {
    console.error("STK ERROR:", e);
    return new Response("STK failed", {
      status: 500,
      headers: corsHeaders,
    });
  }
});
