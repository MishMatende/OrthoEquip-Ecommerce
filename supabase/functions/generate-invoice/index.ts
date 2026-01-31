import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  PDFDocument,
  StandardFonts,
  rgb,
} from "https://esm.sh/pdf-lib@1.17.1";

// ✅ CORS HEADERS (MANDATORY)
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  // ✅ Handle preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // 🔐 Auth (user must be logged in)
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response("Unauthorized", {
        status: 401,
        headers: corsHeaders,
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      {
        global: { headers: { Authorization: authHeader } },
      },
    );

    const { order_id } = await req.json();
    if (!order_id) {
      return new Response("Missing order_id", {
        status: 400,
        headers: corsHeaders,
      });
    }

    // 📦 Fetch order
    const { data: order, error } = await supabase
      .from("orders")
      .select("*")
      .eq("id", order_id)
      .single();

    if (error || !order) {
      return new Response("Order not found", {
        status: 404,
        headers: corsHeaders,
      });
    }

    // 🧾 Create PDF
    const pdf = await PDFDocument.create();
    const page = pdf.addPage([595, 842]); // A4
    const font = await pdf.embedFont(StandardFonts.Helvetica);
    const bold = await pdf.embedFont(StandardFonts.HelveticaBold);

    let y = 800;

    // 🏷 Header
    page.drawText("Balm Ortho Medical Supplies", {
      x: 50,
      y,
      size: 18,
      font: bold,
    });

    y -= 30;

    page.drawText(`INVOICE`, {
      x: 50,
      y,
      size: 14,
      font: bold,
      color: rgb(0.1, 0.4, 0.8),
    });

    y -= 30;

    // 📄 Invoice details
    page.drawText(`Invoice Ref: ${order.payment_reference}`, {
      x: 50,
      y,
      size: 11,
      font,
    });

    y -= 18;

    page.drawText(
      `Date: ${new Date(order.created_at).toLocaleDateString()}`,
      { x: 50, y, size: 11, font },
    );

    y -= 30;

    // 👤 Customer
    page.drawText("Bill To:", { x: 50, y, size: 12, font: bold });
    y -= 15;

    order.shipping_address.split("\n").forEach((line) => {
      page.drawText(line, { x: 50, y, size: 10, font });
      y -= 14;
    });

    y -= 30;

    // 💰 Amount
    page.drawText("Total Amount", { x: 50, y, size: 12, font: bold });
    y -= 18;

    page.drawText(`KES ${order.total_amount.toLocaleString()}`, {
      x: 50,
      y,
      size: 14,
      font: bold,
    });

    y -= 40;

    // 📝 Footer
    page.drawText(
      "Thank you for shopping with Balm Ortho Medical Supplies.",
      {
        x: 50,
        y,
        size: 10,
        font,
      },
    );

    page.drawText(
      "For support, contact support@balmorthomedical.com",
      {
        x: 50,
        y: y - 14,
        size: 9,
        font,
        color: rgb(0.4, 0.4, 0.4),
      },
    );

    const pdfBytes = await pdf.save();

    // 📤 Return PDF
    return new Response(pdfBytes, {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename=Invoice-${order.payment_reference}.pdf`,
      },
    });
  } catch (err) {
    console.error("Invoice error:", err);
    return new Response("Failed to generate invoice", {
      status: 500,
      headers: corsHeaders,
    });
  }
});
