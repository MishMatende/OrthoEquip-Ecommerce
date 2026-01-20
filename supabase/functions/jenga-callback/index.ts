// deno-lint-ignore-file
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

serve(async (req: Request) => {
  try {
    const body = await req.json();
    const { status, transactionId, reference, paymentMethod } = body;

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // 1️⃣ Fetch order by reference
    const { data: order } = await supabase
      .from("orders")
      .select("id, user_id, total_amount, payment_status")
      .eq("payment_reference", reference)
      .single();

    if (!order) {
      console.error("Order not found for reference:", reference);
      return new Response("OK", { status: 200 });
    }

    // 2️⃣ Update payment status
    if (status === "SUCCESS") {
      await supabase
        .from("orders")
        .update({
          payment_status: "paid",
          jenga_transaction_id: transactionId,
          jenga_payment_method: paymentMethod,
          tracking_stage: "paid",
        })
        .eq("id", order.id);
    } else {
      await supabase
        .from("orders")
        .update({ payment_status: "failed" })
        .eq("id", order.id);
    }

    // 3️⃣ Fetch user email for receipts
    const { data: user } = await supabase
      .from("profiles")
      .select("email")
      .eq("id", order.user_id)
      .single();

    // 4️⃣ Send Email via Resend
    if (status === "SUCCESS" && user?.email) {
      const resend = new Resend(Deno.env.get("RESEND_API_KEY")!);

      await resend.emails.send({
        from: "Balm Ortho <orders@balmorthomedical.com>",
        to: user.email,
        subject: "Payment Confirmation",
        html: `
          <h2>Payment Received</h2>
          <p>Your payment for order <strong>#${order.id}</strong> was successful.</p>
          <p>Amount: <strong>KES ${order.total_amount}</strong></p>
          <p>Transaction ID: <strong>${transactionId}</strong></p>
          <p>Thank you for shopping with Balm Ortho!</p>
        `,
      });
    }

    return new Response("OK", { status: 200 });
  } catch (err) {
    console.error("Callback Error:", err);
    return new Response("OK", { status: 200 }); // ACK even if parsing fails
  }
});
