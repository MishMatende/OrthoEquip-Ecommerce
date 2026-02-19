import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../../supabaseClient";
import { Loader2 } from "lucide-react";

export default function CheckoutFromQuote() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    convertQuoteToOrder();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function convertQuoteToOrder() {
    try {
      setLoading(true);
      setErrorMsg("");

      // 1️⃣ Fetch quote + customer info
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
        .eq("id", id)
        .single();

      if (quoteError || !quote) {
        console.error("Quote fetch error:", quoteError);
        setErrorMsg("Quote not found.");
        return;
      }

      if (!quote.customers?.email) {
        setErrorMsg("Customer email is missing. Cannot send payment link.");
        return;
      }

      let orderId = quote.converted_to_order_id;

      // 2️⃣ Create order if not already converted
      if (!orderId) {
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
          console.error("Order insert error:", orderError);
          setErrorMsg("Failed to create order.");
          return;
        }

        orderId = order.id;

        // 3️⃣ Move quote items to new order
        const { error: itemsError } = await supabase
          .from("order_items")
          .update({ order_id: orderId })
          .eq("order_id", quote.id);

        if (itemsError) {
          console.error("Move items error:", itemsError);
          setErrorMsg("Failed to move quote items.");
          return;
        }

        // 4️⃣ Update quote status + link order id
        await supabase
          .from("orders")
          .update({
            quote_status: "accepted",
            converted_to_order_id: orderId,
          })
          .eq("id", quote.id);
      }

      // 5️⃣ Generate IntaSend payment link
      const paymentRes = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-intasend-payment`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            orderId,
            amount: quote.total,
            customer_name: quote.customers?.name,
            customer_email: quote.customers?.email,
            customer_phone: quote.customers?.phone,
            redirect_url: `${window.location.origin}/order-confirmation/${orderId}`,
          }),
        },
      );

      const paymentJson = await paymentRes.json();

      if (!paymentRes.ok) {
        console.error("Payment link error:", paymentJson);
        setErrorMsg(paymentJson?.error || "Failed to generate payment link.");
        return;
      }

      const paymentUrl = paymentJson?.payment_url;

      if (!paymentUrl) {
        setErrorMsg("Payment link not received.");
        return;
      }

      // 6️⃣ Save payment link to the order
      await supabase
        .from("orders")
        .update({ payment_link: paymentUrl })
        .eq("id", orderId);

      // 7️⃣ Send email to customer with payment link
      const emailHtml = `
        <div style="font-family: Arial, sans-serif; background:#f7f9fc; padding:30px;">
          <div style="max-width:600px; margin:0 auto; background:white; border-radius:12px; overflow:hidden; border:1px solid #e5e7eb;">
            
            <div style="background:#4eb0e3; padding:20px; color:white;">
              <h2 style="margin:0; font-size:20px;">Balm Ortho Medical Supplies</h2>
              <p style="margin:5px 0 0; font-size:14px;">Payment Link for Your Order</p>
            </div>

            <div style="padding:25px; color:#111;">
              <p style="font-size:15px; margin-top:0;">
                Hello <strong>${quote.customers?.name || "Customer"}</strong>,
              </p>

              <p style="font-size:14px; line-height:1.6;">
                Thank you for accepting your quotation. Your order has been created successfully.
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

      const emailRes = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-email`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            to: quote.customers.email,
            subject: "Payment Link - Balm Ortho Medical Supplies",
            html: emailHtml,
          }),
        },
      );

      if (!emailRes.ok) {
        console.error("Email send failed");
        setErrorMsg("Order created but email failed to send.");
        return;
      }

      // 8️⃣ Redirect user to confirmation page
      navigate(`/order-confirmation/${orderId}`);
    } catch (err) {
      console.error("CheckoutFromQuote crash:", err);
      setErrorMsg("Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="flex items-center gap-3 text-gray-600">
          <Loader2 className="w-6 h-6 animate-spin" />
          <p className="text-sm font-medium">Generating payment link...</p>
        </div>
      </div>
    );
  }

  if (errorMsg) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white border rounded-2xl p-6 shadow-sm text-center">
          <h2 className="text-lg font-bold text-gray-900">Checkout Failed</h2>
          <p className="text-sm text-gray-600 mt-2">{errorMsg}</p>

          <button
            onClick={() => navigate("/")}
            className="mt-5 w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-semibold"
          >
            Back Home
          </button>
        </div>
      </div>
    );
  }

  return null;
}
