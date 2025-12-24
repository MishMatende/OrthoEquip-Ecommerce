// This is where the quote becomes an order and a payment is made

import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../../supabaseClient";

export default function CheckoutFromQuote() {
  const { id } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    convert();
  }, []);

  async function convert() {
    const { data: quote } = await supabase
      .from("orders")
      .select("*")
      .eq("id", id)
      .single();

    const { data: order } = await supabase
      .from("orders")
      .insert({
        user_id: quote.user_id,
        order_type: "order",
        total: quote.total,
        payment_status: "pending_payment",
        converted_from_quote: quote.id,
      })
      .select()
      .single();

    await supabase
      .from("order_items")
      .update({ order_id: order.id })
      .eq("order_id", quote.id);

    navigate(`/checkout/${order.id}`);
  }

  return null;
}
