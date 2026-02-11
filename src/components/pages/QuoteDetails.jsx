// This is where a quotation is viewed and accepted

import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../../supabaseClient";
import { Button } from "../../components/ui/button";
import { Loader2 } from "lucide-react";

export default function QuoteDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [quote, setQuote] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("orders")
      .select(
        `
        *,
    customers (
      id,
      name,
      phone,
      email,
      address,
      city
    ),
        order_items (
          quantity,
          price,
          products (name)
        )
      `,
      )
      .eq("id", id)
      .single()
      .then(({ data, error }) => {
        if (error) {
          console.error("Quote fetch error:", error);
          setLoading(false);
          return;
        }

        setQuote(data);
        setLoading(false);
      });
  }, [id]);

  async function acceptQuote() {
    await supabase
      .from("orders")
      .update({ quote_status: "accepted" })
      .eq("id", id);

    navigate(`/checkout-from-quote/${id}`);
  }

  if (loading) return <Loader2 className="animate-spin" />;
  if (!quote) return <p className="text-center mt-10">Quotation not found.</p>;

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <h1 className="text-2xl font-bold">Quotation</h1>
      <p>Status: {quote.quote_status}</p>
      <p>Valid until: {quote.valid_until}</p>

      {quote.order_items.map((i, idx) => (
        <div key={idx} className="flex justify-between">
          <span>{i.products.name}</span>
          <span>
            {i.quantity} × {i.price}
          </span>
        </div>
      ))}

      <p className="font-bold">Total: {quote.total}</p>

      {quote.quote_status === "sent" && (
        <Button variant="default" onClick={acceptQuote}>
          {" "}
          Accept Quote
        </Button>
      )}
    </div>
  );
}
