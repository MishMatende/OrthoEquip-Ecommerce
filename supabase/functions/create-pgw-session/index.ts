// supabase/functions/create-payment-session/index.ts
// deno-lint-ignore-file
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// ---- Utils ----
function base64(str: string) {
  return btoa(str);
}

async function hmacSha256(key: string, message: string): Promise<string> {
  const enc = new TextEncoder();
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    enc.encode(key),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", cryptoKey, enc.encode(message));
  return Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// ---- Entry Point ----
serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { order_id, amount, phone } = await req.json();

    if (!order_id || !amount || !phone) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: corsHeaders },
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const MERCHANT_CODE = Deno.env.get("JENGA_MERCHANT_CODE")!;
    const CONSUMER_SECRET = Deno.env.get("JENGA_CONSUMER_SECRET")!;
    const API_KEY = Deno.env.get("JENGA_API_KEY")!;

    const TILL = "247247"; // your paybill
    const ACCOUNT = "0710287051433"; // your predefined account
    const CURRENCY = "KES";

    const ref = `ORD-${order_id}-${Date.now()}`;

    // Save reference immediately
    await supabase.from("orders")
      .update({
        payment_reference: ref,
        jenga_status: "pending",
      })
      .eq("id", order_id);

    // ---- 1) AUTHENTICATE ----
    const authRes = await fetch(
      "https://uat.finserve.africa/authentication/api/v3/authenticate/merchant",
      {
        method: "POST",
        headers: {
          "Authorization": `Basic ${base64(`${MERCHANT_CODE}:${CONSUMER_SECRET}`)}`,
          "ApiKey": API_KEY,
          "Content-Type": "application/json",
        },
      },
    );

    const authData = await authRes.json();

    if (!authData.token) {
      return new Response(
        JSON.stringify({ error: "Auth failed", details: authData }),
        { status: 401, headers: corsHeaders },
      );
    }

    const token = authData.token;

    // ---- 2) SIGN STK PAYLOAD ----
    const signaturePayload = `${TILL}${ACCOUNT}${amount}${CURRENCY}${ref}`;
    const signature = await hmacSha256(CONSUMER_SECRET, signaturePayload);

    // ---- 3) TRIGGER STK PUSH ----
    const stkRes = await fetch(
      "https://uat.finserve.africa/v3-apis/transaction-api/v3/bills/pay",
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Signature": signature,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          merchant: { till: TILL },
          payment: {
            ref,
            amount: String(amount),
            currency: CURRENCY,
          },
          partner: {
            id: ACCOUNT,
            ref: phone, // triggers stk push
          },
        }),
      },
    );

    const stkData = await stkRes.json();

    return new Response(JSON.stringify(stkData), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("PGW ERROR:", err);
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: corsHeaders },
    );
  }
});
