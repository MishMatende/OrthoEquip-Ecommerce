import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../../supabaseClient";
import { Button } from "../../components/ui/button";
import {
  Loader2,
  FileText,
  CalendarDays,
  CheckCircle,
  Clock,
  XCircle,
  RefreshCcw,
  ShieldCheck,
} from "lucide-react";
import toast from "react-hot-toast";

export default function QuoteDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [quote, setQuote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);

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
        label: "Accepted",
      };
    }

    if (status === "sent") {
      return {
        icon: <Clock className="w-4 h-4" />,
        className: "bg-blue-100 text-blue-700 border-blue-200",
        label: "Sent",
      };
    }

    if (status === "expired") {
      return {
        icon: <XCircle className="w-4 h-4" />,
        className: "bg-red-100 text-red-700 border-red-200",
        label: "Expired",
      };
    }

    return {
      icon: <RefreshCcw className="w-4 h-4" />,
      className: "bg-gray-100 text-gray-700 border-gray-200",
      label: status || "Draft",
    };
  }

  async function acceptQuote() {
    if (!quote) return;

    try {
      setAccepting(true);

      const { error } = await supabase
        .from("orders")
        .update({ quote_status: "accepted" })
        .eq("id", id);

      if (error) {
        console.error("Accept quote error:", error);
        toast.error("Failed to accept quotation");
        return;
      }

      toast.success("Quotation accepted");
      navigate(`/checkout-from-quote/${id}`);
    } catch (err) {
      console.error("Accept quote error:", err);
      toast.error("Something went wrong");
    } finally {
      setAccepting(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="flex items-center gap-3 text-gray-600">
          <Loader2 className="animate-spin w-6 h-6" />
          <p className="text-sm font-medium">Loading quotation...</p>
        </div>
      </div>
    );
  }

  if (!quote) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <p className="text-gray-600 font-medium">Quotation not found.</p>
      </div>
    );
  }

  const status = getStatusStyles(quote.quote_status);

  const expired = quote.valid_until && new Date(quote.valid_until) < new Date();

  const canAccept = !expired && ["sent", "draft"].includes(quote.quote_status);

  return (
    <div className="max-w-6xl mx-auto px-4 py-10 space-y-6">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <FileText className="w-7 h-7 text-blue-600" />
            Quotation
          </h1>

          <p className="text-gray-500 text-sm mt-1">
            Quote ID: <span className="font-medium">{quote.id}</span>
          </p>

          <div className="mt-3 flex flex-wrap items-center gap-3">
            <span
              className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border text-sm font-semibold ${status.className}`}
            >
              {status.icon}
              {expired ? "Expired" : status.label}
            </span>

            <span className="flex items-center gap-2 text-sm text-gray-600">
              <CalendarDays className="w-4 h-4" />
              Valid until:{" "}
              <span className="font-medium text-gray-900">
                {quote.valid_until
                  ? new Date(quote.valid_until).toLocaleDateString()
                  : "—"}
              </span>
            </span>
          </div>
        </div>

        {/* TOTAL CARD */}
        <div className="bg-gradient-to-br from-blue-50 to-white border border-blue-100 rounded-2xl p-5 shadow-sm w-full md:w-[320px]">
          <p className="text-sm text-gray-500">Total Amount</p>
          <p className="text-3xl font-extrabold text-blue-700 mt-2">
            {formatKES(quote.total || total)}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Includes all selected items
          </p>
        </div>
      </div>

      {/* MAIN GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ITEMS */}
        <div className="lg:col-span-2 rounded-2xl border bg-white shadow-sm overflow-hidden">
          <div className="p-5 border-b">
            <h2 className="text-lg font-bold text-gray-900">Items</h2>
            <p className="text-sm text-gray-500">
              Products included in your quotation
            </p>
          </div>

          <div className="divide-y">
            {quote.order_items?.map((i, idx) => (
              <div
                key={idx}
                className="p-5 flex items-center justify-between hover:bg-gray-50 transition"
              >
                <div>
                  <p className="font-semibold text-gray-900">
                    {i.products?.name || "Unknown Product"}
                  </p>

                  <p className="text-sm text-gray-500">
                    {i.quantity} × {formatKES(i.price)}
                  </p>
                </div>

                <p className="font-bold text-gray-900">
                  {formatKES(Number(i.quantity) * Number(i.price))}
                </p>
              </div>
            ))}
          </div>

          <div className="p-5 bg-gray-50 flex justify-between items-center">
            <p className="font-semibold text-gray-700">Grand Total</p>
            <p className="text-xl font-bold text-gray-900">
              {formatKES(quote.total || total)}
            </p>
          </div>
        </div>

        {/* RIGHT SIDE */}
        <div className="space-y-6">
          {/* CUSTOMER CARD */}
          <div className="rounded-2xl border bg-white shadow-sm p-5">
            <h2 className="text-lg font-bold text-gray-900 mb-3">
              Customer Details
            </h2>

            <div className="space-y-2 text-sm text-gray-700">
              <p>
                <span className="font-semibold">Name:</span>{" "}
                {quote.customers?.name || "—"}
              </p>
              <p>
                <span className="font-semibold">Phone:</span>{" "}
                {quote.customers?.phone || "—"}
              </p>
              <p>
                <span className="font-semibold">Email:</span>{" "}
                {quote.customers?.email || "—"}
              </p>
              <p>
                <span className="font-semibold">City:</span>{" "}
                {quote.customers?.city || "—"}
              </p>
              <p>
                <span className="font-semibold">Address:</span>{" "}
                {quote.customers?.address || "—"}
              </p>
            </div>
          </div>

          {/* ACTION CARD */}
          <div className="rounded-2xl border bg-white shadow-sm p-5">
            <h2 className="text-lg font-bold text-gray-900 mb-2">Actions</h2>

            <p className="text-sm text-gray-500 mb-4">
              Review the quotation and proceed to checkout.
            </p>

            {canAccept ? (
              <Button
                onClick={acceptQuote}
                disabled={accepting}
                className="w-full rounded-xl py-6 text-base font-semibold"
              >
                {accepting ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Processing...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5" />
                    Accept Quote & Checkout
                  </span>
                )}
              </Button>
            ) : (
              <div className="text-sm text-gray-600 bg-gray-50 border border-gray-100 rounded-xl p-4">
                This quotation cannot be accepted.
                <div className="mt-2 font-semibold text-gray-900 capitalize">
                  Current status: {expired ? "expired" : quote.quote_status}
                </div>
              </div>
            )}
          </div>

          {/* NOTE */}
          <div className="rounded-2xl border bg-blue-50 p-5">
            <p className="text-sm font-semibold text-blue-900">Note:</p>
            <p className="text-sm text-blue-800 mt-1 leading-relaxed">
              Once accepted, you will be redirected to checkout to complete
              payment and confirm your order.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
