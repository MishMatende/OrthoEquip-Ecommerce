import { serve } from "https://deno.land/std/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-receipt-secret",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Max-Age": "86400",
};

function jsonResponse(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

serve(async (req) => {
  // ✅ Handle preflight CORS request
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    if (req.method !== "POST") {
      return jsonResponse({ error: "Method not allowed" }, 405);
    }

    const body = await req.json().catch(() => null);

    if (!body) {
      return jsonResponse({ error: "Invalid JSON body" }, 400);
    }

    const { order_id } = body;

    if (!order_id) {
      return jsonResponse({ error: "Missing order_id" }, 400);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const resendKey = Deno.env.get("RESEND_API_KEY");

    if (!supabaseUrl || !supabaseServiceKey || !resendKey) {
      return jsonResponse(
        {
          error: "Missing environment variables",
          details: {
            SUPABASE_URL: !!supabaseUrl,
            SUPABASE_SERVICE_ROLE_KEY: !!supabaseServiceKey,
            RESEND_API_KEY: !!resendKey,
          },
        },
        500
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 1. Fetch order
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("*")
      .eq("id", order_id)
      .single();

    if (orderError || !order) {
      return jsonResponse(
        { error: "Order not found", orderError: orderError?.message },
        404
      );
    }

    // Prevent duplicates
    if (order.receipt_sent) {
      return jsonResponse({ message: "Receipt already sent." }, 200);
    }

    // 2. Fetch customer profile
    const { data: profile, error: profileError } = await supabase
  .from("profiles")
  .select("email, username")
  .eq("id", order.user_id)
  .single();


    if (profileError) {
      return jsonResponse(
        { error: "Failed to fetch profile", profileError: profileError.message },
        500
      );
    }

    const customerEmail = profile?.email;

    if (!customerEmail) {
      return jsonResponse({ error: "Customer email not found" }, 400);
    }

    // 3. Fetch order items
    const { data: items, error: itemsError } = await supabase
  .from("order_items")
  .select(`
    id,
    quantity,
    price,
    products (
      name,
      image_url
    )
  `)
  .eq("order_id", order_id);


    if (itemsError) {
      return jsonResponse(
        { error: "Failed to fetch order items", itemsError: itemsError.message },
        500
      );
    }

    // Store details
    const storeName = "Balm Ortho Medical Supplies";
    const storeEmail = "balmortho93@gmail.com";
    const storePhone = "+254100219639";
    const storeWebsite = "https://balmorthomedical.com";
    const logoUrl =
      "https://balmorthomedical.com/assets/BalmOrthoLogo-D056nDd4.png";

    const customerName =
  profile?.username && profile.username.trim().length > 0
    ? profile.username.trim()
    : "Customer";


    // Build items HTML
    const itemsHtml =
  items?.map((item: any) => {
    const name = item.products?.name || "Item";
    const image =
      item.products?.image_url || "https://via.placeholder.com/60";
    const qty = item.quantity || 0;
    const price = Number(item.price || 0);
    const subtotal = qty * price;

    return `
      <tr>
        <td style="padding: 12px 8px; font-size: 14px; color: #111827; display:flex; align-items:center; gap:10px;">
          <img src="${image}" 
               alt="${name}" 
               style="width:50px;height:50px;border-radius:10px;object-fit:cover;border:1px solid #e5e7eb;" />
          <span>${name}</span>
        </td>

        <td style="padding: 12px 8px; font-size: 14px; text-align: center; color: #374151;">
          ${qty}
        </td>

        <td style="padding: 12px 8px; font-size: 14px; text-align: right; color: #374151;">
          KES ${price.toLocaleString()}
        </td>

        <td style="padding: 12px 8px; font-size: 14px; text-align: right; font-weight: 600; color: #111827;">
          KES ${subtotal.toLocaleString()}
        </td>
      </tr>
    `;
  }).join("") || "";


    const totalAmount = Number(order.total_amount || 0);

    const datePaid = new Date().toLocaleString("en-KE", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    // Email HTML
    const html = `
      <div style="background:#f9fafb;padding:30px;font-family:Arial,sans-serif;">
        <div style="max-width:650px;margin:0 auto;background:white;border-radius:16px;overflow:hidden;border:1px solid #e5e7eb;">
          
          <!-- HEADER -->
          <div style="background:#111827;color:white;padding:22px 26px;">
            <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;">
              <div>
                <h1 style="margin:0;font-size:18px;font-weight:700;letter-spacing:0.3px;">
                  ${storeName}
                </h1>
                <p style="margin:4px 0 0;font-size:12px;color:#d1d5db;">
                  Payment Receipt
                </p>
              </div>

              ${
                logoUrl
                  ? `<img src="${logoUrl}" alt="${storeName}" style="height:40px;border-radius:10px;object-fit:contain;" />`
                  : ""
              }
            </div>
          </div>

          <!-- BODY -->
          <div style="padding:26px;">
            <p style="margin:0;font-size:15px;color:#111827;">
              Hello <b>${customerName}</b>,
            </p>

            <p style="margin:10px 0 18px;font-size:14px;color:#4b5563;line-height:1.6;">
              Thank you for shopping with <b>${storeName}</b>. Your payment has been confirmed successfully.
              Below is your receipt.
            </p>

            <!-- RECEIPT INFO -->
            <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:14px;padding:16px;margin-bottom:18px;">
              <table style="width:100%;font-size:13px;color:#374151;">
                <tr>
                  <td style="padding:6px 0;"><b>Order ID:</b></td>
                  <td style="padding:6px 0;text-align:right;font-family:monospace;">${order.id}</td>
                </tr>
                <tr>
                  <td style="padding:6px 0;"><b>Date Paid:</b></td>
                  <td style="padding:6px 0;text-align:right;">${datePaid}</td>
                </tr>
                <tr>
                  <td style="padding:6px 0;"><b>Payment Method:</b></td>
                  <td style="padding:6px 0;text-align:right;">${
                    order.payment_method || "Mpesa"
                  }</td>
                </tr>
              </table>
            </div>

            <!-- ITEMS TABLE -->
            <h3 style="margin:0 0 10px;font-size:15px;color:#111827;">Purchased Items</h3>

            <div style="border:1px solid #e5e7eb;border-radius:14px;overflow:hidden;">
              <table style="width:100%;border-collapse:collapse;">
                <thead style="background:#f3f4f6;">
                  <tr>
                    <th style="text-align:left;padding:12px 8px;font-size:12px;color:#374151;">Item</th>
                    <th style="text-align:center;padding:12px 8px;font-size:12px;color:#374151;">Qty</th>
                    <th style="text-align:right;padding:12px 8px;font-size:12px;color:#374151;">Price</th>
                    <th style="text-align:right;padding:12px 8px;font-size:12px;color:#374151;">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemsHtml}
                </tbody>
              </table>
            </div>

            <!-- TOTAL -->
            <div style="margin-top:18px;padding:16px;background:#ecfeff;border:1px solid #06b6d4;border-radius:14px;">
              <table style="width:100%;">
                <tr>
                  <td style="font-size:14px;color:#0f172a;font-weight:600;">Total Paid</td>
                  <td style="font-size:16px;color:#0f172a;font-weight:800;text-align:right;">
                    KES ${totalAmount.toLocaleString()}
                  </td>
                </tr>
              </table>
            </div>

            <!-- SHIPPING -->
            <div style="margin-top:18px;background:#f9fafb;border:1px solid #e5e7eb;border-radius:14px;padding:16px;">
              <h3 style="margin:0 0 10px;font-size:14px;color:#111827;">Delivery Details</h3>
              <p style="margin:0;font-size:13px;color:#4b5563;line-height:1.6;">
                <b>Address:</b> ${order.shipping_address || "N/A"} <br/>
                <b>Delivery Status:</b> ${
                  order.delivery_status || "not started"
                } <br/>
                <b>Tracking Stage:</b> ${order.tracking_stage || "pending"}
              </p>
            </div>

            <!-- FOOTER NOTE -->
            <p style="margin:20px 0 0;font-size:13px;color:#6b7280;line-height:1.6;">
              If you have any questions, reply to this email or contact us at 
              <a href="mailto:${storeEmail}" style="color:#06b6d4;text-decoration:none;">${storeEmail}</a>.
            </p>

            <!-- CTA -->
            <div style="margin-top:18px;text-align:center;">
              <a href="${storeWebsite}"
                style="display:inline-block;background:#111827;color:white;text-decoration:none;
                padding:12px 18px;border-radius:12px;font-size:13px;font-weight:600;">
                Visit Our Store
              </a>
            </div>
          </div>

          <!-- FOOTER -->
          <div style="background:#f3f4f6;padding:18px;text-align:center;font-size:12px;color:#6b7280;">
            <p style="margin:0;">
              ${storeName} • ${storePhone} • 
              <a href="${storeWebsite}" style="color:#06b6d4;text-decoration:none;">${storeWebsite}</a>
            </p>
            <p style="margin:6px 0 0;">
              This receipt was generated automatically. Please keep it for your records.
            </p>
          </div>
        </div>
      </div>
    `;

    // 5. Send email using Resend API
    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Balm Ortho Medical Supplies <sales@balmorthomedical.com>",
        to: customerEmail,
        subject: `Receipt - Order ${order.id
          .slice(0, 8)
          .toUpperCase()} | ${storeName}`,
        html,
      }),
    });

    const resendData = await resendResponse.json();

    if (!resendResponse.ok) {
      return jsonResponse(
        { error: "Failed to send email", resendData },
        500
      );
    }

    // 6. Mark receipt as sent
    const { error: updateError } = await supabase
      .from("orders")
      .update({
        receipt_sent: true,
        receipt_sent_at: new Date().toISOString(),
      })
      .eq("id", order_id);

    if (updateError) {
      return jsonResponse(
        { error: "Email sent but failed to update order", updateError },
        500
      );
    }

    return jsonResponse(
      { success: true, message: "Receipt sent", resendData },
      200
    );
  } catch (err: any) {
    return jsonResponse({ error: err.message || "Unknown error" }, 500);
  }
});
