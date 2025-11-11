import React, { useEffect, useState } from "react";
import { supabase } from "../../supabaseClient";
import { Loader2, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [orderItems, setOrderItems] = useState({});

  // Fetch orders
  const fetchOrders = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false });

    if (error)
      toast.error("Failed to fetch orders", {
        position: "top-right",
      });
    else setOrders(data || []);

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
        (payload) => {
          toast.success(`🆕 New order received! ID: ${payload.new.id}`, {
            position: "top-right",
          });
          fetchOrders();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Update order
  const updateOrder = async (id, updates) => {
    const { error } = await supabase
      .from("orders")
      .update({ ...updates })
      .eq("id", id);

    if (error)
      toast.error("Failed to update order", {
        position: "top-right",
      });
    else {
      toast.success("Order updated", {
        position: "top-right",
      });
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
      `
      )
      .eq("order_id", orderId);

    if (!error) {
      setOrderItems((prev) => ({ ...prev, [orderId]: data }));
    } else {
      toast.error("Failed to load order details", {
        position: "top-right",
      });
    }
  };

  const toggleExpand = (orderId) => {
    if (expandedOrder === orderId) setExpandedOrder(null);
    else {
      setExpandedOrder(orderId);
      fetchOrderItems(orderId);
    }
  };

  return (
    <div className="p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-gray-800">Orders</h1>
      </div>

      {/* Loading or empty states */}
      {loading ? (
        <div className="flex justify-center items-center h-32 text-gray-500">
          <Loader2 className="w-6 h-6 animate-spin mr-2" />
          Loading orders...
        </div>
      ) : orders.length === 0 ? (
        <div className="text-gray-500 text-center py-10">No orders found.</div>
      ) : (
        <div className="overflow-x-auto bg-white shadow-sm rounded-lg border">
          <table className="min-w-full table-fixed border-collapse">
            <thead className="bg-gray-100 text-gray-700 text-sm uppercase">
              <tr>
                <th className="w-[15%] p-3 text-left">Order ID</th>
                <th className="w-[15%] p-3 text-left">User ID</th>
                <th className="w-[10%] p-3 text-left">Total (KES)</th>
                <th className="w-[10%] p-3 text-left">Status</th>
                <th className="w-[12%] p-3 text-left">Delivery</th>
                <th className="w-[10%] p-3 text-left">Payment</th>
                <th className="w-[15%] p-3 text-left">Date</th>
                <th className="w-[8%] p-3 text-left">Actions</th>
              </tr>
            </thead>

            <tbody>
              {orders.map((order) => (
                <React.Fragment key={order.id}>
                  {/* Order row */}
                  <tr className="border-t hover:bg-gray-50 transition">
                    <td className="p-3 font-mono text-sm truncate">
                      {order.id}
                    </td>
                    <td className="p-3 font-mono text-sm truncate">
                      {order.user_id}
                    </td>
                    <td className="p-3 font-semibold text-gray-800">
                      {order.total_amount}
                    </td>
                    <td className="p-3">
                      <select
                        value={order.status || "pending"}
                        onChange={(e) =>
                          updateOrder(order.id, { status: e.target.value })
                        }
                        className="border rounded-md px-2 py-1 text-sm w-full"
                      >
                        <option value="pending">Pending</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="shipped">Shipped</option>
                        <option value="delivered">Delivered</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </td>
                    <td className="p-3">
                      <select
                        value={order.delivery_status || "not started"}
                        onChange={(e) =>
                          updateOrder(order.id, {
                            delivery_status: e.target.value,
                          })
                        }
                        className="border rounded-md px-2 py-1 text-sm w-full"
                      >
                        <option value="not started">Not Started</option>
                        <option value="in transit">In Transit</option>
                        <option value="delivered">Delivered</option>
                      </select>
                    </td>
                    <td className="p-3 text-sm text-start">
                      {order.payment_method || "N/A"}
                    </td>
                    <td className="p-3 text-sm text-gray-500 text-start">
                      {new Date(order.created_at).toLocaleString()}
                    </td>
                    <td className="p-3">
                      <button
                        onClick={() => toggleExpand(order.id)}
                        className="flex items-center gap-1 text-[#4eb0e3] text-sm"
                      >
                        Details
                        <ChevronDown
                          className={`w-4 h-4 transform transition-transform ${
                            expandedOrder === order.id ? "rotate-180" : ""
                          }`}
                        />
                      </button>
                    </td>
                  </tr>

                  {/* Expanded row */}
                  <AnimatePresence>
                    {expandedOrder === order.id && (
                      <motion.tr
                        key={`${order.id}-details`}
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                        className="bg-gray-50 border-t"
                      >
                        <td colSpan={8} className="p-4">
                          <motion.div
                            initial={{ y: 10, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: -10, opacity: 0 }}
                            transition={{ duration: 0.3 }}
                            className="space-y-4"
                          >
                            {/* Order items */}
                            <div className="border-t-0">
                              {Array.isArray(orderItems[order.id]) &&
                              orderItems[order.id].length > 0 ? (
                                orderItems[order.id].map((item, i) => (
                                  <div
                                    key={item.id}
                                    className={`flex items-center justify-between py-3 px-6 ${
                                      i < orderItems[order.id].length - 1
                                        ? "border-b border-gray-100"
                                        : ""
                                    }`}
                                  >
                                    <div className="flex items-center gap-3">
                                      <img
                                        src={
                                          item.products?.image_url ||
                                          "https://via.placeholder.com/80"
                                        }
                                        alt={item.products?.name}
                                        className="w-14 h-14 object-cover rounded-lg border"
                                      />
                                      <div>
                                        <p className="text-gray-800 font-medium">
                                          {item.products?.name}
                                        </p>
                                        <p className="text-sm text-gray-500">
                                          Qty: {item.quantity}
                                        </p>
                                      </div>
                                    </div>
                                    <p className="font-semibold text-gray-700">
                                      KES{" "}
                                      {(
                                        item.price * item.quantity
                                      ).toLocaleString()}
                                    </p>
                                  </div>
                                ))
                              ) : (
                                <div className="text-gray-400 text-sm py-3">
                                  {orderItems[order.id]
                                    ? "No items found."
                                    : "Loading items..."}
                                </div>
                              )}
                            </div>

                            {/* Shipping + Summary */}
                            <div className="pt-4 text-sm text-gray-700 space-y-1 border-t border-gray-200">
                              <div>
                                <span className="font-semibold">Shipping:</span>{" "}
                                {order.shipping_address || "N/A"}
                              </div>
                            </div>
                          </motion.div>
                        </td>
                      </motion.tr>
                    )}
                  </AnimatePresence>
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
