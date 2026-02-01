import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
    console.log("INTASEND STK FUNCTION HIT");

  // ✅ Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { phone, amount, order_id, email, name } = await req.json();

    if (!phone || !amount || !order_id) {
      return new Response(
        JSON.stringify({ error: "Missing fields" }),
        { status: 400, headers: corsHeaders },
      );
    }

    const auth = btoa(
      `${Deno.env.get("INTASEND_API_KEY")}:${Deno.env.get("INTASEND_SECRET_KEY")}`,
    );

    const res = await fetch(
      "https://api.intasend.com/api/v1/payment/mpesa-stk-push/",
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${auth}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
  phone_number: phone,
  amount,
  currency: "KES",
  email,
  first_name: name.split(" ")[0],
  last_name: name.split(" ").slice(1).join(" "),
  api_ref: order_id, // 🔑 THIS IS THE KEY
}),
      },
    );

    const rawText = await res.text();

console.log("INTASEND RAW RESPONSE:", rawText);
console.log("INTASEND STATUS:", res.status);

let data;
try {
  data = JSON.parse(rawText);
} catch {
  data = { raw: rawText };
}


    return new Response(JSON.stringify(data), {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    });
  } catch (err) {
    console.error(err);
    return new Response(
      JSON.stringify({ error: "STK initiation failed" }),
      { status: 500, headers: corsHeaders },
    );
  }
});
