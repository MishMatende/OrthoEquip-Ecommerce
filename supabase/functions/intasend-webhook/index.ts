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

  console.log("INTASEND WEBHOOK RECEIVED:", JSON.stringify(payload, null, 2));

  if (
    payload.event === "collection" &&
    payload.data?.state === "COMPLETE"
  ) {
    const orderId = payload.data?.api_ref; // 🔑 HERE

    if (!orderId) {
      console.error("Missing api_ref");
      return new Response("Missing api_ref", { status: 400 });
    }

    await supabase
      .from("orders")
      .update({ status: "paid" })
      .eq("id", orderId);

    console.log("Order marked PAID:", orderId);
  }

  if (
    payload.event === "collection" &&
    payload.data?.state === "FAILED"
  ) {
    const orderId = payload.data?.api_ref;
    if (orderId) {
      await supabase
        .from("orders")
        .update({ status: "failed" })
        .eq("id", orderId);
    }
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: corsHeaders,
  });
});
