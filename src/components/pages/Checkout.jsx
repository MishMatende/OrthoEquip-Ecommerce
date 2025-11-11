import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../supabaseClient";
import { useCart } from "../../context/CartContext";
import { UserAuth } from "../../context/AuthContext";
import { Button } from "../../components/ui/button";
import BalmOrthoLogo from "../../assets/BalmOrthoLogo.png";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function Checkout() {
  const { cart } = useCart();
  const { session } = UserAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: "",
    firstName: "",
    lastName: "",
    address: "",
    apartment: "",
    city: "",
    postalCode: "",
    country: "Kenya",
    shippingMethod: "Standard",
  });

  const [loading, setLoading] = useState(false);

  // Autofill user email if logged in
  useEffect(() => {
    if (session?.user?.email) {
      setForm((prev) => ({ ...prev, email: session.user.email }));
    }
  }, [session]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const total = cart.reduce(
    (sum, item) =>
      sum + (item.products?.price || item.price_at_add) * item.quantity,
    0
  );

  const handlePlaceOrder = async (e) => {
    e.preventDefault();

    if (!session) {
      toast.error("Please sign in to complete your purchase.", {
        position: "top-right",
      });
      return;
    }

    if (
      !form.address.trim() ||
      !form.city.trim() ||
      !form.firstName.trim() ||
      !form.lastName.trim()
    ) {
      toast.error("Please enter your full shipping details.", {
        position: "top-right",
      });
      return;
    }

    if (!cart.length) {
      toast.error("Your cart is empty.", {
        position: "top-right",
      });
      navigate("/cart");
      return;
    }

    setLoading(true);

    try {
      const shippingAddress = `
${form.firstName} ${form.lastName}
${form.address}, ${form.apartment || ""}
${form.city}, ${form.postalCode || ""}
${form.country}
`;

      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert({
          user_id: session.user.id,
          total_amount: total,
          status: "pending", // for business flow
          tracking_stage: "placed", // for progress tracker
          shipping_address: shippingAddress,
          payment_method: "None",
        })
        .select()
        .single();

      if (orderError) throw orderError;

      const orderItems = cart.map((item) => ({
        order_id: order.id,
        product_id: item.products?.id || item.product_id,
        quantity: item.quantity,
        price: item.products?.price || item.price_at_add,
      }));

      const { error: itemsError } = await supabase
        .from("order_items")
        .insert(orderItems);

      if (itemsError) throw itemsError;

      if (cart[0]?.cart_id) {
        await supabase
          .from("cart_items")
          .delete()
          .eq("cart_id", cart[0].cart_id);
      }

      toast.success("🎉 Order placed successfully!", {
        position: "top-right",
      });
      navigate(`/order-confirmation/${order.id}`);
    } catch (err) {
      console.error("Order error:", err);
      toast.error("Error placing order. Please try again.", {
        position: "top-right",
      });
    } finally {
      setLoading(false);
    }
  };

  // Redirect if cart empty
  useEffect(() => {
    if (!cart.length) {
      navigate("/cart");
    }
  }, [cart]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b bg-white">
        <div className="max-w-6xl mx-auto py-6 px-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <img
              src={BalmOrthoLogo}
              className="h-[50px]"
              alt="Balm Ortho image"
            />
            <h1 className="text-2xl font-semibold text-gray-800">
              Balm Ortho medical
            </h1>
          </div>
          {!session && (
            <a href="/login" className="text-sm text-[#0680cd] hover:underline">
              Sign in
            </a>
          )}
        </div>
      </header>

      {/* Main */}
      <main className="max-w-6xl mx-auto py-10 px-4 grid md:grid-cols-2 gap-10">
        {/* LEFT SIDE — Form */}
        <form onSubmit={handlePlaceOrder} className="space-y-8">
          {/* Contact */}
          <section>
            <h2 className="text-lg font-semibold text-gray-800 mb-3">
              Contact
            </h2>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="Email or mobile phone number"
              className="w-full border rounded-xl p-3 text-gray-700 mb-2 focus:ring-2 focus:ring-[#0680cd]"
            />
          </section>

          {/* Delivery */}
          <section>
            <h2 className="text-lg font-semibold text-gray-800 mb-3">
              Delivery
            </h2>
            <select
              name="country"
              value={form.country}
              onChange={handleChange}
              className="w-full border rounded-xl p-3 text-gray-700 mb-3 focus:ring-2 focus:ring-[#0680cd]"
            >
              <option>Kenya</option>
              <option>Tanzania</option>
              <option>Uganda</option>
              <option>Rwanda</option>
            </select>

            <div className="grid grid-cols-2 gap-3 mb-3">
              <input
                name="firstName"
                value={form.firstName}
                onChange={handleChange}
                placeholder="First name"
                className="border rounded-xl p-3 w-full text-gray-700 focus:ring-2 focus:ring-[#0680cd] required"
              />
              <input
                name="lastName"
                value={form.lastName}
                onChange={handleChange}
                placeholder="Last name"
                className="border rounded-xl p-3 w-full text-gray-700 focus:ring-2 focus:ring-[#0680cd] required"
              />
            </div>

            <input
              name="address"
              value={form.address}
              onChange={handleChange}
              placeholder="Address"
              className="border rounded-xl p-3 w-full mb-3 text-gray-700 focus:ring-2 focus:ring-[#0680cd] required"
            />
            <input
              name="apartment"
              value={form.apartment}
              onChange={handleChange}
              placeholder="Apartment, suite, etc. (optional)"
              className="border rounded-xl p-3 w-full mb-3 text-gray-700 focus:ring-2 focus:ring-[#0680cd]"
            />

            <div className="grid grid-cols-2 gap-3 mb-3">
              <input
                name="city"
                value={form.city}
                onChange={handleChange}
                placeholder="City"
                className="border rounded-xl p-3 w-full text-gray-700 focus:ring-2 focus:ring-[#0680cd] required"
              />
              <input
                name="postalCode"
                value={form.postalCode}
                onChange={handleChange}
                placeholder="Postal code (optional)"
                className="border rounded-xl p-3 w-full text-gray-700 focus:ring-2 focus:ring-[#0680cd]"
              />
            </div>
          </section>

          {/* Shipping Method */}
          <section>
            <h2 className="text-lg font-semibold text-gray-800 mb-3">
              Shipping method
            </h2>
            <div className="border rounded-xl flex justify-between items-center p-4">
              <span>Standard</span>
              <span className="font-medium text-gray-800">Free</span>
            </div>
          </section>

          {/* Submit Button */}
          <div className="pt-4 border-t">
            <Button
              type="submit"
              disabled={loading}
              className="bg-[#0680cd] hover:bg-[#0570b3] w-full py-3 rounded-xl text-white text-lg"
            >
              {loading ? <Loader2 className="w-6 h-6 animate-spin mr-3" /> : ""}
              {loading ? "Placing order..." : "Place Order"}
            </Button>
          </div>

          {/* Footer Links */}
          <footer className="text-xs text-gray-500 flex space-x-4 pt-4 border-t">
            <a href="#" className="hover:text-[#0680cd]">
              Refund policy
            </a>
            <a href="#" className="hover:text-[#0680cd]">
              Privacy policy
            </a>
            <a href="#" className="hover:text-[#0680cd]">
              Terms of service
            </a>
            <a href="#" className="hover:text-[#0680cd]">
              Contact
            </a>
          </footer>
        </form>

        {/* RIGHT SIDE — Summary */}
        <aside className="bg-white border rounded-xl p-6 h-fit">
          <h2 className="text-xl font-semibold mb-4">Order Summary</h2>
          <div className="divide-y">
            {cart.map((item) => {
              const product = item.products || item.product;
              return (
                <div
                  key={item.id}
                  className="flex justify-between py-3 items-center"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={
                        product?.image_url || "https://via.placeholder.com/80"
                      }
                      alt={product?.name}
                      className="w-16 h-16 border rounded-lg object-cover"
                    />
                    <div>
                      <p className="text-gray-800 font-medium">
                        {product?.name}
                      </p>
                      <p className="text-sm text-gray-500">
                        Qty: {item.quantity}
                      </p>
                    </div>
                  </div>
                  <p className="text-gray-800 font-semibold">
                    KES{" "}
                    {(
                      (product?.price || item.price_at_add) * item.quantity
                    ).toLocaleString()}
                  </p>
                </div>
              );
            })}
          </div>

          <div className="border-t mt-4 pt-4 text-gray-700 space-y-2">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>KES {total.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span>Shipping</span>
              <span>Free</span>
            </div>
            <div className="border-t pt-3 flex justify-between font-semibold text-lg">
              <span>Total</span>
              <span className="text-[#0680cd]">
                KES {total.toLocaleString()}
              </span>
            </div>
          </div>
        </aside>
      </main>
    </div>
  );
}
