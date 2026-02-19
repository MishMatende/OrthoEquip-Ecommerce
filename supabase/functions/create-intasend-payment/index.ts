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
    const INTASEND_API_KEY = Deno.env.get("INTASEND_API_KEY"); // public key
    const INTASEND_SECRET_KEY = Deno.env.get("INTASEND_SECRET_KEY"); // secret key
    const INTASEND_WALLET_ID = Deno.env.get("INTASEND_WALLET_ID");

    if (!INTASEND_API_KEY || !INTASEND_SECRET_KEY) {
      return new Response(
        JSON.stringify({ error: "Missing IntaSend API keys in environment" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const body = await req.json();

    const {
      orderId,
      amount,
      customer_name,
      customer_email,
      customer_phone,
      redirect_url,
    } = body;

    if (!orderId || !amount || !redirect_url) {
      return new Response(
        JSON.stringify({
          error: "Missing required fields (orderId, amount, redirect_url)",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Create IntaSend payment link
    const intasendRes = await fetch(
      "https://api.intasend.com/api/v1/checkout/",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${INTASEND_SECRET_KEY}`,
        },
        body: JSON.stringify({
          public_key: INTASEND_API_KEY,
          wallet_id: INTASEND_WALLET_ID,
          amount: Number(amount),
          currency: "KES",
          email: customer_email,
          phone_number: customer_phone,
          first_name: customer_name || "Customer",
          redirect_url,
          metadata: {
            order_id: orderId,
          },
        }),
      },
    );

    const data = await intasendRes.json();

    if (!intasendRes.ok) {
      console.error("IntaSend error response:", data);

      return new Response(
        JSON.stringify({
          error: "Failed to create payment link",
          details: data,
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const paymentUrl = data?.url || data?.checkout_url;

    if (!paymentUrl) {
      return new Response(
        JSON.stringify({
          error: "IntaSend response missing payment url",
          data,
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    return new Response(JSON.stringify({ payment_url: paymentUrl }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Edge function error:", err);

    return new Response(
      JSON.stringify({ error: "Server error", details: String(err) }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
