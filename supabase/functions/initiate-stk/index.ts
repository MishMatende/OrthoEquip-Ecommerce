// deno-lint-ignore-file
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { importPrivateKeyPKCS8, signRSASHA256 } from "../_shared/rsa-utils.ts";

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, apikey, Authorization",
      },
    });
  }

  try {
    const { amount, phone, name, email } = await req.json();

    if (!amount || !phone || !name || !email) {
      return new Response(JSON.stringify({ error: "Missing fields" }), {
        status: 400,
      });
    }

    // ENV VARS
    const MERCHANT_CODE = Deno.env.get("JENGA_MERCHANT_CODE")!;
    const CONSUMER_SECRET = Deno.env.get("JENGA_CONSUMER_SECRET")!;
    const API_KEY = Deno.env.get("JENGA_API_KEY")!;
    const CALLBACK_URL = Deno.env.get("JENGA_CHECKOUT_CALLBACK_URL")!;
    const PRIVATE_KEY = Deno.env.get("JENGA_PRIVATE_KEY_PEM")!;

    // 1. AUTH TOKEN
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

    // 2. Generate Refs
    const orderRef = `OR${Date.now()}`;
    const payRef = `WRQ${Date.now()}`;
    const currency = "KES";

    // 3. Signature String (DOC SPEC)
    const sigString = orderRef + currency + phone + amount;

    // 4. Sign RSA
    const pk = await importPrivateKeyPKCS8(PRIVATE_KEY);
    const signatureBase64 = await signRSASHA256(sigString, pk);

    // 5. Payload
    const payload = {
      order: {
        orderReference: orderRef,
        orderAmount: amount,
        orderCurrency: currency,
        source: "APICHECKOUT",
        countryCode: "KE",
        description: "Purchase from Balm Ortho",
      },
      customer: {
        name,
        email,
        phoneNumber: phone,
        identityNumber: "000000",
        firstAddress: "",
        secondAddress: "",
      },
      payment: {
        paymentReference: payRef,
        paymentCurrency: currency,
        channel: "MOBILE",
        service: "MPESA",
        provider: "JENGA",
        callbackUrl: CALLBACK_URL,
        details: {
          msisdn: phone,
          paymentAmount: amount,
        },
      },
    };

    // 6. SEND STK
    const stkRes = await fetch(
      "https://uat.finserve.africa/api-checkout/mpesa-stk-push/v3.0/init",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
          Signature: signatureBase64,
        },
        body: JSON.stringify(payload),
      },
    );

    const stkJson = await stkRes.json();
    return new Response(JSON.stringify(stkJson), {
      headers: { "Access-Control-Allow-Origin": "*" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
    });
  }
});
