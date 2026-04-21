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

  // Fetch orders
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

    if (error) {
      toast.error("Failed to load order details", { position: "top-right" });
      return;
    }

    setOrderItems((prev) => ({ ...prev, [orderId]: data }));
  };

  const toggleExpand = (orderId) => {
    if (expandedOrder === orderId) {
      setExpandedOrder(null);
    } else {
      setExpandedOrder(orderId);
      fetchOrderItems(orderId);
    }
  };

  // Search filter
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

  // Quick stats
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
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            Orders
          </h1>
          <p className="text-sm text-gray-500">
            Manage all customer orders and track deliveries.
          </p>
        </div>

        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search order number, name..."
            className="w-full pl-9 pr-3 py-2 border rounded-xl text-sm bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-[#4eb0e3]"
          />
        </div>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl border bg-white p-4 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
            <Package className="w-5 h-5 text-[#4eb0e3]" />
          </div>
          <div>
            <p className="text-xs text-gray-500">Total Orders</p>
            <p className="text-xl font-bold text-gray-900">{stats.total}</p>
          </div>
        </div>

        <div className="rounded-2xl border bg-white p-4 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center">
            <CheckCircle className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <p className="text-xs text-gray-500">Verified</p>
            <p className="text-xl font-bold text-gray-900">{stats.verified}</p>
          </div>
        </div>

        <div className="rounded-2xl border bg-white p-4 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-yellow-50 flex items-center justify-center">
            <Clock className="w-5 h-5 text-yellow-600" />
          </div>
          <div>
            <p className="text-xs text-gray-500">Pending</p>
            <p className="text-xl font-bold text-gray-900">{stats.pending}</p>
          </div>
        </div>
      </div>

      {/* TABLE */}
      {loading ? (
        <div className="flex justify-center items-center h-48 text-gray-500 bg-white border rounded-2xl shadow-sm">
          <Loader2 className="w-6 h-6 animate-spin mr-2" />
          Loading orders...
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="text-gray-500 text-center py-16 bg-white border rounded-2xl shadow-sm">
          No orders found.
        </div>
      ) : (
        <>
          {/* ✅ MOBILE VIEW */}
          <div className="space-y-4 md:hidden">
            {filteredOrders.map((order) => (
              <div
                key={order.id}
                className="bg-white border rounded-2xl shadow-sm p-4 space-y-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs text-gray-500">Order ID</p>
                    <p className="font-mono text-sm text-gray-800 break-all">
                      {order.id}
                    </p>
                  </div>

                  <span className={getStatusBadge(order.status)}>
                    {order.status || "pending_verification"}
                  </span>
                </div>

                <div className="flex justify-between">
                  <div>
                    <p className="text-xs text-gray-500">Total</p>
                    <p className="font-bold text-gray-900">
                      {formatKES(order.total_amount)}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-xs text-gray-500">Date</p>
                    <p className="text-xs text-gray-700">
                      {new Date(order.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <div>
                    <p className="text-xs text-gray-500">Status</p>
                    <select
                      value={order.status || "pending_verification"}
                      onChange={(e) =>
                        updateOrder(order.id, { status: e.target.value })
                      }
                      className="w-full border rounded-xl px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-[#4eb0e3]"
                    >
                      <option value="pending_verification">
                        Pending Verification
                      </option>
                      <option value="payment_verified">Payment Verified</option>
                      <option value="payment_failed">Payment Failed</option>
                    </select>
                  </div>

                  <div>
                    <p className="text-xs text-gray-500">Tracking</p>
                    <select
                      value={order.tracking_stage || "pending"}
                      onChange={(e) =>
                        updateOrder(order.id, {
                          tracking_stage: e.target.value,
                        })
                      }
                      className="w-full border rounded-xl px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-[#4eb0e3]"
                    >
                      <option value="pending">Pending</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="shipped">Shipped</option>
                      <option value="delivered">Delivered</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>

                  <div>
                    <p className="text-xs text-gray-500">Delivery</p>
                    <select
                      value={order.delivery_status || "not started"}
                      onChange={(e) =>
                        updateOrder(order.id, {
                          delivery_status: e.target.value,
                        })
                      }
                      className="w-full border rounded-xl px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-[#4eb0e3]"
                    >
                      <option value="not started">Not Started</option>
                      <option value="in transit">In Transit</option>
                      <option value="delivered">Delivered</option>
                    </select>
                  </div>
                </div>

                <button
                  onClick={() => toggleExpand(order.id)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium text-[#4eb0e3] hover:bg-[#4eb0e3]/10 transition"
                >
                  {expandedOrder === order.id ? "Hide Details" : "View Details"}
                  <ChevronDown
                    className={`w-4 h-4 transition-transform ${
                      expandedOrder === order.id ? "rotate-180" : ""
                    }`}
                  />
                </button>

                <AnimatePresence>
                  {expandedOrder === order.id && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.25 }}
                      className="overflow-hidden"
                    >
                      <div className="mt-4 bg-gray-50 border rounded-xl overflow-hidden">
                        <div className="px-4 py-3 border-b bg-white">
                          <p className="font-semibold text-gray-800 text-sm">
                            Order Items
                          </p>
                        </div>

                        <div className="divide-y">
                          {Array.isArray(orderItems[order.id]) &&
                          orderItems[order.id].length > 0 ? (
                            orderItems[order.id].map((item) => (
                              <div
                                key={item.id}
                                className="flex items-center justify-between px-4 py-3"
                              >
                                <div>
                                  <p className="font-semibold text-gray-900 text-sm">
                                    {item.products?.name}
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    Qty: {item.quantity}
                                  </p>
                                </div>

                                <p className="font-bold text-gray-900 text-sm">
                                  {formatKES(
                                    Number(item.price) * Number(item.quantity),
                                  )}
                                </p>
                              </div>
                            ))
                          ) : (
                            <div className="p-4 text-sm text-gray-400">
                              {orderItems[order.id]
                                ? "No items found."
                                : "Loading items..."}
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>

          {/* ✅ DESKTOP VIEW */}
          <div className="hidden md:block bg-white border rounded-2xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50 text-gray-600 text-xs uppercase">
                  <tr>
                    <th className="p-4 text-left">Order</th>
                    <th className="p-4 text-left">User</th>
                    <th className="p-4 text-left">Total</th>
                    <th className="p-4 text-left">Status</th>
                    <th className="p-4 text-left">Tracking</th>
                    <th className="p-4 text-left">Delivery</th>
                    <th className="p-4 text-left">Date</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredOrders.map((order) => (
                    <React.Fragment key={order.id}>
                      {/* Order row */}
                      <tr className="border-t hover:bg-gray-50 transition">
                        <td className="p-4 font-mono text-xs text-gray-800">
                          {order.order_number || "—"}
                        </td>

                        <td className="p-4 font-mono text-xs text-gray-600">
                          {order.display_name}
                        </td>

                        <td className="p-4 font-semibold text-gray-900">
                          {formatKES(order.total_amount)}
                        </td>

                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <span className={getStatusBadge(order.status)}>
                              {order.status || "pending_verification"}
                            </span>

                            <select
                              value={order.status || "pending_verification"}
                              onChange={(e) =>
                                updateOrder(order.id, {
                                  status: e.target.value,
                                })
                              }
                              className="border rounded-lg px-2 py-1 text-xs bg-white focus:ring-2 focus:ring-[#4eb0e3]"
                            >
                              <option value="pending_verification">
                                Pending Verification
                              </option>
                              <option value="payment_verified">
                                Payment Verified
                              </option>
                              <option value="payment_failed">
                                Payment Failed
                              </option>
                            </select>
                          </div>
                        </td>

                        <td className="p-4">
                          <select
                            value={order.tracking_stage || "pending"}
                            onChange={(e) =>
                              updateOrder(order.id, {
                                tracking_stage: e.target.value,
                              })
                            }
                            className="border rounded-lg px-2 py-1 text-xs w-full bg-white focus:ring-2 focus:ring-[#4eb0e3]"
                          >
                            <option value="pending">Pending</option>
                            <option value="confirmed">Confirmed</option>
                            <option value="shipped">Shipped</option>
                            <option value="delivered">Delivered</option>
                            <option value="cancelled">Cancelled</option>
                          </select>
                        </td>

                        <td className="p-4">
                          <select
                            value={order.delivery_status || "not started"}
                            onChange={(e) =>
                              updateOrder(order.id, {
                                delivery_status: e.target.value,
                              })
                            }
                            className="border rounded-lg px-2 py-1 text-xs w-full bg-white focus:ring-2 focus:ring-[#4eb0e3]"
                          >
                            <option value="not started">Not Started</option>
                            <option value="in transit">In Transit</option>
                            <option value="delivered">Delivered</option>
                          </select>
                        </td>

                        <td className="p-4 text-xs text-gray-500">
                          {new Date(order.created_at).toLocaleString()}
                        </td>

                        <td className="p-4 text-right">
                          <button
                            onClick={() => toggleExpand(order.id)}
                            className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-medium text-[#4eb0e3] hover:bg-[#4eb0e3]/10 transition"
                          >
                            Details
                            <ChevronDown
                              className={`w-4 h-4 transition-transform ${
                                expandedOrder === order.id ? "rotate-180" : ""
                              }`}
                            />
                          </button>
                        </td>
                      </tr>

                      {/* EXPANDED */}
                      <AnimatePresence>
                        {expandedOrder === order.id && (
                          <motion.tr
                            key={`${order.id}-details`}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.25 }}
                            className="bg-gray-50 border-t"
                          >
                            <td colSpan={8} className="p-5">
                              <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
                                <div className="px-5 py-3 border-b bg-gray-50">
                                  <p className="font-semibold text-gray-800">
                                    Order Items
                                  </p>
                                </div>

                                <div className="divide-y">
                                  {Array.isArray(orderItems[order.id]) &&
                                  orderItems[order.id].length > 0 ? (
                                    orderItems[order.id].map((item) => (
                                      <div
                                        key={item.id}
                                        className="flex items-center justify-between px-5 py-4"
                                      >
                                        <div className="flex items-center gap-4">
                                          <img
                                            src={
                                              item.products?.image_url ||
                                              "/placeholder.png"
                                            }
                                            alt={item.products?.name}
                                            className="w-14 h-14 object-cover rounded-xl border"
                                          />

                                          <div>
                                            <p className="font-semibold text-gray-900">
                                              {item.products?.name}
                                            </p>
                                            <p className="text-xs text-gray-500">
                                              Qty: {item.quantity} • Unit:{" "}
                                              {formatKES(item.price)}
                                            </p>
                                          </div>
                                        </div>

                                        <p className="font-bold text-gray-900">
                                          {formatKES(
                                            Number(item.price) *
                                              Number(item.quantity),
                                          )}
                                        </p>
                                      </div>
                                    ))
                                  ) : (
                                    <div className="p-5 text-sm text-gray-400">
                                      {orderItems[order.id]
                                        ? "No items found."
                                        : "Loading items..."}
                                    </div>
                                  )}
                                </div>
                              </div>

                              <div className="mt-4 bg-white rounded-2xl border shadow-sm p-5 text-sm text-gray-700">
                                <p className="font-semibold text-gray-900 mb-2">
                                  Shipping Details
                                </p>

                                <p>
                                  <span className="font-medium">Address:</span>{" "}
                                  {order.shipping_address || "N/A"}
                                </p>

                                <p>
                                  <span className="font-medium">
                                    Payment Method:
                                  </span>{" "}
                                  {order.payment_method || "N/A"}
                                </p>
                              </div>
                            </td>
                          </motion.tr>
                        )}
                      </AnimatePresence>
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
