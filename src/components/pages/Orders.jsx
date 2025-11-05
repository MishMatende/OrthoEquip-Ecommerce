import { useEffect, useState } from "react";
import { supabase } from "../../supabaseClient";
import { UserAuth } from "../../context/AuthContext";
import { Link, useNavigate } from "react-router-dom";
import BalmOrthoLogo from "../../assets/BalmOrthoLogo.png";
import { Loader2 } from "lucide-react";

export default function Orders() {
  const { session, loadingAuth } = UserAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [statuses, setStatuses] = useState([]);
  const [selectedStatus, setSelectedStatus] = useState("All");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (loadingAuth) return;
    if (!session) {
      navigate("/signin");
      return;
    }

    async function fetchOrders() {
      const { data, error } = await supabase
        .from("orders")
        .select(
          `
          *,
          order_items (
            id,
            quantity,
            price,
            products (name, image_url)
          )
        `
        )
        .eq("user_id", session.user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching orders:", error);
      } else {
        setOrders(data || []);
        // Extract unique statuses
        const uniqueStatuses = [
          ...new Set(data.map((order) => order.status)),
        ].filter(Boolean);
        setStatuses(["All", ...uniqueStatuses]);
      }

      setLoading(false);
    }

    fetchOrders();
  }, [session, loadingAuth]);

  if (loadingAuth || loading)
    return (
      <div className="flex flex-row items-center justify-center py-20 text-gray-500">
        <Loader2 className="w-6 h-6 animate-spin mr-3" />
        <span>Loading...</span>
      </div>
    );

  if (!orders.length)
    return (
      <div className="min-h-screen bg-gray-50 text-center py-20">
        <p className="text-gray-600 text-lg">You have no orders yet.</p>
        <Link
          to="/shop"
          className="mt-4 inline-block bg-[#0680cd] text-white px-6 py-3 rounded-lg hover:bg-[#0570b3]"
        >
          Go to Shop
        </Link>
      </div>
    );

  // Filter orders by selected status
  const filteredOrders =
    selectedStatus === "All"
      ? orders
      : orders.filter((order) => order.status === selectedStatus);

  return (
    <div className="min-h-screen bg-gray-50">
      <hr />
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-4">
          {/* Tabs Section */}
          <div className="flex gap-3 flex-wrap overflow-x-auto scrollbar-hide">
            {statuses.map((status) => {
              const count =
                status === "All"
                  ? orders.length
                  : orders.filter((order) => order.status === status).length;

              return (
                <button
                  key={status}
                  onClick={() => setSelectedStatus(status)}
                  className={`relative px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition
              ${
                selectedStatus === status
                  ? "bg-[#0680cd] text-white shadow-sm"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}

                  {/* Badge */}
                  <span
                    className={`ml-2 inline-flex items-center justify-center px-2 py-0.5 text-xs font-semibold rounded-full
                ${
                  selectedStatus === status
                    ? "bg-white/20 text-white"
                    : "bg-[#0680cd]/10 text-[#0680cd]"
                }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Continue Shopping Link */}
          <Link
            to="/"
            className="text-md text-black hover:text-[#0680cd] whitespace-nowrap"
          >
            Continue Shopping →
          </Link>
        </div>
      </div>

      {/* Orders List */}
      <main className="max-w-6xl mx-auto py-10 px-4">
        <h2 className="text-2xl font-semibold text-gray-800 mb-6">
          {selectedStatus === "All" ? "All Orders" : `${selectedStatus} Orders`}
        </h2>

        <div className="space-y-6">
          {filteredOrders.map((order) => (
            <div
              key={order.id}
              className="bg-white border rounded-xl shadow-sm p-6 hover:shadow-md transition"
            >
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4">
                <div>
                  <p className="font-semibold text-gray-800">
                    Order ID: <span className="text-[#0680cd]">{order.id}</span>
                  </p>
                  <p className="text-sm text-gray-500">
                    Placed on{" "}
                    {new Date(order.created_at).toLocaleDateString("en-KE", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-[#0680cd]">
                    Total: KES {Number(order.total_amount).toLocaleString()}
                  </p>
                  <p
                    className={`text-sm font-medium ${
                      order.status === "completed"
                        ? "text-green-600"
                        : order.status === "pending"
                        ? "text-yellow-600"
                        : order.status === "cancelled"
                        ? "text-red-600"
                        : "text-gray-600"
                    }`}
                  >
                    {order.status.charAt(0).toUpperCase() +
                      order.status.slice(1)}
                  </p>
                </div>
              </div>

              {/* Order items */}
              <div className="divide-y border-t pt-4">
                {order.order_items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between py-3"
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={
                          item.products?.image_url ||
                          "https://via.placeholder.com/80"
                        }
                        alt={item.products?.name}
                        className="w-16 h-16 object-cover rounded-lg border"
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
                      KES {(item.price * item.quantity).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>

              <div className="flex flex-col justify-between sm:flex-row gap-3 mt-4">
                <Link
                  to={`/order-confirmation/${order.id}`}
                  className="text-sm text-[#0680cd] hover:underline"
                >
                  View Details →
                </Link>

                <Link
                  to={`/track/${order.id}`}
                  className={`inline-block text-sm px-4 py-2 rounded-lg transition
    ${
      order.tracking_stage === "delivered" ||
      order.tracking_stage === "reviewed"
        ? "bg-gray-300 text-gray-700 cursor-not-allowed"
        : "bg-[#0680cd] text-white hover:bg-[#0570b3]"
    }`}
                >
                  Track Order
                </Link>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
