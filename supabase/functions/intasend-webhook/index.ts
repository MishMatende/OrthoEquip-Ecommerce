import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const payload = await req.json();

  console.log("INTASEND WEBHOOK:", JSON.stringify(payload, null, 2));

  // 🔐 Challenge validation
  if (
    payload.challenge !==
    Deno.env.get("INTASEND_WEBHOOK_CHALLENGE")
  ) {
    return new Response("Unauthorized", {
      status: 401,
      headers: corsHeaders,
    });
  }

  // ✅ Handle successful collection
  if (
    payload.event === "collection" &&
    payload.data?.state === "COMPLETE"
  ) {
    const orderId = payload.data?.metadata?.order_id;

    if (!orderId) {
      console.error("Missing order_id in metadata");
      return new Response("Missing metadata", {
        status: 400,
        headers: corsHeaders,
      });
    }

    await supabase
      .from("orders")
      .update({ status: "paid" })
      .eq("id", orderId);

    console.log("Order marked as PAID:", orderId);
  }

  // ❌ Handle failed payment
  if (
    payload.event === "collection" &&
    payload.data?.state === "FAILED"
  ) {
    const orderId = payload.data?.metadata?.order_id;

    if (orderId) {
      await supabase
        .from("orders")
        .update({ status: "failed" })
        .eq("id", orderId);

      console.log("Order marked as FAILED:", orderId);
    }
  }

  return new Response(
    JSON.stringify({ received: true }),
    { headers: corsHeaders },
  );
});
