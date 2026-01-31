import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

serve(async (req) => {
  const payload = await req.json();

  // 🔐 1. CHALLENGE VALIDATION
  const challenge = payload.challenge;
  if (challenge !== Deno.env.get("INTASEND_WEBHOOK_CHALLENGE")) {
    return new Response("Unauthorized", { status: 401 });
  }

  console.log("IntaSend webhook payload:", payload);

  // 🔁 2. HANDLE PAYMENT EVENTS
  if (
    payload.event === "collection" &&
    payload.data?.state === "COMPLETE"
  ) {
    const orderId = payload.data?.metadata?.order_id;

    if (orderId) {
      await supabase
        .from("orders")
        .update({ status: "paid" })
        .eq("id", orderId);
    }
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { "Content-Type": "application/json" },
  });
});
