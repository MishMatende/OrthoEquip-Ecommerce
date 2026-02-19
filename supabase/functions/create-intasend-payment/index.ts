import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get(
      "SUPABASE_SERVICE_ROLE_KEY",
    );

    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

    const INTASEND_API_KEY = Deno.env.get("INTASEND_API_KEY");
    const INTASEND_SECRET_KEY = Deno.env.get("INTASEND_SECRET_KEY");
    const INTASEND_WALLET_ID = Deno.env.get("INTASEND_WALLET_ID");

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      return new Response(
        JSON.stringify({ error: "Missing Supabase environment variables" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    if (!INTASEND_API_KEY || !INTASEND_SECRET_KEY) {
      return new Response(
        JSON.stringify({ error: "Missing IntaSend keys in environment" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const body = await req.json();
    const { quoteId } = body;

    if (!quoteId) {
      return new Response(JSON.stringify({ error: "Missing quoteId" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("📌 Quote ID received:", quoteId);

    // 1️⃣ Fetch quote
    const { data: quote, error: quoteError } = await supabase
      .from("orders")
      .select(
        `
        *,
        customers (
          id,
          name,
          email,
          phone
        )
      `,
      )
      .eq("id", quoteId)
      .single();

    if (quoteError || !quote) {
      console.error("❌ Quote fetch error:", quoteError);

      return new Response(JSON.stringify({ error: "Quote not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!quote.customers?.email) {
      return new Response(
        JSON.stringify({ error: "Customer email missing" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // 2️⃣ Create/reuse order
    let orderId = quote.converted_to_order_id;

    if (!orderId) {
      console.log("🟡 Quote not converted yet, creating order...");

      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert({
          customer_id: quote.customer_id,
          created_by: quote.created_by,
          order_type: "order",
          status: "pending",
          total: quote.total,
          payment_status: "pending_payment",
          converted_from_quote: quote.id,
        })
        .select()
        .single();

      if (orderError || !order) {
        console.error("❌ Order insert error:", orderError);

        return new Response(JSON.stringify({ error: "Failed to create order" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      orderId = order.id;

      // Move items
      const { error: itemsError } = await supabase
        .from("order_items")
        .update({ order_id: orderId })
        .eq("order_id", quote.id);

      if (itemsError) {
        console.error("❌ Move items error:", itemsError);

        return new Response(
          JSON.stringify({ error: "Failed to move quote items" }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
      }

      // Update quote
      const { error: updateQuoteError } = await supabase
        .from("orders")
        .update({
          quote_status: "accepted",
          converted_to_order_id: orderId,
        })
        .eq("id", quote.id);

      if (updateQuoteError) {
        console.error("❌ Failed updating quote:", updateQuoteError);
      }
    }

    // 3️⃣ Generate IntaSend payment link
    const redirectUrl = `https://balmorthomedical.com/order-confirmation/${orderId}`;

    console.log("🟢 Creating IntaSend payment link...");

    const intasendPayload: Record<string, unknown> = {
      public_key: INTASEND_API_KEY,
      amount: Number(quote.total),
      currency: "KES",
      email: quote.customers.email,
      phone_number: quote.customers.phone,
      first_name: quote.customers.name || "Customer",
      redirect_url: redirectUrl,
      metadata: {
        order_id: orderId,
        quote_id: quote.id,
      },
    };

    // Only include wallet_id if it exists
    if (INTASEND_WALLET_ID) {
      intasendPayload.wallet_id = INTASEND_WALLET_ID;
    }

    const intasendRes = await fetch(
      "https://api.intasend.com/api/v1/checkout/",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${INTASEND_SECRET_KEY}`,
        },
        body: JSON.stringify(intasendPayload),
      },
    );

    const intasendData = await intasendRes.json();

    if (!intasendRes.ok) {
      console.error("❌ IntaSend API Error:", intasendData);

      return new Response(
        JSON.stringify({
          error: "Failed to create IntaSend payment link",
          details: intasendData,
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const paymentUrl = intasendData?.url || intasendData?.checkout_url;

    if (!paymentUrl) {
      console.error("❌ Payment URL missing:", intasendData);

      return new Response(
        JSON.stringify({
          error: "IntaSend did not return payment URL",
          details: intasendData,
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // 4️⃣ Save payment link
    await supabase
      .from("orders")
      .update({ payment_link: paymentUrl })
      .eq("id", orderId);

    // 5️⃣ Send email (but do NOT fail the whole function if email fails)
    let emailSent = false;

    if (RESEND_API_KEY) {
      console.log("📩 Sending payment link email...");

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; background:#f7f9fc; padding:30px;">
        <div style="max-width:600px; margin:0 auto; background:white; border-radius:12px; overflow:hidden; border:1px solid #e5e7eb;">
          
          <div style="background:#4eb0e3; padding:20px; color:white;">
            <h2 style="margin:0; font-size:20px;">Balm Ortho Medical Supplies</h2>
            <p style="margin:5px 0 0; font-size:14px;">Payment Link for Your Order</p>
          </div>

          <div style="padding:25px; color:#111;">
            <p style="font-size:15px; margin-top:0;">
              Hello <strong>${quote.customers.name || "Customer"}</strong>,
            </p>

            <p style="font-size:14px; line-height:1.6;">
                Your quotation has been accepted and your order is ready.
            </p>

            <div style="background:#f3f4f6; padding:15px; border-radius:10px; margin:20px 0;">
              <p style="margin:0; font-size:14px;">
                <strong>Order ID:</strong> ${orderId}
              </p>
              <p style="margin:6px 0 0; font-size:14px;">
                  <strong>Total Amount:</strong> KES ${Number(
                    quote.total || 0,
                  ).toLocaleString()}
              </p>
            </div>

            <p style="font-size:14px; margin-bottom:20px;">
              Click the button below to complete payment:
            </p>

            <a href="${paymentUrl}"
              style="
                display:inline-block;
                background:#16a34a;
                color:white;
                padding:12px 18px;
                text-decoration:none;
                border-radius:8px;
                font-weight:bold;
                font-size:14px;
              ">
              Pay Now
            </a>

            <p style="font-size:12px; color:#6b7280; margin-top:25px;">
              If the button doesn’t work, copy and paste this link into your browser:
              <br/>
              <a href="${paymentUrl}" style="color:#16a34a;">${paymentUrl}</a>
            </p>
          </div>

          <div style="padding:15px; background:#f9fafb; border-top:1px solid #e5e7eb; font-size:12px; color:#6b7280; text-align:center;">
            Balm Ortho Medical Supplies • Nairobi, Kenya <br/>
            Need help? Reply to this email.
          </div>

        </div>
      </div>
    `;

    const resendRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Balm Ortho <sales@balmorthomedical.com>",
        to: quote.customers.email,
        subject: "Payment Link - Balm Ortho Medical Supplies",
        html: emailHtml,
      }),
    });

    const resendData = await resendRes.json();

    if (!resendRes.ok) {
        console.error("❌ Resend failed:", resendData);
      } else {
        emailSent = true;
      }
    } else {
      console.log("⚠️ RESEND_API_KEY missing, skipping email send.");
    }

    // 6️⃣ Return orderId + payment link (for fallback)
    return new Response(
      JSON.stringify({
        success: true,
        orderId,
        payment_url: paymentUrl,
        emailSent,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (err) {
    console.error("❌ Edge Function crash:", err);

    return new Response(
      JSON.stringify({ error: "Server error", details: String(err) }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
