import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../../supabaseClient";
import { Loader2 } from "lucide-react";

export default function CheckoutFromQuote() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    convertQuoteToOrder();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function convertQuoteToOrder() {
    try {
      setLoading(true);

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
        .eq("id", id)
        .single();

      if (quoteError || !quote) {
        console.error("Quote fetch error:", quoteError);
        alert("Quote not found.");
        navigate("/");
        return;
      }

      let orderId = quote.converted_to_order_id;

      // 2️⃣ If not converted, create new order
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
          alert("Failed to create order.");
          return;
        }

        orderId = order.id;

        // 3️⃣ Move quote items to new order
        const { error: itemsError } = await supabase
          .from("order_items")
          .update({ order_id: orderId })
          .eq("order_id", quote.id);

        if (itemsError) {
          console.error("Failed to move order items:", itemsError);
          alert("Failed to move order items.");
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

      // 5️⃣ Create IntaSend payment link using Edge Function
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;

      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-intasend-payment`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
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

      const json = await res.json();

      if (!res.ok) {
        console.error("IntaSend error:", json);
        alert(json?.error || "Failed to create payment link.");
        return;
      }

      const paymentUrl = json?.payment_url;

      if (!paymentUrl) {
        alert("Payment link not received.");
        return;
      }

      // (Optional) store payment URL in order for tracking
      await supabase
        .from("orders")
        .update({ payment_link: paymentUrl })
        .eq("id", orderId);

      // 6️⃣ Redirect to IntaSend checkout page
      window.location.href = paymentUrl;
    } catch (err) {
      console.error("Conversion error:", err);
      alert("Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="flex items-center gap-3 text-gray-600">
        <Loader2 className="w-6 h-6 animate-spin" />
        <p className="text-sm font-medium">Preparing payment checkout...</p>
      </div>
    </div>
  );
}
