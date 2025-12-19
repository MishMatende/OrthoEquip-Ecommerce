// deno-lint-ignore-file

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "@supabase/supabase-js";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const {
      order_id,
      amount,
      email,
      phone,
      first_name,
      last_name,
    } = await req.json();

    if (!order_id || !amount || !email) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: corsHeaders }
      );
    }

    // 1. Fetch order
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("*")
      .eq("id", order_id)
      .single();

    if (orderError || !order) {
      throw new Error("Order not found");
    }

    if (order.status !== "pending_payment") {
      throw new Error("Order already processed");
    }

    // 2. Authenticate with Pesapal (Sandbox)
    const authRes = await fetch(
      "https://cybqa.pesapal.com/pesapalv3/api/Auth/RequestToken",
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
      throw new Error("Pesapal authentication failed");
    }

    // 3. Create Pesapal order
    const pesapalRes = await fetch(
      "https://cybqa.pesapal.com/pesapalv3/api/Transactions/SubmitOrderRequest",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${authData.token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: order_id,
          currency: "KES",
          amount,
          description: `Order #${order_id}`,
          callback_url: Deno.env.get("PESAPAL_CALLBACK_URL"),
          notification_id: Deno.env.get("PESAPAL_IPN_ID"),
          billing_address: {
            email_address: email,
            phone_number: phone,
            first_name,
            last_name,
          },
        }),
      }
    );

    const pesapalData = await pesapalRes.json();

    if (!pesapalData.redirect_url) {
      console.error("Pesapal response:", pesapalData);
      throw new Error("Pesapal order creation failed");
    }

    // 4. Save Pesapal refs
    await supabase
      .from("orders")
      .update({
        pesapal_tracking_id: pesapalData.order_tracking_id,
        pesapal_reference: pesapalData.merchant_reference,
      })
      .eq("id", order_id);

    // 5. Return redirect URL
    return new Response(
      JSON.stringify({ payment_url: pesapalData.redirect_url }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (err) {
    console.error("Create Pesapal Payment Error:", err);

    return new Response(
      JSON.stringify({ error: err.message }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});
