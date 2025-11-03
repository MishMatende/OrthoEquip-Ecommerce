import { useEffect, useState } from "react";
import { supabase } from "../../supabaseClient";
import { UserAuth } from "../../context/AuthContext";

export default function Orders() {
  const { session } = UserAuth();
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    async function fetchOrders() {
      const { data, error } = await supabase
        .from("orders")
        .select(
          "*, order_items(quantity, unit_price, products(name, image_url))"
        )
        .eq("user_id", session.user.id)
        .order("created_at", { ascending: false });
      if (error) console.error(error);
      else setOrders(data);
    }

    if (session) fetchOrders();
  }, [session]);

  return (
    <div className="max-w-5xl mx-auto py-10">
      <h1 className="text-2xl font-semibold mb-6">Your Orders</h1>
      {orders.length === 0 ? (
        <p>No orders yet.</p>
      ) : (
        orders.map((order) => (
          <div key={order.id} className="border p-4 mb-6 rounded-lg shadow-sm">
            <h2 className="font-semibold text-lg mb-2">
              Order #{order.id.slice(0, 8)} – {order.status}
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              Placed on {new Date(order.created_at).toLocaleString()}
            </p>
            <ul>
              {order.order_items.map((item, i) => (
                <li
                  key={i}
                  className="flex justify-between border-b py-2 text-sm"
                >
                  <span>{item.products.name}</span>
                  <span>
                    {item.quantity} × KES {item.unit_price.toLocaleString()}
                  </span>
                </li>
              ))}
            </ul>
            <p className="text-right mt-2 font-semibold">
              Total: KES {order.total_amount.toLocaleString()}
            </p>
          </div>
        ))
      )}
    </div>
  );
}
