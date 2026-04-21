import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "../../supabaseClient";
import {
  Loader2,
  ChevronDown,
  Search,
  Package,
  CheckCircle,
  Clock,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";

function formatKES(amount) {
  return `KES ${Number(amount || 0).toLocaleString()}`;
}

function getStatusBadge(status) {
  const base =
    "inline-flex items-center px-3 py-1 rounded-full text-xs font-medium";

  if (status === "payment_verified")
    return `${base} bg-green-100 text-green-700`;
  if (status === "payment_failed") return `${base} bg-red-100 text-red-700`;
  return `${base} bg-yellow-100 text-yellow-700`;
}

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [orderItems, setOrderItems] = useState({});
  const [search, setSearch] = useState("");

  // 🔥 Fetch orders + resolve usernames
  const fetchOrders = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .neq("order_type", "quote")
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Failed to fetch orders");
      setLoading(false);
      return;
    }

    if (!data || data.length === 0) {
      setOrders([]);
      setLoading(false);
      return;
    }

    // 🔥 Collect user_ids
    const userIds = [...new Set(data.map((o) => o.user_id).filter(Boolean))];

    // 🔥 Fetch profiles
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, username")
      .in("id", userIds);

    // 🔥 Fetch customers
    const { data: customers } = await supabase
      .from("customers")
      .select("id, name")
      .in("id", userIds);

    const profileMap = Object.fromEntries(
      (profiles || []).map((p) => [p.id, p.username]),
    );

    const customerMap = Object.fromEntries(
      (customers || []).map((c) => [c.id, c.name]),
    );

    // 🔥 Attach display name
    const enrichedOrders = data.map((o) => ({
      ...o,
      display_name: profileMap[o.user_id] || customerMap[o.user_id] || "Guest",
    }));

    setOrders(enrichedOrders);
    setLoading(false);
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  // Realtime updates
  useEffect(() => {
    const channel = supabase
      .channel("orders-changes")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "orders" },
        () => {
          toast.success("🆕 New order received!");
          fetchOrders();
        },
      )
      .subscribe();

    return () => channel.unsubscribe();
  }, []);

  const updateOrder = async (id, updates) => {
    const { error } = await supabase
      .from("orders")
      .update(updates)
      .eq("id", id);

    if (error) {
      toast.error("Failed to update order");
    } else {
      toast.success("Order updated");
      fetchOrders();
    }
  };

  const fetchOrderItems = async (orderId) => {
    const { data, error } = await supabase
      .from("order_items")
      .select(
        `
        *,
        products:product_id (
          id,
          name,
          image_url,
          price
        )
      `,
      )
      .eq("order_id", orderId);

    if (!error) {
      setOrderItems((prev) => ({ ...prev, [orderId]: data }));
    }
  };

  const toggleExpand = (orderId) => {
    if (expandedOrder === orderId) {
      setExpandedOrder(null);
    } else {
      setExpandedOrder(orderId);
      fetchOrderItems(orderId);
    }
  };

  // 🔎 Search updated
  const filteredOrders = useMemo(() => {
    if (!search.trim()) return orders;

    return orders.filter((o) => {
      return (
        o.order_number?.toLowerCase().includes(search.toLowerCase()) ||
        o.display_name?.toLowerCase().includes(search.toLowerCase()) ||
        o.payment_method?.toLowerCase().includes(search.toLowerCase())
      );
    });
  }, [orders, search]);

  const stats = useMemo(() => {
    return {
      total: orders.length,
      verified: orders.filter((o) => o.status === "payment_verified").length,
      pending: orders.filter((o) => o.status === "pending_verification").length,
    };
  }, [orders]);

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex justify-between">
        <h1 className="text-3xl font-bold">Orders</h1>

        <div className="relative w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search order number, name..."
            className="w-full pl-9 pr-3 py-2 border rounded-xl text-sm"
          />
        </div>
      </div>

      {/* TABLE */}
      {loading ? (
        <div className="flex justify-center items-center h-40">
          <Loader2 className="animate-spin" />
        </div>
      ) : (
        <div className="bg-white border rounded-2xl overflow-hidden">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-xs uppercase">
              <tr>
                <th className="p-4 text-left">Order</th>
                <th className="p-4 text-left">User</th>
                <th className="p-4 text-left">Total</th>
                <th className="p-4 text-left">Status</th>
                <th className="p-4 text-left">Date</th>
              </tr>
            </thead>

            <tbody>
              {filteredOrders.map((order) => (
                <tr key={order.id} className="border-t">
                  {/* ✅ ORDER NUMBER */}
                  <td className="p-4 font-semibold">
                    {order.order_number || "—"}
                  </td>

                  {/* ✅ DISPLAY NAME */}
                  <td className="p-4">{order.display_name}</td>

                  <td className="p-4 font-semibold">
                    {formatKES(order.total_amount)}
                  </td>

                  <td className="p-4">
                    <span className={getStatusBadge(order.status)}>
                      {order.status}
                    </span>
                  </td>

                  <td className="p-4 text-xs text-gray-500">
                    {new Date(order.created_at).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
