import { supabase } from "../../supabaseClient";
import { useCart } from "../../context/CartContext";
import { UserAuth } from "../../context/AuthContext";
import { Button } from "../../components/ui/button";
import { Minus, Plus, Trash2 } from "lucide-react";

export default function Cart() {
  const { session } = UserAuth();
  const { cart, removeFromCart } = useCart();

  const handleCheckout = async () => {
    if (!session) {
      alert("Please sign in to complete your purchase.");
      return;
    }

    if (!cart.length) {
      alert("Your cart is empty.");
      return;
    }

    // Calculate total
    const totalAmount = cart.reduce(
      (sum, item) =>
        sum + (item.products?.price || item.price_at_add) * item.quantity,
      0
    );

    // Create order
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        user_id: session.user.id,
        total_amount: totalAmount,
        status: "pending",
      })
      .select()
      .single();

    if (orderError) {
      console.error("Error creating order:", orderError);
      alert("Error placing order. Please try again.");
      return;
    }

    // Copy items into order_items
    const orderItems = cart.map((item) => ({
      order_id: order.id,
      product_id: item.products?.id || item.product_id,
      quantity: item.quantity,
      unit_price: item.products?.price || item.price_at_add,
    }));

    const { error: itemsError } = await supabase
      .from("order_items")
      .insert(orderItems);

    if (itemsError) {
      console.error("Error adding order items:", itemsError);
      alert("Error saving order items.");
      return;
    }

    // ✅ Clear cart
    await supabase.from("cart_items").delete().eq("cart_id", cart[0].cart_id);

    alert("🎉 Order placed successfully!");
  };

  const total = cart.reduce(
    (sum, item) =>
      sum + (item.products?.price || item.price_at_add) * item.quantity,
    0
  );

  if (!cart.length) {
    return (
      <div className="py-20 text-center text-gray-500">
        🛒 Your cart is empty.
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto py-10 px-4">
      <h1 className="text-3xl font-semibold mb-8 text-gray-800">Your Cart</h1>

      {/* Cart Items */}
      <div className="space-y-6">
        {cart.map((item) => {
          const product = item.products || item.product;
          return (
            <div
              key={item.id || item.product_id}
              className="flex flex-col sm:flex-row items-center justify-between gap-6 border rounded-xl p-4 shadow-sm hover:shadow-md transition"
            >
              {/* Product Info */}
              <div className="flex items-center gap-4 flex-1">
                <img
                  src={
                    product?.image_url ||
                    "https://images.unsplash.com/photo-1584367360396-25b0d7c4b9a0?auto=format&fit=crop&w=300&q=80"
                  }
                  alt={product?.name}
                  className="w-20 h-20 object-contain bg-gray-50 border rounded-lg"
                />
                <div>
                  <p className="font-semibold text-gray-800">{product?.name}</p>
                  {product?.brand && (
                    <p className="text-sm text-gray-500">{product.brand}</p>
                  )}
                  <p className="text-sm text-gray-500">
                    KES {Number(product?.price).toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Quantity Controls */}
              <div className="flex items-center gap-3">
                <button className="p-2 border rounded-lg hover:bg-gray-100 transition">
                  <Minus size={14} />
                </button>
                <span className="font-medium text-gray-700">
                  {item.quantity}
                </span>
                <button className="p-2 border rounded-lg hover:bg-gray-100 transition">
                  <Plus size={14} />
                </button>
              </div>

              {/* Price + Remove */}
              <div className="flex items-center gap-6">
                <p className="text-lg font-semibold text-gray-800">
                  KES{" "}
                  {(
                    (product?.price || item.price_at_add) * item.quantity
                  ).toLocaleString()}
                </p>
                <button
                  onClick={() => removeFromCart(item.id || item.product_id)}
                  className="text-red-500 hover:text-red-700 transition"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Total + Checkout */}
      <div className="mt-10 flex flex-col sm:flex-row justify-between items-center border-t pt-6">
        <p className="text-2xl font-semibold text-gray-800 mb-4 sm:mb-0">
          Total:{" "}
          <span className="text-[#0680cd]">KES {total.toLocaleString()}</span>
        </p>

        <Button
          onClick={handleCheckout}
          className="bg-[#0680cd] hover:bg-[#0570b3] px-8 py-3 rounded-xl text-white text-lg"
        >
          Proceed to Checkout
        </Button>
      </div>
    </div>
  );
}
