// deno-lint-ignore-file
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createHash, Hmac } from "https://deno.land/std@0.224.0/hash/mod.ts";

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers":
          "Content-Type, Authorization, apikey, X-Client-Info",
      },
    });
  }

  try {
    const { payment_reference, amount, phone } = await req.json();

    if (!payment_reference || !amount || !phone) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { "Access-Control-Allow-Origin": "*" },
      });
    }

    // 1️⃣ Load ENV Vars
    const MERCHANT_CODE = Deno.env.get("JENGA_MERCHANT_CODE")!;
    const CONSUMER_SECRET = Deno.env.get("JENGA_CONSUMER_SECRET")!;
    const API_KEY = Deno.env.get("JENGA_API_KEY")!;
    const MERCHANT_ACC = Deno.env.get("JENGA_ACCOUNT_ACC")!;

    // 2️⃣ Get Access Token (sandbox)
    const tokenRes = await fetch(
      "https://uat.finserve.africa/authentication/api/v3/authenticate/merchant",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Api-Key": API_KEY,
        },
        body: JSON.stringify({
          merchantCode: MERCHANT_CODE,
          consumerSecret: CONSUMER_SECRET,
        }),
      },
    );

    const tokenJson = await tokenRes.json();
    const accessToken = tokenJson.accessToken;

    // 3️⃣ Build Signature String
    const merchantAcc = MERCHANT_ACC;
    const ref = payment_reference;
    const mobile = phone;
    const telco = "Safaricom";
    const amt = amount.toString();
    const currency = "KES";

    const signatureString =
      merchantAcc + ref + mobile + telco + amt + currency;

    // 4️⃣ HMAC SHA256 Signature using consumerSecret
    const encoder = new TextEncoder();
    const keyData = encoder.encode(CONSUMER_SECRET);
    const cryptoKey = await crypto.subtle.importKey(
      "raw",
      keyData,
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"],
    );

    const signatureData = await crypto.subtle.sign(
      "HMAC",
      cryptoKey,
      encoder.encode(signatureString),
    );

    const signatureArray = Array.from(new Uint8Array(signatureData));
    const signatureHex = signatureArray.map((b) => b.toString(16).padStart(2, "0")).join("");

    // 5️⃣ STK Request Payload
    const stkPayload = {
      merchant: {
        accountNumber: merchantAcc,
        countryCode: "KE",
        name: "Sandbox Store",
      },
      payment: {
        ref,
        amount: amt,
        currency: currency,
        telco: telco,
        mobileNumber: mobile,
        date: new Date().toISOString().slice(0, 10),
        callBackUrl: Deno.env.get("JENGA_CALLBACK_URL")!,
        pushType: "STK",
      },
    };

    // 6️⃣ Send STK Push
    const stkRes = await fetch(
      "https://uat.finserve.africa/v3-apis/payment-api/v3.0/stkussdpush/initiate",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
          Signature: signatureHex,
        },
        body: JSON.stringify(stkPayload),
      },
    );

    const stkJson = await stkRes.json();

    return new Response(JSON.stringify(stkJson), {
      headers: { "Access-Control-Allow-Origin": "*" },
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Access-Control-Allow-Origin": "*" },
    });
  }
});
