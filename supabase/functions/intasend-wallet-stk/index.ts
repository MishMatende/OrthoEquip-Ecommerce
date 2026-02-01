import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

serve(async (req) => {
  try {
    const { phone, amount, order_id } = await req.json();

    if (!phone || !amount || !order_id) {
      return new Response("Missing fields", { status: 400 });
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

    const data = await res.json();

    return new Response(JSON.stringify(data), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error(e);
    return new Response("STK failed", { status: 500 });
  }
});
