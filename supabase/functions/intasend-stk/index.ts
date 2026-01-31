import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const { phone, amount, order_id } = await req.json();

  if (!phone || !amount || !order_id) {
    return new Response(
      JSON.stringify({ error: "Missing fields" }),
      { status: 400 }
    );
  }

  const intasendRes = await fetch(
    "https://api.intasend.com/api/v1/payment/mpesa-stk-push/",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization:
          "Basic " +
          btoa(
            `${Deno.env.get("INTASEND_API_KEY")}:${Deno.env.get("INTASEND_SECRET_KEY")}`
          ),
      },
      body: JSON.stringify({
        phone_number: phone,
        amount,
        currency: "KES",
        email: "customer@example.com",
        metadata: {
          order_id,
        },
      }),
    }
  );

  const data = await intasendRes.json();

  return new Response(JSON.stringify(data), {
    headers: { "Content-Type": "application/json" },
  });
});
