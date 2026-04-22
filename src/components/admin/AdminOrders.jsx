import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "../../supabaseClient";
import { Loader2, Search, Package, CheckCircle, Clock, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";

function formatKES(amount) {
  return `KES ${Number(amount || 0).toLocaleString()}`;
}

//  Animated badge
function getStatusBadge(status) {
  const base =
    "inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold capitalize";

  if (status === "payment_verified")
    return `${base} bg-green-100 text-green-700`;
  if (status === "payment_failed") return `${base} bg-red-100 text-red-600`;

  return `${base} bg-amber-100 text-amber-700`;
}

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  //  bottom sheet state
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderItems, setOrderItems] = useState({});

  const fetchOrders = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .neq("order_type", "quote") // optional: only show real orders
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
          toast.success(`🆕 New order received!`, {
            position: "top-right",
          });
          fetchOrders();
        },
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, []);

  // Update order
  const updateOrder = async (id, updates) => {
    const { error } = await supabase
      .from("orders")
      .update(updates)
      .eq("id", id);

    if (error) {
      toast.error("Failed to update order", { position: "top-right" });
    } else {
      toast.success("Order updated", { position: "top-right" });
      fetchOrders();
    }
  };

  // Fetch order items
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

    setOrderItems((prev) => ({ ...prev, [orderId]: data }));
  };

  const openSheet = (order) => {
    setSelectedOrder(order);
    fetchOrderItems(order.id);
  };

  const filteredOrders = useMemo(() => {
    if (!search.trim()) return orders;

    return orders.filter((o) =>
      [o.order_number, o.display_name]
        .join(" ")
        .toLowerCase()
        .includes(search.toLowerCase()),
    );
  }, [orders, search]);

  // 🔥 stats back
  const stats = useMemo(() => {
    return {
      total: orders.length,
      verified: orders.filter((o) => o.status === "payment_verified").length,
      pending: orders.filter((o) => o.status === "pending_verification").length,
    };
  }, [orders]);

  return (
    <div className="space-y-6 px-3 md:px-0">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:justify-between gap-3">
        <h1 className="text-2xl font-bold">Orders</h1>

        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search..."
            className="w-full pl-9 pr-3 py-2 border rounded-xl text-sm"
          />
        </div>
      </div>

      {/* 🔥 STATS */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white p-3 rounded-xl shadow text-center">
          <p className="text-xs text-gray-400">Total</p>
          <p className="font-bold">{stats.total}</p>
        </div>
        <div className="bg-white p-3 rounded-xl shadow text-center">
          <p className="text-xs text-gray-400">Verified</p>
          <p className="font-bold text-green-600">{stats.verified}</p>
        </div>
        <div className="bg-white p-3 rounded-xl shadow text-center">
          <p className="text-xs text-gray-400">Pending</p>
          <p className="font-bold text-amber-600">{stats.pending}</p>
        </div>
      </div>

      {/* MOBILE */}
      <div className="space-y-4 md:hidden">
        {filteredOrders.map((order) => (
          <div
            key={order.id}
            className="bg-white border rounded-2xl shadow-sm p-4 space-y-4"
          >
            <div className="flex justify-between">
              <div>
                <p className="text-xs text-gray-400">Order</p>
                <p className="font-semibold">{order.order_number}</p>
              </div>

              <motion.span className={getStatusBadge(order.status)}>
                {order.status?.replace("_", " ")}
              </motion.span>
            </div>

            <div className="flex justify-between">
              <p className="font-bold">{formatKES(order.total_amount)}</p>
              <p className="text-sm text-gray-500">
                {new Date(order.created_at).toLocaleDateString()}
              </p>
            </div>

            {/* 🔥 QUICK CONTROLS (back) */}
            <select
              value={order.status || ""}
              onChange={(e) =>
                updateOrder(order.id, { status: e.target.value })
              }
              className="w-full border rounded-xl px-3 py-2 text-sm"
            >
              <option value="pending_verification">Pending Verification</option>
              <option value="payment_verified">Payment Verified</option>
              <option value="payment_failed">Payment Failed</option>
            </select>

            <button
              onClick={() => openSheet(order)}
              className="w-full py-2 rounded-xl border text-sm text-[#4eb0e3]"
            >
              View Details
            </button>
          </div>
        ))}
      </div>

      {/* 🔥 BOTTOM SHEET FIXED */}
      <AnimatePresence>
        {selectedOrder && (
          <>
            <motion.div
              className="fixed inset-0 bg-black/40 z-40"
              onClick={() => setSelectedOrder(null)}
            />

            <motion.div
              className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl z-50 p-5 max-h-[85vh] overflow-y-auto"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
            >
              <div className="flex justify-between mb-4">
                <h2 className="font-bold">{selectedOrder.order_number}</h2>
                <button onClick={() => setSelectedOrder(null)}>
                  <X />
                </button>
              </div>

              {/* 🔥 CONTROLS RESTORED */}
              <div className="space-y-3">
                <select
                  value={selectedOrder.status || ""}
                  onChange={(e) =>
                    updateOrder(selectedOrder.id, {
                      status: e.target.value,
                    })
                  }
                  className="w-full border rounded-xl p-2"
                >
                  <option value="pending_verification">
                    Pending Verification
                  </option>
                  <option value="payment_verified">Payment Verified</option>
                </select>

                <select
                  value={selectedOrder.tracking_stage || ""}
                  onChange={(e) =>
                    updateOrder(selectedOrder.id, {
                      tracking_stage: e.target.value,
                    })
                  }
                  className="w-full border rounded-xl p-2"
                >
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="shipped">Shipped</option>
                  <option value="delivered">Delivered</option>
                </select>

                <select
                  value={selectedOrder.delivery_status || ""}
                  onChange={(e) =>
                    updateOrder(selectedOrder.id, {
                      delivery_status: e.target.value,
                    })
                  }
                  className="w-full border rounded-xl p-2"
                >
                  <option value="not started">Not Started</option>
                  <option value="in transit">In Transit</option>
                  <option value="delivered">Delivered</option>
                </select>
              </div>

              {/* ITEMS */}
              <div className="mt-4">
                <p className="font-semibold mb-2">Items</p>

                {orderItems[selectedOrder.id]?.map((item) => (
                  <div
                    key={item.id}
                    className="flex justify-between border-b py-2"
                  >
                    <span>{item.products?.name}</span>
                    <span>{formatKES(item.price * item.quantity)}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* DESKTOP UNCHANGED */}
      <div className="hidden md:block bg-white border rounded-2xl shadow-sm overflow-hidden">
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
                <td className="p-4">{order.order_number}</td>
                <td className="p-4">{order.display_name}</td>
                <td className="p-4 font-semibold">
                  {formatKES(order.total_amount)}
                </td>
                <td className="p-4">
                  <span className={getStatusBadge(order.status)}>
                    {order.status}
                  </span>
                </td>
                <td className="p-4">
                  {new Date(order.created_at).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
