import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../../supabaseClient";
import { Button } from "../../components/ui/button";
import {
  Loader2,
  ArrowLeft,
  FileDown,
  CheckCircle,
  Clock,
  XCircle,
  RefreshCcw,
} from "lucide-react";
import { pdf, PDFDownloadLink, PDFViewer } from "@react-pdf/renderer";
import QuotePDF from "../../components/QuotePDF";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../ui/dialog";
import { UserAuth } from "../../context/AuthContext";

export default function QuoteDetailsAdmin() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [quote, setQuote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [converting, setConverting] = useState(false);
  const [pdfOpen, setPdfOpen] = useState(false);

  const { userProfile } = UserAuth();

  useEffect(() => {
    async function fetchQuote() {
      setLoading(true);

      const { data, error } = await supabase
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
        .single();

      if (error) {
        console.error("Quote fetch error:", error);
        setLoading(false);
        return;
      }

      setQuote(data);
      setLoading(false);
    }

    fetchQuote();
  }, [id]);

  const total = useMemo(() => {
    if (!quote?.order_items) return 0;
    return quote.order_items.reduce(
      (sum, i) => sum + Number(i.quantity) * Number(i.price),
      0,
    );
  }, [quote]);

  const formatKES = (amount) =>
    `KES ${Number(amount || 0).toLocaleString(undefined, {
      minimumFractionDigits: 0,
    })}`;

  function getStatusStyles(status) {
    if (status === "accepted") {
      return {
        icon: <CheckCircle className="w-4 h-4" />,
        className: "bg-green-100 text-green-700 border-green-200",
      };
    }

    if (status === "sent") {
      return {
        icon: <Clock className="w-4 h-4" />,
        className: "bg-blue-100 text-blue-700 border-blue-200",
      };
    }

    if (status === "expired") {
      return {
        icon: <XCircle className="w-4 h-4" />,
        className: "bg-red-100 text-red-700 border-red-200",
      };
    }

    return {
      icon: <RefreshCcw className="w-4 h-4" />,
      className: "bg-gray-100 text-gray-700 border-gray-200",
    };
  }

  async function convertToOrder() {
    if (!quote) return;

    try {
      setConverting(true);

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

      if (orderError) {
        console.error("Failed to convert quote:", orderError);
        setConverting(false);
        return;
      }

      const { error: itemsError } = await supabase
        .from("order_items")
        .update({ order_id: order.id })
        .eq("order_id", quote.id);

      if (itemsError) {
        console.error("Failed to move order items:", itemsError);
        setConverting(false);
        return;
      }

      navigate(`/admin/orders/${order.id}`);
    } catch (err) {
      console.error("Convert error:", err);
    } finally {
      setConverting(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="flex items-center gap-2 text-gray-600">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="text-sm font-medium">Loading quotation...</span>
        </div>
      </div>
    );
  }

  if (!quote) {
    return (
      <div className="max-w-4xl mx-auto py-12 text-center space-y-4">
        <h2 className="text-xl font-bold">Quotation not found</h2>
        <p className="text-sm text-gray-500">
          This quotation may have been deleted or you don’t have access.
        </p>
        <Button onClick={() => navigate("/admin/quotes")}>
          Back to Quotations
        </Button>
      </div>
    );
  }

  const status = getStatusStyles(quote.quote_status);

  async function downloadPDF() {
    const blob = await pdf(<QuotePDF quote={quote} />).toBlob();
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `quote-${quote.id}.pdf`;
    a.click();

    URL.revokeObjectURL(url);
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 px-3 md:px-0">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="space-y-1 text-left items-start flex flex-col">
          <Button
            variant="outline"
            onClick={() => navigate("/admin/quotes")}
            className="w-fit flex items-center gap-2 rounded-full border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 hover:border-gray-300 hover:text-black transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Quotations
          </Button>

          <h1 className="text-2xl font-bold tracking-tight">
            Quotation Details
          </h1>

          <p className="text-sm text-gray-500">
            Quote ID:{" "}
            <span className="font-medium text-gray-800">{quote.id}</span>
          </p>
        </div>

        {/* ACTIONS */}
        <div className="flex gap-2 flex-wrap">
          {quote.quote_status === "accepted" && (
            <Button onClick={convertToOrder} disabled={converting}>
              {converting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Converting...
                </>
              ) : (
                "Convert to Order"
              )}
            </Button>
          )}

          <Button variant="outline" onClick={() => setPdfOpen(true)}>
            <FileDown className="w-4 h-4 mr-2" />
            View PDF
          </Button>
        </div>
      </div>

      {/* TOP CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* STATUS */}
        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500 mb-2">Status</p>
          <div
            className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border text-sm font-medium ${status.className}`}
          >
            {status.icon}
            {quote.quote_status || "draft"}
          </div>
        </div>

        {/* VALID UNTIL */}
        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500 mb-2">Valid Until</p>
          <p className="text-lg font-semibold">
            {quote.valid_until
              ? new Date(quote.valid_until).toLocaleDateString()
              : "—"}
          </p>
        </div>

        {/* TOTAL */}
        <div className="rounded-2xl border bg-gradient-to-br from-blue-50 to-white p-5 shadow-sm">
          <p className="text-sm text-gray-500 mb-2">Total Amount</p>
          <p className="text-2xl font-bold tracking-tight">
            {formatKES(quote.total || total)}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Includes all selected items
          </p>
        </div>
      </div>

      {/* ITEMS */}
      <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
        <div className="p-5 border-b">
          <h2 className="text-lg font-bold">Items</h2>
          <p className="text-sm text-gray-500">
            Products included in this quotation
          </p>
        </div>

        <div className="divide-y">
          {quote.order_items.map((i, idx) => (
            <div
              key={idx}
              className="p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-2"
            >
              <div className="flex flex-col items-start text-left">
                <p className="font-semibold text-gray-900">
                  {i.products?.name || "Unknown Product"}
                </p>

                <p className="text-sm text-gray-500">
                  {i.quantity} × {formatKES(i.price)}
                </p>
              </div>

              <p className="font-bold text-gray-900 md:text-right">
                {formatKES(Number(i.quantity) * Number(i.price))}
              </p>
            </div>
          ))}
        </div>

        {/* FOOTER TOTAL */}
        <div className="p-5 bg-gray-50 flex justify-between items-center">
          <p className="font-semibold text-gray-700">Grand Total</p>
          <p className="text-xl font-bold">{formatKES(quote.total || total)}</p>
        </div>
      </div>
      <Dialog open={pdfOpen} onOpenChange={setPdfOpen}>
        <DialogContent className="max-w-7xl w-[98vw] h-[92vh] p-0 overflow-hidden rounded-2xl flex flex-col">
          {/* HEADER */}
          <DialogHeader className="px-6 py-4 border-b bg-white flex flex-row items-center justify-between">
            <div className="space-y-1">
              <DialogTitle className="text-lg font-bold text-gray-900">
                Quotation PDF Preview
              </DialogTitle>

              <DialogDescription className="text-sm text-gray-500">
                Preview the quotation and download it from the toolbar or
                button.
              </DialogDescription>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={downloadPDF}
                className="whitespace-nowrap rounded-full px-5 shadow-sm"
              >
                <FileDown className="w-4 h-4 mr-2" />
                Download PDF
              </Button>
            </div>
          </DialogHeader>

          {/* PDF VIEW */}
          <div className="flex-1 bg-gray-100 p-2">
            <PDFViewer width="100%" height="100%" showToolbar={true}>
              <QuotePDF quote={quote} createdBy={userProfile?.username} />
            </PDFViewer>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
