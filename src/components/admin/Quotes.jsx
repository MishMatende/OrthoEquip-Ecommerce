import { useEffect, useState } from "react";
import { supabase } from "../../supabaseClient";
import { Link } from "react-router-dom";
import { Button } from "../../components/ui/button";
import { MessageCircle, Plus } from "lucide-react";
import { UserAuth } from "../../context/AuthContext";

export default function Quotes() {
  const [quotes, setQuotes] = useState([]);
  const [filter, setFilter] = useState("all");
  const { session } = UserAuth();

  useEffect(() => {
    supabase
      .from("orders")
      .select("id, total_amount, quote_status, valid_until, user_id")
      .eq("order_type", "quote")
      .order("created_at", { ascending: false })
      .then(async ({ data, error }) => {
        if (error) {
          console.error("Quotes fetch error:", error);
          return;
        }

        if (!data || data.length === 0) {
          setQuotes([]);
          return;
        }

        // Fetch related profiles manually
        const userIds = [...new Set(data.map((q) => q.user_id))];

        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, username, email, phone")
          .in("id", userIds);

        const profilesMap = Object.fromEntries(
          (profiles || []).map((p) => [p.id, p])
        );

        setQuotes(
          data.map((q) => ({
            ...q,
            profile: profilesMap[q.user_id] || null,
          }))
        );
      });
  }, []);

  async function shareOnWhatsApp(quote) {
    if (!quote.profile?.phone) {
      alert("Customer phone number missing");
      return;
    }

    const link = `${window.location.origin}/quote/${quote.id}`;
    const message = `Quotation from our store:\n${link}`;

    // Open WhatsApp immediately
    window.open(
      `https://wa.me/${quote.profile.phone}?text=${encodeURIComponent(
        message
      )}`,
      "_blank"
    );

    // Mark quote as SENT
    const { error } = await supabase
      .from("orders")
      .update({ quote_status: "sent" })
      .eq("id", quote.id);

    if (!error) {
      setQuotes((prev) =>
        prev.map((q) =>
          q.id === quote.id ? { ...q, quote_status: "sent" } : q
        )
      );
    }
  }

  async function sendQuoteEmail(quote) {
    const email = quote.profile?.email;

    if (!email) {
      alert("Customer email missing");
      return;
    }

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
          subject: "Your Quotation",
          html: `
          <h2>Your quotation is ready</h2>
          <p>Please review it using the link below:</p>
          <a href="${window.location.origin}/quote/${quote.id}">
            View quotation
          </a>
        `,
        }),
      }
    );

    if (!res.ok) {
      alert("Failed to send email");
    } else {
      alert("Email sent");
    }
  }

  // 🔎 Filter logic
  const filteredQuotes = quotes.filter((q) => {
    if (filter === "all") return true;
    return q.quote_status === filter;
  });

  // 🕒 Expiry helper
  const isExpired = (q) =>
    q.valid_until && new Date(q.valid_until) < new Date();

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* 🔝 HEADER */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Quotations</h1>

        <Link to="/admin/quotes/new">
          <Button>
            <Plus className="w-4 h-4 mr-1" />
            Create Quotation
          </Button>
        </Link>
      </div>

      {/* 🎛 FILTERS */}
      <div className="flex gap-2 flex-wrap">
        {["all", "draft", "sent", "accepted", "expired"].map((f) => (
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

      {/* 📋 QUOTE LIST */}
      {filteredQuotes.length === 0 && (
        <p className="text-sm text-gray-500">
          No quotations found for this filter.
        </p>
      )}

      {filteredQuotes.map((q) => {
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
                {q.profile?.username || q.profile?.email || "Guest"}
              </p>
              <p className="font-semibold">Quote ID: {q.id}</p>
              <p>Status: {q.quote_status}</p>
              <p>Total: {q.total_amount}</p>
              <p>
                Valid until:{" "}
                <span className={expired ? "text-red-600 font-medium" : ""}>
                  {q.valid_until || "—"}
                </span>
              </p>
            </div>

            <div className="flex gap-2">
              {/* ✅ ADMIN VIEW */}
              <Link to={`/admin/quotes/${q.id}`}>
                <Button variant="outline">View</Button>
              </Link>

              <Button variant="outline" onClick={() => shareOnWhatsApp(q)}>
                <MessageCircle className="w-4 h-4 mr-1" />
                WhatsApp
              </Button>
              <Button variant="outline" onClick={() => sendQuoteEmail(q)}>
                Email
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
