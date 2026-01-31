import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  PDFDocument,
  StandardFonts,
} from "https://esm.sh/pdf-lib@1.17.1";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

serve(async (req) => {
  const { order_id } = await req.json();

  const { data: order } = await supabase
    .from("orders")
    .select("*")
    .eq("id", order_id)
    .single();

  const pdf = await PDFDocument.create();
  const page = pdf.addPage([595, 842]);
  const font = await pdf.embedFont(StandardFonts.Helvetica);

  page.drawText("Balm Ortho Medical Supplies", {
    x: 50,
    y: 800,
    size: 16,
    font,
  });

  page.drawText(`Invoice #: ${order.payment_reference}`, {
    x: 50,
    y: 760,
    size: 12,
    font,
  });

  page.drawText(`Amount: KES ${order.total_amount}`, {
    x: 50,
    y: 730,
    size: 12,
    font,
  });

  page.drawText(`Shipping:`, { x: 50, y: 700, size: 12, font });
  page.drawText(order.shipping_address, {
    x: 50,
    y: 680,
    size: 10,
    font,
    lineHeight: 14,
  });

  const bytes = await pdf.save();

  return new Response(bytes, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": "attachment",
    },
  });
});
