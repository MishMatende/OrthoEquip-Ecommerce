import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { generateSignature } from "../lib/signature.ts";

serve(async (req) => {
  try {
    const { mobileNumber, amount, pushType } = await req.json();

    const ACCOUNT = Deno.env.get("JENGA_ACCOUNT_NUMBER")!;
    const MERCHANT_NAME = Deno.env.get("JENGA_MERCHANT_NAME")!;
    const CONSUMER_SECRET = Deno.env.get("JENGA_CONSUMER_SECRET")!;
    const API_KEY = Deno.env.get("JENGA_API_KEY")!;
    const MERCHANT_CODE = Deno.env.get("JENGA_MERCHANT_CODE")!;
    const CALLBACK_URL = Deno.env.get("JENGA_CALLBACK_URL")!;

    // 1. get fresh bearer token
    const tokenRes = await fetch(
      "https://uat.finserve.africa/authentication/api/v3/authenticate/merchant",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Api-Key": API_KEY
        },
        body: JSON.stringify({
          merchantCode: MERCHANT_CODE,
          consumerSecret: CONSUMER_SECRET
        })
      }
    );

    const tokenData = await tokenRes.json();
    const accessToken = tokenData.accessToken;

    // 2. generate reference
    const ref = crypto.randomUUID().slice(0, 6).toUpperCase();

    // 3. generate signature
    const signature = await generateSignature(
      ACCOUNT,
      ref,
      mobileNumber,
      "Safaricom",
      amount,
      "KES",
      CONSUMER_SECRET
    );

    // 4. build stk payload
    const payload = {
      merchant: {
        accountNumber: ACCOUNT,
        countryCode: "KE",
        name: MERCHANT_NAME
      },
      payment: {
        ref,
        amount,
        currency: "KES",
        telco: "Safaricom",
        mobileNumber,
        date: new Date().toISOString().slice(0, 10),
        callbackUrl: CALLBACK_URL,
        pushType: pushType ?? "STK"
      }
    };

    // 5. send stk push
    const stkRes = await fetch(
      "https://uat.finserve.africa/v3-apis/payment-api/v3.0/stkussdpush/initiate",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${accessToken}`,
          "Signature": signature
        },
        body: JSON.stringify(payload)
      }
    );

    const stkData = await stkRes.json();

    return new Response(JSON.stringify({
      ref,
      result: stkData
    }), {
      headers: { "Content-Type": "application/json" }
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
});
