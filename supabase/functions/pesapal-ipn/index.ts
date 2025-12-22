// supabase/functions/pesapal-ipn/index.ts
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "@supabase/supabase-js";

serve(async (req) => {
  // ✅ ALWAYS acknowledge immediately
  const ack = new Response("OK", { status: 200 });

  try {
    // Pesapal sends params in query string
    const url = new URL(req.url);
    const orderTrackingId = url.searchParams.get("OrderTrackingId");
    const merchantRef = url.searchParams.get("OrderMerchantReference");

    console.log("🔔 Pesapal IPN HIT:", {
      orderTrackingId,
      merchantRef,
    });

    // If missing params, still ACK
    if (!orderTrackingId || !merchantRef) {
      console.warn("⚠️ Missing IPN params");
      return ack;
    }

    // Create Supabase client (SERVICE ROLE – no RLS issues)
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // 1️⃣ Authenticate with Pesapal (LIVE)
    const authRes = await fetch(
      `${Deno.env.get("PESAPAL_BASE_URL")}/api/Auth/RequestToken`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          consumer_key: Deno.env.get("PESAPAL_CONSUMER_KEY"),
          consumer_secret: Deno.env.get("PESAPAL_CONSUMER_SECRET"),
        }),
      }
    );

    const authData = await authRes.json();
    if (!authData.token) {
      console.error("❌ Pesapal auth failed", authData);
      return ack;
    }

    // 2️⃣ Verify transaction status
    const statusRes = await fetch(
      `${Deno.env.get("PESAPAL_BASE_URL")}/api/Transactions/GetTransactionStatus?orderTrackingId=${orderTrackingId}`,
      {
        headers: {
          Authorization: `Bearer ${authData.token}`,
        },
      }
    );

    const statusData = await statusRes.json();
    console.log("📦 Pesapal status:", statusData);

    // Only mark as paid if COMPLETED
    if (
      statusData.payment_status_description === "Completed" ||
      statusData.status_code === 1
    ) {
      const { error } = await supabase
        .from("orders")
        .update({
          status: "paid",
          paid_at: new Date().toISOString(),
          pesapal_tracking_id: orderTrackingId,
        })
        .eq("id", merchantRef);

      if (error) {
        console.error("❌ Failed to update order:", error);
      } else {
        console.log("✅ Order marked as PAID:", merchantRef);
      }
    } else {
      console.log(
        "⏳ Payment not completed yet:",
        statusData.payment_status_description
      );
    }
  } catch (err) {
    // NEVER throw — always ACK Pesapal
    console.error("❌ IPN processing error:", err);
  }

  return ack;
});
