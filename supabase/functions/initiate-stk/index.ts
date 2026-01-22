// deno-lint-ignore-file
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

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

    // 🔐 ENV VARS
    const MERCHANT_CODE = Deno.env.get("JENGA_MERCHANT_CODE")!;
    const CONSUMER_SECRET = Deno.env.get("JENGA_CONSUMER_SECRET")!;
    const API_KEY = Deno.env.get("JENGA_API_KEY")!;
    const MERCHANT_ACC = Deno.env.get("JENGA_ACCOUNT_NUMBER")!;
    const CALLBACK_URL = Deno.env.get("JENGA_CHECKOUT_CALLBACK_URL")!;
    const PRIVATE_KEY_PEM = Deno.env.get("JENGA_PRIVATE_KEY_PEM")!; // <-- ADD THIS in env

    // 1️⃣ Generate Access Token
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

    // 2️⃣ Build Signature String
    const ref = payment_reference;
    const mobile = phone;
    const telco = "Safaricom";
    const amt = amount.toString();
    const currency = "KES";

    const sigString = MERCHANT_ACC + ref + mobile + telco + amt + currency;

    // 3️⃣ PEM → CryptoKey Utility
    function pemToBinary(pem: string) {
      const b64 = pem
        .replace(/-----BEGIN RSA PRIVATE KEY-----/g, "")
        .replace(/-----END RSA PRIVATE KEY-----/g, "")
        .replace(/\s+/g, "");
      const raw = atob(b64);
      const buffer = new Uint8Array(raw.length);
      for (let i = 0; i < raw.length; i++) buffer[i] = raw.charCodeAt(i);
      return buffer;
    }

    const privateKeyBinary = pemToBinary(PRIVATE_KEY_PEM);

    const privateKey = await crypto.subtle.importKey(
      "pkcs8",
      privateKeyBinary.buffer,
      { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
      false,
      ["sign"],
    );

    // 4️⃣ Sign Using RSA-SHA256 → base64
    const encoder = new TextEncoder();
    const signatureBuffer = await crypto.subtle.sign(
      { name: "RSASSA-PKCS1-v1_5" },
      privateKey,
      encoder.encode(sigString),
    );

    const signatureBase64 = btoa(
      String.fromCharCode(...new Uint8Array(signatureBuffer)),
    );

    // 5️⃣ Payload
    const stkPayload = {
      merchant: {
        accountNumber: MERCHANT_ACC,
        countryCode: "KE",
        name: "Sandbox Store",
      },
      payment: {
        ref,
        amount: amt,
        currency,
        telco,
        mobileNumber: mobile,
        date: new Date().toISOString().slice(0, 10),
        callBackUrl: CALLBACK_URL,
        pushType: "STK",
      },
    };

    // 6️⃣ Send STK Push Request
    const stkRes = await fetch(
      "https://uat.finserve.africa/v3-apis/payment-api/v3.0/stkussdpush/initiate",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
          Signature: signatureBase64,
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
