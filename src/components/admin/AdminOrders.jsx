import { useEffect, useState } from "react";
import { supabase } from "../../supabaseClient";
import { Loader2, ChevronDown } from "lucide-react";
import { toast } from "sonner";

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrder, setExpandedOrder] = useState(null);

  // ✅ Fetch orders
  const fetchOrders = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching orders:", error);
      toast.error("Failed to fetch orders");
    } else {
      setOrders(data || []);
    }

    setLoading(false);
  };

  // ✅ Load orders once
  useEffect(() => {
    fetchOrders();
  }, []);

  // ✅ Realtime subscription (no nested useEffect!)
  useEffect(() => {
    const channel = supabase
      .channel("orders-changes")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "orders" },
        (payload) => {
          toast.success(`🆕 New order received! ID: ${payload.new.id}`);
          fetchOrders();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // ✅ Update order fields
  const updateOrder = async (id, updates) => {
    const { error } = await supabase
      .from("orders")
      .update({ ...updates })
      .eq("id", id);

    if (error) {
      console.error("Update failed:", error);
      toast.error("Failed to update order");
    } else {
      toast.success("Order updated");
      fetchOrders();
    }
  };

  // ✅ Render
  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-gray-800">Orders</h1>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-32 text-gray-500">
          <Loader2 className="w-6 h-6 animate-spin mr-2" />
          Loading orders...
        </div>
      ) : orders.length === 0 ? (
        <div className="text-gray-500 text-center py-10">No orders found.</div>
      ) : (
        <div className="overflow-x-auto bg-white shadow-sm rounded-lg border">
          <table className="min-w-full border-collapse">
            <thead className="bg-gray-100 text-gray-700 text-sm uppercase">
              <tr>
                <th className="p-3 text-left">Order ID</th>
                <th className="p-3 text-left">User ID</th>
                <th className="p-3 text-left">Total</th>
                <th className="p-3 text-left">Status</th>
                <th className="p-3 text-left">Delivery</th>
                <th className="p-3 text-left">Tracking</th>
                <th className="p-3 text-left">Payment</th>
                <th className="p-3 text-left">Date</th>
                <th className="p-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr
                  key={order.id}
                  className="border-t hover:bg-gray-50 transition"
                >
                  <td className="p-3 font-mono text-sm truncate max-w-[120px]">
                    {order.id}
                  </td>
                  <td className="p-3 font-mono text-sm truncate max-w-[100px]">
                    {order.user_id}
                  </td>
                  <td className="p-3 font-semibold text-gray-800">
                    ${order.total_amount}
                  </td>
                  <td className="p-3">
                    <select
                      value={order.status || "pending"}
                      onChange={(e) =>
                        updateOrder(order.id, { status: e.target.value })
                      }
                      className="border rounded-md px-2 py-1 text-sm"
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
                      className="border rounded-md px-2 py-1 text-sm"
                    >
                      <option value="not started">Not Started</option>
                      <option value="in transit">In Transit</option>
                      <option value="delivered">Delivered</option>
                    </select>
                  </td>
                  <td className="p-3 text-sm text-gray-700">
                    {order.tracking_stage || "N/A"}
                  </td>
                  <td className="p-3 text-sm">{order.payment_method}</td>
                  <td className="p-3 text-sm text-gray-500">
                    {new Date(order.created_at).toLocaleString()}
                  </td>
                  <td className="p-3">
                    <button
                      onClick={() =>
                        setExpandedOrder(
                          expandedOrder === order.id ? null : order.id
                        )
                      }
                      className="flex items-center gap-1 text-[#0680cd] text-sm"
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
              ))}

              {/* Expanded details */}
              {expandedOrder &&
                orders
                  .filter((o) => o.id === expandedOrder)
                  .map((order) => (
                    <tr
                      key={`${order.id}-details`}
                      className="bg-gray-50 border-t"
                    >
                      <td colSpan={9} className="p-4">
                        <div className="space-y-2 text-sm text-gray-700">
                          <div>
                            <span className="font-semibold">Shipping:</span>{" "}
                            {order.shipping_address || "N/A"}
                          </div>
                          <div>
                            <span className="font-semibold">Payment:</span>{" "}
                            {order.payment_method || "N/A"}
                          </div>
                          <div>
                            <span className="font-semibold">Tracking:</span>{" "}
                            {order.tracking_stage || "N/A"}
                          </div>
                        </div>
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
