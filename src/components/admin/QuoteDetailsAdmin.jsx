import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../../supabaseClient";
import { Button } from "../../components/ui/button";
import { Loader2 } from "lucide-react";
import { PDFDownloadLink } from "@react-pdf/renderer";
import QuotePDF from "../../components/QuotePDF";

export default function QuoteDetailsAdmin() {
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
        order_items (
          quantity,
          price,
          products (name)
        )
      `
      )
      .eq("id", id)
      .single()
      .then(({ data }) => {
        setQuote(data);
        setLoading(false);
      });
  }, [id]);

  async function convertToOrder() {
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

    navigate(`/admin/orders/${order.id}`);
  }

  if (loading) return <Loader2 className="animate-spin" />;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Quotation</h1>

      <p>Status: {quote.quote_status}</p>
      <p>Valid until: {quote.valid_until}</p>

      <div className="border rounded p-4 space-y-2">
        {quote.order_items.map((i, idx) => (
          <div key={idx} className="flex justify-between">
            <span>{i.products.name}</span>
            <span>
              {i.quantity} × {i.price}
            </span>
          </div>
        ))}
      </div>

      <p className="font-bold">Total: {quote.total}</p>

      {quote.quote_status === "accepted" && (
        <Button onClick={convertToOrder}>Convert to Order</Button>
      )}
      <PDFDownloadLink
        document={<QuotePDF quote={quote} />}
        fileName={`quote-${quote.id}.pdf`}
      >
        <Button variant="outline">Download PDF</Button>
      </PDFDownloadLink>
    </div>
  );
}
