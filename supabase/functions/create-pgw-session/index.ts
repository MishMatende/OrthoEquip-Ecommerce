// supabase/functions/create-pgw-session/index.ts
// deno-lint-ignore-file
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

async function hmacSha256(key: string, message: string): Promise<string> {
  const enc = new TextEncoder();
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    enc.encode(key),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign("HMAC", cryptoKey, enc.encode(message));

  return Array.from(new Uint8Array(signature))
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");
}

async function sign(merchantCode: string, amount: string, currency: string, reference: string, secret: string) {
  const payload = merchantCode + amount + currency + reference;
  return await hmacSha256(secret, payload);
}

serve(async (req: Request) => {
  // Handle preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { order_id, amount, email, phone } = await req.json();

    if (!order_id || !amount || !email) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: corsHeaders }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const reference = `ORD-${order_id}-${Date.now()}`;

    await supabase.from("orders").update({
      payment_reference: reference,
      payment_status: "pending",
      payment_method: "jenga_pgw"
    }).eq("id", order_id);

    const merchantCode = Deno.env.get("JENGA_MERCHANT_CODE")!;
    const consumerSecret = Deno.env.get("JENGA_CONSUMER_SECRET")!;
    const apiKey = Deno.env.get("JENGA_API_KEY")!;
    const callbackUrl = Deno.env.get("JENGA_CHECKOUT_CALLBACK_URL")!;

    const currency = "KES";
    const signature = await sign(merchantCode, String(amount), currency, reference, consumerSecret);

    const payload = {
      merchantCode,
      amount: String(amount),
      currency,
      reference,
      callbackUrl,
      customerEmail: email,
      customerPhone: phone
    };

    const res = await fetch("https://uat.jengahq.io/checkout/v2/request", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Signature": signature,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    const data = await res.json();

    if (!res.ok) {
      return new Response(
        JSON.stringify(data),
        { status: 400, headers: corsHeaders }
      );
    }

    return new Response(
      JSON.stringify({ checkoutUrl: data.checkoutUrl }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (err) {
    console.error(err);
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: corsHeaders }
    );
  }
});
