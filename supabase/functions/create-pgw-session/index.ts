// deno-lint-ignore-file
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const UAT_AUTH_URL = "https://uat.finserve.africa/authentication/api/v3/authenticate/merchant";
const UAT_STK_URL = "https://uat.finserve.africa/api/ussdpush/v3/express-payment";

serve(async (req: Request) => {
  try {
    const { order_id, amount, phone } = await req.json();

    if (!order_id || !amount || !phone) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), { status: 400 });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // 1️⃣ Create unique reference
    const reference = `ORD-${order_id}-${Date.now()}`;

    await supabase.from("orders")
      .update({ payment_reference: reference, payment_status: "pending" })
      .eq("id", order_id);

    // 2️⃣ Authenticate with Jenga
    const merchantCode = Deno.env.get("JENGA_MERCHANT_CODE")!;
    const consumerSecret = Deno.env.get("JENGA_CONSUMER_SECRET")!;
    const apiKey = Deno.env.get("JENGA_API_KEY")!;

    const authRes = await fetch(UAT_AUTH_URL, {
      method: "POST",
      headers: {
        "Authorization": `Basic ${btoa(`${merchantCode}:${consumerSecret}`)}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ 
        merchantCode,
        apiKey 
      })
    });

    const authData = await authRes.json();
    const token = authData.accessToken;

    if (!token) {
      console.error("Auth failed:", authData);
      return new Response(JSON.stringify({ error: "Jenga auth failed" }), { status: 500 });
    }

    // 3️⃣ Send STK Push
    const stkPayload = {
      customer: phone,
      amount: String(amount),
      reference: reference,
      till: "247247", // Paybill
      account: "0710287051433" // Your account number mapped to your business
    };

    const stkRes = await fetch(UAT_STK_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(stkPayload)
    });

    // STK returns no JSON | no body | just HTTP code
    console.log("STK HTTP STATUS:", stkRes.status);

    return new Response(null, { status: 204 });

  } catch (err) {
    console.error("STK Error:", err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
});
