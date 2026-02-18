import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Max-Age": "86400",
};

function jsonResponse(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });
}

serve(async (req) => {
  // ✅ CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    if (req.method !== "POST") {
      return jsonResponse({ success: false, error: "Method not allowed" }, 405);
    }

    const bodyText = await req.text();

    if (!bodyText) {
      return jsonResponse({ success: false, error: "Empty body" }, 400);
    }

    let body;
    try {
      body = JSON.parse(bodyText);
    } catch {
      return jsonResponse({ success: false, error: "Invalid JSON body" }, 400);
    }

    const { phone, amount, order_id } = body;

    if (!phone || !amount || !order_id) {
      return jsonResponse(
        {
          success: false,
          error: "Missing fields",
          required: ["phone", "amount", "order_id"],
        },
        400
      );
    }

    const secretKey = Deno.env.get("INTASEND_SECRET_KEY");
    const walletId = Deno.env.get("INTASEND_WALLET_ID");

    if (!secretKey || !walletId) {
      return jsonResponse(
        {
          success: false,
          error: "Missing environment variables",
          details: {
            INTASEND_SECRET_KEY: !!secretKey,
            INTASEND_WALLET_ID: !!walletId,
          },
        },
        500
      );
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
          wallet_id: walletId,
          api_ref: order_id,
        }),
      }
    );

    const text = await res.text();

    let data;
    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      data = { raw: text };
    }

    console.log("INTASEND RESPONSE:", res.status, data);

    // ❌ If IntaSend returned error
    if (!res.ok) {
      return jsonResponse(
        {
          success: false,
          error: "IntaSend STK push failed",
          intasend_status: res.status,
          intasend_response: data,
    },
        res.status
      );
}

    // ✅ If IntaSend succeeded
    return jsonResponse(
      {
        success: true,
        message: "STK push initiated successfully",
        intasend_response: data,
  },
      200
    );
  } catch (e: any) {
    console.error("STK ERROR:", e);
    return jsonResponse(
      { success: false, error: e.message || "STK failed" },
      500
    );
  }
});
