import { useEffect, useState, useCallback } from "react";
import { supabase } from "../../supabaseClient";
import { Link } from "react-router-dom";
import { Button } from "../../components/ui/button";
import { MessageCircle, Plus, Loader2, Trash2 } from "lucide-react";
import { UserAuth } from "../../context/AuthContext";
import toast from "react-hot-toast";

// 🧩 Dialog imports
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "../../components/ui/dialog";

export default function Quotes() {
  const [quotes, setQuotes] = useState([]);
  const [filter, setFilter] = useState("All");
  const { session } = UserAuth();
  const [sendingEmailId, setSendingEmailId] = useState(null);
  const [loading, setLoading] = useState(true);

  // 🔥 Modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedQuote, setSelectedQuote] = useState(null);

  const fetchQuotes = useCallback(async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from("orders")
        .select(
          "id, total, quote_status, valid_until, customer_id, created_at, quote_number",
        )
        .eq("order_type", "quote")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Quotes fetch error:", error);
        toast.error("Failed to load quotations");
        setQuotes([]);
        return;
      }

      if (!data || data.length === 0) {
        setQuotes([]);
        return;
      }

      // Fetch related customers manually
      const customerIds = [
        ...new Set(data.map((q) => q.customer_id).filter(Boolean)),
      ];

      const { data: customers, error: customersError } = await supabase
        .from("customers")
        .select("id, name, email, phone")
        .in("id", customerIds);

      if (customersError) {
        console.error("Customers fetch error:", customersError);
      }

      const customersMap = Object.fromEntries(
        (customers || []).map((c) => [c.id, c]),
      );

      setQuotes(
        data.map((q) => ({
          ...q,
          customer: customersMap[q.customer_id] || null,
        })),
      );
    } catch (err) {
      console.error("Fetch quotes failed:", err);
      toast.error("Failed to load quotations");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchQuotes();
  }, [fetchQuotes]);

  // 🔥 refetch when user comes back to tab
  useEffect(() => {
    const onFocus = () => fetchQuotes();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [fetchQuotes]);

  // 🗑 DELETE FUNCTION
  async function deleteQuote() {
    if (!selectedQuote) return;

    const { error } = await supabase
      .from("orders")
      .delete()
      .eq("id", selectedQuote.id)
      .eq("quote_status", "draft");

    if (error) {
      console.error("Delete failed:", error);
      toast.error("Failed to delete quotation");
      return;
    }

    setQuotes((prev) => prev.filter((q) => q.id !== selectedQuote.id));

    toast.success("Quotation deleted");
    setDeleteModalOpen(false);
    setSelectedQuote(null);
  }

  async function markQuoteAsSent(quoteId) {
    const { error } = await supabase
      .from("orders")
      .update({ quote_status: "sent" })
      .eq("id", quoteId)
      .in("quote_status", ["draft"]);

    if (error) {
      console.error("Failed to mark quote as sent:", error);
      return;
    }

    // Update UI instantly
    setQuotes((prev) =>
      prev.map((q) => (q.id === quoteId ? { ...q, quote_status: "sent" } : q)),
    );
  }

  async function shareOnWhatsApp(quote) {
    if (!quote.customer?.phone) {
      toast.error("Customer phone number missing");
      return;
    }

    const link = `${window.location.origin}/quote/${quote.id}`;
    const message = `Quotation from our store:\n${link}`;

    // Open WhatsApp immediately
    window.open(
      `https://wa.me/${quote.customer.phone}?text=${encodeURIComponent(
        message,
      )}`,
      "_blank",
    );

    // Mark quote as SENT if it was draft
    await markQuoteAsSent(quote.id);
  }

  async function sendQuoteEmail(quote) {
    const email = quote.customer?.email;

    if (!email) {
      toast.error("Customer email missing");
      return;
    }

    try {
      setSendingEmailId(quote.id);

      const link = `${window.location.origin}/quote/${quote.id}`;

      const html = `
  <div style="font-family: Arial, sans-serif; background:#f7f9fc; padding:30px;">
    <div style="max-width:600px; margin:0 auto; background:white; border-radius:12px; overflow:hidden; border:1px solid #e5e7eb;">
      
      <div style="background:#4eb0e3; padding:20px; color:white;">
        <h2 style="margin:0; font-size:20px;">Balm Ortho Medical Supplies</h2>
        <p style="margin:5px 0 0; font-size:14px;">Your Quotation is Ready</p>
      </div>

      <div style="padding:25px; color:#111;">
        <p style="font-size:15px; margin-top:0;">
                Hello <strong>${quote?.customer?.name || "Customer"}</strong>,
        </p>

        <p style="font-size:14px; line-height:1.6;">
          Thank you for choosing <strong>Balm Ortho Medical Supplies</strong>.
          Your quotation has been prepared and is ready for review.
        </p>

        <div style="background:#f3f4f6; padding:15px; border-radius:10px; margin:20px 0;">
          <p style="margin:0; font-size:14px;">
            <strong>Quotation Number:</strong> ${quote.quote_number}
          </p>
          <p style="margin:6px 0 0; font-size:14px;">
                  <strong>Total Amount:</strong> KES ${Number(
                    quote.total || 0,
                  ).toLocaleString()}
          </p>
        </div>

        <p style="font-size:14px; margin-bottom:20px;">
          Click the button below to view your quotation:
        </p>

        <a href="${link}"
          style="
            display:inline-block;
            background:#4eb0e3;
            color:white;
            padding:12px 18px;
            text-decoration:none;
            border-radius:8px;
            font-weight:bold;
            font-size:14px;
          ">
          View Quotation
        </a>

        <p style="font-size:12px; color:#6b7280; margin-top:25px;">
          If the button doesn’t work, copy and paste this link into your browser:
          <br/>
          <a href="${link}" style="color:#4eb0e3;">${link}</a>
        </p>
      </div>

      <div style="padding:15px; background:#f9fafb; border-top:1px solid #e5e7eb; font-size:12px; color:#6b7280; text-align:center;">
        Balm Ortho Medical Supplies • Nairobi, Kenya <br/>
        Need help? Reply to this email.
      </div>

    </div>
  </div>
`;

      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-email`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            to: email,
            subject: `Quotation from Balm Ortho Medical Supplies`,
            html,
          }),
        },
      );

      if (!res.ok) {
        toast.error("Failed to send email");
      } else {
        toast.success("Email sent");

        // Mark quote as SENT if it was draft
        await markQuoteAsSent(quote.id);
      }
    } catch (err) {
      console.error("Email send error:", err);
      toast.error("Failed to send email");
    } finally {
      setSendingEmailId(null);
    }
  }

  // 🕒 Expiry helper
  const isExpired = (q) =>
    q.valid_until && new Date(q.valid_until) < new Date();

  // 🔎 Filter logic
  const filteredQuotes = quotes.filter((q) => {
    if (filter === "All") return true;
    if (filter === "expired") return isExpired(q);
    return q.quote_status === filter;
  });

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Quotations</h1>

        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchQuotes}>
            Refresh
          </Button>

          <Link to="/admin/quotes/new">
            <Button>
              <Plus className="w-4 h-4 mr-1" />
              Create Quotation
            </Button>
          </Link>
        </div>
      </div>

      {/* FILTERS */}
      <div className="flex gap-2 flex-wrap">
        {["All", "draft", "sent", "accepted", "expired"].map((f) => (
          <Button
            key={f}
            variant={filter === f ? "default" : "outline"}
            onClick={() => setFilter(f)}
            size="sm"
          >
            {f}
          </Button>
        ))}
      </div>

      {loading && (
        <div className="flex items-center gap-2 text-gray-500 text-sm">
          <Loader2 className="w-4 h-4 animate-spin" />
          Loading quotations...
        </div>
      )}

      {!loading && filteredQuotes.length === 0 && (
        <p className="text-sm text-gray-500">
          No quotations found for this filter.
        </p>
      )}

      {!loading &&
        filteredQuotes.map((q) => {
          const expired = isExpired(q);

          return (
            <div
              key={q.id}
              className={`border p-4 rounded flex justify-between items-center ${
                expired ? "border-red-400 bg-red-50" : ""
              }`}
            >
              <div className="space-y-1">
                <p className="font-semibold">
                  {q.customer?.name || q.customer?.email || "Guest"}
                </p>

                <p className="font-semibold">Quote Number: {q.quote_number}</p>

                <p>
                  Status:{" "}
                  <span className="font-semibold capitalize">
                    {q.quote_status}
                  </span>
                </p>

                <p>
                  Total:{" "}
                  <span className="font-semibold">
                    KES {Number(q.total || 0).toLocaleString()}
                  </span>
                </p>

                <p>
                  Valid until:{" "}
                  <span className={expired ? "text-red-600 font-medium" : ""}>
                    {q.valid_until || "—"}
                  </span>
                </p>
              </div>

              <div className="flex gap-2 items-center">
                <Link to={`/admin/quotes/${q.id}`}>
                  <Button variant="outline">View</Button>
                </Link>

                <Button variant="outline" onClick={() => shareOnWhatsApp(q)}>
                  <MessageCircle className="w-4 h-4 mr-1" />
                  WhatsApp
                </Button>

                <Button
                  variant="outline"
                  onClick={() => sendQuoteEmail(q)}
                  disabled={sendingEmailId === q.id}
                >
                  {sendingEmailId === q.id ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    "Email"
                  )}
                </Button>

                {/* 🗑 DELETE BUTTON */}
                {q.quote_status === "draft" && (
                  <Button
                    variant="destructive"
                    onClick={() => {
                      setSelectedQuote(q);
                      setDeleteModalOpen(true);
                    }}
                    className="border cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </Button>
                )}
              </div>
            </div>
          );
        })}

      {/* 🧩 DELETE CONFIRM MODAL */}
      <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Quotation</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this quotation?
              <br />
              <span className="font-semibold">
                Quote ID: {selectedQuote?.id}
              </span>
              <br />
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDeleteModalOpen(false);
                setSelectedQuote(null);
              }}
              className="cursor-pointer"
            >
              Cancel
            </Button>

            <Button
              variant="destructive"
              onClick={deleteQuote}
              className="bg-red-500 text-white cursor-pointer"
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
