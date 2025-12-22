import { useParams, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "../../supabaseClient";
import { Loader2, CheckCircle2 } from "lucide-react";
import BalmOrthoLogo from "../../assets/BalmOrthoLogo.png";

export default function OrderTracking() {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  const steps = [
    { key: "placed", label: "Order Placed" },
    { key: "confirmed", label: "Order Confirmed" },
    { key: "shipped", label: "Shipped" },
    { key: "delivered", label: "Delivered" },
    { key: "reviewed", label: "Reviewed" },
  ];

  useEffect(() => {
    async function fetchOrder() {
      const { data, error } = await supabase
        .from("orders")
        .select(
          `id, status, tracking_stage, created_at, total_amount,
     order_items (
       quantity, price, products (name, image_url)
     )`
        )
        .eq("id", orderId)
        .single();

      if (error) console.error("Error fetching order:", error);
      else setOrder(data);

      setLoading(false);
    }

    fetchOrder();
  }, [orderId]);

  if (loading)
    return (
      <div className="flex justify-center items-center h-screen text-gray-500">
        <Loader2 className="animate-spin mr-2" /> Loading order...
      </div>
    );

  if (!order)
    return (
      <div className="text-center py-20">
        <p className="text-gray-600 text-lg">Order not found.</p>
        <Link
          to="/orders"
          className="mt-4 inline-block bg-[#4eb0e3] text-white px-6 py-3 rounded-lg hover:bg-[#0570b3]"
        >
          Back to Orders
        </Link>
      </div>
    );

  // Determine progress index
  const currentStepIndex = steps.findIndex(
    (step) => step.key === order.tracking_stage
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b bg-white">
        <div className="max-w-6xl mx-auto py-6 px-4 flex items-center justify-between">
          <Link
            to="/orders"
            className="text-lg text-black hover:text-[#4eb0e3]"
          >
            ← My Orders
          </Link>
        </div>
      </header>

      {/* Progress Tracker */}
      <main className="max-w-4xl mx-auto px-4 py-10">
        <h2 className="text-2xl font-semibold mb-8 text-gray-800">
          Order Tracking
        </h2>

        <div className="relative flex flex-col sm:flex-row justify-between items-center mb-12">
          {steps.map((step, index) => {
            const isCompleted = index <= currentStepIndex;
            const isActive = index === currentStepIndex;

            return (
              <div
                key={step.key}
                className="flex flex-col items-center text-center relative z-10"
              >
                <div
                  className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition
                    ${
                      isCompleted
                        ? "bg-[#4eb0e3] border-[#4eb0e3] text-white"
                        : "bg-gray-100 border-gray-300 text-gray-400"
                    }`}
                >
                  {isCompleted ? <CheckCircle2 size={20} /> : index + 1}
                </div>
                <p
                  className={`mt-2 text-sm font-medium ${
                    isActive ? "text-[#4eb0e3]" : "text-gray-600"
                  }`}
                >
                  {step.label}
                </p>

                {/* Connector line */}
                {index < steps.length - 1 && (
                  <div
                    className={`hidden sm:block absolute top-5 left-[calc(50%+20px)] w-full h-[2px] ${
                      isCompleted ? "bg-[#4eb0e3]" : "bg-gray-300"
                    }`}
                    style={{ transform: "translateX(50%)" }}
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* Order Summary */}
        <div className="bg-white rounded-xl shadow-sm p-6 border">
          <p className="text-gray-700 mb-4">
            <strong>Order ID:</strong> {order.id}
          </p>
          <div className="divide-y">
            {order.order_items.map((item, index) => (
              <div
                key={index}
                className="flex justify-between py-3 items-center"
              >
                <div className="flex items-center gap-3">
                  <img
                    src={
                      item.products?.image_url ||
                      "https://via.placeholder.com/80"
                    }
                    alt={item.products?.name}
                    className="w-16 h-16 border rounded-lg object-cover"
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
                <p className="text-gray-800 font-semibold">
                  KES {(item.price * item.quantity).toLocaleString()}
                </p>
              </div>
            ))}
          </div>

          <div className="border-t pt-4 mt-4 text-right">
            <p className="text-gray-700">
              Total:{" "}
              <span className="font-semibold text-[#4eb0e3]">
                KES {Number(order.total_amount).toLocaleString()}
              </span>
            </p>
          </div>
        </div>

        {order.status === "delivered" && (
          <div className="text-center mt-10">
            <button
              className="bg-[#4eb0e3] text-white px-6 py-3 rounded-xl hover:bg-[#0570b3]"
              onClick={async () => {
                await supabase
                  .from("orders")
                  .update({ tracking_stage: "reviewed" })
                  .eq("id", order.id);
                setOrder({ ...order, status: "reviewed" });
              }}
            >
              Mark as Reviewed
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
