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
        .select("*")
        .eq("id", id)
        .single();

      if (quoteError || !quote) {
        console.error("Quote fetch error:", quoteError);
        alert("Quote not found.");
        navigate("/");
        return;
      }

      // 2️⃣ Prevent double conversion
      if (quote.converted_to_order_id) {
        navigate(`/checkout/${quote.converted_to_order_id}`);
        return;
      }

      // 3️⃣ Create new order
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

      // 4️⃣ Move items from quote to new order
      const { error: itemsError } = await supabase
        .from("order_items")
        .update({ order_id: order.id })
        .eq("order_id", quote.id);

      if (itemsError) {
        console.error("Failed to move order items:", itemsError);
        alert("Failed to move order items.");
        return;
      }

      // 5️⃣ Update quote status + link order id
      await supabase
        .from("orders")
        .update({
          quote_status: "accepted",
          converted_to_order_id: order.id,
        })
        .eq("id", quote.id);

      // 6️⃣ Redirect to checkout
      navigate(`/checkout/${order.id}`);
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
        <p className="text-sm font-medium">Preparing checkout...</p>
      </div>
    </div>
  );
}
