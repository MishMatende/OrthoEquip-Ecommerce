import { useParams, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "../../supabaseClient";
import Confetti from "react-confetti";
import { Loader2 } from "lucide-react";

export default function OrderConfirmation() {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchOrder() {
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
        `,
        )
        .eq("id", orderId)
        .single();

      if (!error) {
        setOrder(data);
      } else {
        console.error(error);
      }

      setLoading(false);
    }

    fetchOrder();
  }, [orderId]);

  if (loading)
    return (
      <div className="flex items-center justify-center py-20 text-gray-500">
        <Loader2 className="w-6 h-6 animate-spin mr-3" />
        <span>Loading order...</span>
      </div>
    );

  if (!order)
    return (
      <div className="text-center py-20">
        <p className="text-gray-600 mb-4">Order not found.</p>
        <Link to="/" className="text-[#4eb0e3] underline hover:text-blue-800">
          Back to Home
        </Link>
      </div>
    );

  const isPending = order.status === "pending_verification";
  const isPaid = order.status === "paid";

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-4xl mx-auto py-16 px-6">
        {isPaid && <Confetti numberOfPieces={200} recycle={false} />}

        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-[#4eb0e3] mb-3">
            🎉 Thank you for your order!
          </h1>

          <p className="text-gray-700">
            Your order <span className="font-semibold">#{order.id}</span> has
            been placed.
          </p>

          {isPending && (
            <p className="mt-3 inline-block text-yellow-700 bg-yellow-50 border border-yellow-200 px-4 py-2 rounded-lg">
              ⏳ Payment received. Awaiting verification.
            </p>
          )}

          {isPaid && (
            <p className="mt-3 inline-block text-green-700 bg-green-50 border border-green-200 px-4 py-2 rounded-lg">
              ✅ Payment verified. Your order is confirmed.
            </p>
          )}
        </div>

        {/* Order Summary */}
        <div className="bg-white border rounded-xl shadow-sm p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Order Summary</h2>

          <div className="divide-y">
            {order.order_items.map((item) => (
              <div
                key={item.id}
                className="flex justify-between items-center py-4"
              >
                <div className="flex items-center gap-4">
                  <img
                    src={
                      item.products?.image_url ||
                      "https://via.placeholder.com/80"
                    }
                    alt={item.products?.name}
                    className="w-16 h-16 border rounded-lg object-cover"
                  />
                  <div>
                    <p className="font-medium text-gray-800">
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

          <div className="border-t mt-4 pt-4 space-y-2 text-gray-700">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>KES {Number(order.total_amount).toLocaleString()}</span>
            </div>

            <div className="flex justify-between">
              <span>Shipping</span>
              <span>Free</span>
            </div>

            <div className="border-t pt-3 flex justify-between font-semibold text-lg">
              <span>Total</span>
              <span className="text-[#4eb0e3]">
                KES {Number(order.total_amount).toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Shipping Info */}
        <div className="bg-white border rounded-xl shadow-sm p-6 mb-8">
          <h2 className="text-xl font-semibold">Shipping Details</h2>
          <pre className="text-gray-700 whitespace-pre-wrap font-sans">
            {order.shipping_address}
          </pre>
          <p className="mt-3 text-sm text-gray-500">
            Estimated delivery:{" "}
            <span className="font-medium">1 – 2 business days</span>
          </p>
        </div>

        {/* Actions */}
        <div className="text-center">
          <Link
            to="/orders"
            className="bg-[#4eb0e3] text-white px-6 py-3 rounded-xl hover:bg-[#0570b3]"
          >
            View My Orders
          </Link>
        </div>
      </main>
    </div>
  );
}
