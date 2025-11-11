import { supabase } from "../../supabaseClient";
import { useCart } from "../../context/CartContext";
import { UserAuth } from "../../context/AuthContext";
import { Button } from "../../components/ui/button";
import { Minus, Plus, Trash2, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

export default function Cart() {
  const { session } = UserAuth();
  const { cart, removeFromCart, updateQuantity, loadingItemId } = useCart();
  const navigate = useNavigate();

  const handleCheckout = async () => {
    if (!session) {
      toast.error("Please sign in to complete your purchase.", {
        position: "top-right",
      });
      return;
    }
    if (!cart.length) {
      toast.error("Your cart is empty.", {
        position: "top-right",
      });
      return;
    }
    navigate("/checkout");

    const totalAmount = cart.reduce(
      (sum, item) =>
        sum + (item.product?.price || item.price_at_add) * item.quantity,
      0
    );

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
      toast.error("Error placing order. Please try again.", {
        position: "top-right",
      });
      return;
    }

    const orderItems = cart.map((item) => ({
      order_id: order.id,
      product_id: item.product?.id || item.product_id,
      quantity: item.quantity,
      price: item.product?.price || item.price_at_add,
    }));

    const { error: itemsError } = await supabase
      .from("order_items")
      .insert(orderItems);

    if (itemsError) {
      console.error("Error adding order items:", itemsError);
      toast.error("Error saving order items.", {
        position: "top-right",
      });
      return;
    }

    await supabase.from("cart_items").delete().eq("cart_id", cart[0].cart_id);
    toast.success("🎉 Order placed successfully!", {
      position: "top-right",
    });
  };

  const total = cart.reduce(
    (sum, item) =>
      sum + (item.product?.price || item.price_at_add) * item.quantity,
    0
  );

  if (!cart.length) {
    return (
      <div className="py-20 text-center text-gray-500">
        🛒 Your cart is empty.
      </div>
    );
  }

  console.log(cart);

  return (
    <div className="max-w-6xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
      <h1 className="text-2xl sm:text-3xl font-semibold mb-8 text-gray-800 text-center sm:text-left">
        Your Cart
      </h1>

      {/* Cart Items */}
      <div className="space-y-6">
        {cart.map((item) => {
          const product = item.products || item.product;
          const isLoading =
            loadingItemId === item.id || loadingItemId === item.product_id;

          return (
            <div
              key={item.id || item.product_id}
              className="
                flex flex-col sm:flex-row sm:items-center sm:justify-between
                gap-6 p-4 border rounded-xl shadow-sm hover:shadow-md 
                transition bg-white
              "
            >
              {/* Product Info */}
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 flex-1 text-center sm:text-left">
                <img
                  src={
                    product?.image_url ||
                    "https://images.unsplash.com/photo-1584367360396-25b0d7c4b9a0?auto=format&fit=crop&w=300&q=80"
                  }
                  alt={product?.name}
                  className="
                    w-24 h-24 sm:w-28 sm:h-28 object-contain 
                    bg-gray-50 border rounded-lg
                  "
                />
                <div className="flex flex-col justify-center sm:justify-start">
                  <p className="font-semibold text-gray-800 text-sm sm:text-base line-clamp-2">
                    {product?.name}
                  </p>
                  {product?.brand && (
                    <p className="text-sm text-gray-500">{product.brand}</p>
                  )}
                  <p className="text-sm text-gray-600 mt-1">
                    KES {Number(product?.price).toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Quantity + Price + Remove */}
              <div
                className="
                  flex flex-row sm:flex-col sm:items-end 
                  justify-between sm:justify-center gap-4 w-full sm:w-auto
                "
              >
                {/* Quantity Controls */}
                <div className="flex items-center justify-center gap-3">
                  <button
                    className="
                      p-2 border rounded-lg hover:bg-gray-100 
                      transition disabled:opacity-50
                    "
                    onClick={() =>
                      updateQuantity(
                        item.id || item.product_id,
                        item.quantity - 1
                      )
                    }
                    disabled={isLoading || item.quantity <= 1}
                  >
                    <Minus size={14} />
                  </button>
                  <span className="font-medium text-gray-700">
                    {item.quantity}
                  </span>
                  <button
                    className="
                      p-2 border rounded-lg hover:bg-gray-100 
                      transition disabled:opacity-50
                    "
                    onClick={() =>
                      updateQuantity(
                        item.id || item.product_id,
                        item.quantity + 1
                      )
                    }
                    disabled={isLoading}
                  >
                    <Plus size={14} />
                  </button>
                </div>

                {/* Price + Remove */}
                <div className="flex items-center justify-center sm:justify-end gap-4 sm:gap-2">
                  <p className="text-lg font-semibold text-gray-800">
                    KES{" "}
                    {(
                      (product?.price || item.price_at_add) * item.quantity
                    ).toLocaleString()}
                  </p>
                  <button
                    onClick={() => removeFromCart(item.id || item.product_id)}
                    className="text-red-500 hover:text-red-700 transition disabled:opacity-50"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <Loader2 className="animate-spin" size={18} />
                    ) : (
                      <Trash2 size={18} />
                    )}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Total + Checkout */}
      <div className="mt-10 flex flex-col sm:flex-row justify-between items-center border-t pt-6">
        <p className="text-xl sm:text-2xl font-semibold text-gray-800 mb-4 sm:mb-0">
          Total:{" "}
          <span className="text-[#0680cd]">KES {total.toLocaleString()}</span>
        </p>

        <Button
          onClick={handleCheckout}
          className="
            bg-[#0680cd] hover:bg-[#0570b3]
            px-8 py-3 rounded-xl text-white text-lg w-full sm:w-auto
          "
        >
          Proceed to Checkout
        </Button>
      </div>
    </div>
  );
}
