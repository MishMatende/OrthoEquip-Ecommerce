// deno-lint-ignore-file
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

serve(async (req: Request) => {
  try {
    const body = await req.json();
    console.log("Jenga Callback:", body);

    const {
      code,
      status,
      transactionReference,
      telco,
    } = body;

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Find order by transaction reference
    const { data: order } = await supabase
      .from("orders")
      .select("id, user_id, total_amount")
      .eq("payment_reference", transactionReference)
      .single();

    if (!order) {
      console.warn("Order not found for reference:", transactionReference);
      return new Response("OK", { status: 200 });
    }

    // Determine outcome from Jenga codes
    let paymentStatus = "pending";

    if (code === 3) paymentStatus = "paid";
    else if ([1,7,5,6].includes(code)) paymentStatus = "failed";

    // Update order
    await supabase
      .from("orders")
      .update({
        payment_status: paymentStatus,
        jenga_transaction_id: transactionReference,
        jenga_payment_method: telco,
        tracking_stage: paymentStatus,
      })
      .eq("id", order.id);

    // Fetch customer email
    const { data: user } = await supabase
      .from("profiles")
      .select("email")
      .eq("id", order.user_id)
      .single();

    // Send success email if paid
    if (paymentStatus === "paid" && user?.email) {
      const resend = new Resend(Deno.env.get("RESEND_API_KEY")!);
      await resend.emails.send({
        from: "Balm Ortho <orders@balmorthomedical.com>",
        to: user.email,
        subject: "Payment Confirmation",
        html: `
          <h2>Payment Received</h2>
          <p>Your payment for order <strong>#${order.id}</strong> was successful.</p>
          <p>Amount: <strong>KES ${order.total_amount}</strong></p>
          <p>Reference: <strong>${transactionReference}</strong></p>
          <p>Thank you for shopping with Balm Ortho!</p>
        `,
      });
    }

    return new Response("OK", { status: 200 });
  } catch (err) {
    console.error("Callback Error:", err);
    return new Response("OK", { status: 200 }); // ACK even if error
  }
});
