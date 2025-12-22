import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "@supabase/supabase-js";

serve(async (req) => {
  const ack = new Response("OK", { status: 200 });

  try {
    const url = new URL(req.url);
    const orderTrackingId = url.searchParams.get("OrderTrackingId");
    const merchantRef = url.searchParams.get("OrderMerchantReference");

    console.log("🔔 Pesapal IPN HIT:", { orderTrackingId, merchantRef });

    if (!orderTrackingId || !merchantRef) {
      console.warn("⚠️ Missing IPN params");
      return ack;
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // 1️⃣ Authenticate with Pesapal
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

    // 3️⃣ Update order based on status
    if (
      statusData.payment_status_description === "Completed" ||
      statusData.status_code === 0 ||
      statusData.status_code === 1
    ) {
      const { data, error } = await supabase
        .from("orders")
        .update({
          payment_status: "paid",
          paid_at: new Date().toISOString(),
        })
        .eq("pesapal_tracking_id", orderTrackingId)
        .select()
        .single();

      if (error) {
        console.error("❌ Failed to mark order as paid:", error);
      } else {
        console.log("✅ Order payment confirmed:", data.id);
      }
    } else {
      await supabase
        .from("orders")
        .update({ payment_status: "pending" })
        .eq("pesapal_tracking_id", orderTrackingId);

      console.log(
        "⏳ Payment still pending:",
        statusData.payment_status_description
      );
    }
  } catch (err) {
    console.error("❌ IPN processing error:", err);
  }

  return ack;
});
