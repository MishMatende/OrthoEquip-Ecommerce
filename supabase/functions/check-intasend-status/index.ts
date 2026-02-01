import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  // ✅ CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { order_id } = await req.json();

    if (!order_id) {
      return new Response("Missing order_id", {
        status: 400,
        headers: corsHeaders,
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // 1️⃣ Fetch order
    const { data: order, error } = await supabase
      .from("orders")
      .select("payment_reference")
      .eq("id", order_id)
      .single();

    if (error || !order) {
      return new Response("Order not found", {
        status: 404,
        headers: corsHeaders,
      });
    }

    // 2️⃣ Check IntaSend billing status
    const res = await fetch(
      `https://api.intasend.com/api/v1/payment/status/?invoice=${order.payment_reference}`,
      {
        headers: {
          Authorization: `Bearer ${Deno.env.get("INTASEND_SECRET_KEY")}`,
          Accept: "application/json",
        },
      }
    );

    const status = await res.json();

    // 3️⃣ Update DB if paid
    if (status?.billing_status === "COMPLETE") {
      await supabase
        .from("orders")
        .update({
          status: "paid",
          paid_at: new Date().toISOString(),
        })
        .eq("id", order_id);
    }

    return new Response(JSON.stringify(status), {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    });
  } catch (err) {
    console.error("STATUS CHECK ERROR:", err);
    return new Response("Status check failed", {
      status: 500,
      headers: corsHeaders,
    });
  }
});
