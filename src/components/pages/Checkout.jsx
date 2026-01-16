import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "../../supabaseClient";
import { useCart } from "../../context/CartContext";
import { UserAuth } from "../../context/AuthContext";
import { Button } from "../../components/ui/button";
import BalmOrthoLogo from "../../assets/BalmOrthoLogo.png";
import { Loader2, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

export default function Checkout() {
  const { cart } = useCart();
  const { session } = UserAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const buyNowData = location.state?.buyNow ? location.state : null;

  const [form, setForm] = useState({
    email: "",
    phone: "",
    firstName: "",
    lastName: "",
    address: "",
    city: "",
    postalCode: "",
    shippingMethod: "Pick up (CBD)",
  });

  const [loading, setLoading] = useState(false);

  const activeCart = buyNowData
    ? [
        {
          product_id: buyNowData.product.id,
          products: buyNowData.product,
          quantity: buyNowData.quantity,
        },
      ]
    : cart;

  // Autofill email
  useEffect(() => {
    if (session?.user?.email) {
      setForm((prev) => ({ ...prev, email: session.user.email }));
    }
  }, [session]);

  useEffect(() => {
    if (!activeCart.length) navigate("/cart");
  }, [activeCart, navigate]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const total = activeCart.reduce(
    (sum, item) =>
      sum + (item.products?.price || item.price_at_add) * item.quantity,
    0
  );

  const validateFields = () => {
    const required = [
      form.email,
      form.phone,
      form.firstName,
      form.lastName,
      form.shippingMethod,
    ];

    if (form.shippingMethod === "Delivery") {
      required.push(form.address, form.city, form.postalCode);
    }

    return required.every((field) => field.trim() !== "");
  };

  const handlePlaceOrder = async (e) => {
    e.preventDefault();

    if (!session) {
      toast.error("Please sign in to complete your purchase.");
      return;
    }

    if (!validateFields()) {
      toast.error("Please fill in all required fields.");
      return;
    }

    setLoading(true);

    try {
      const shippingAddress = `
${form.firstName} ${form.lastName}
${form.shippingMethod === "Delivery" ? form.address : "Pick up (CBD)"}
${form.city}
Postal code: ${form.postalCode}
Phone: ${form.phone}
    `.trim();

      // 1️⃣ Create order
      const { data: order, error } = await supabase
        .from("orders")
        .insert({
          user_id: session.user.id,
          total_amount: total,
          status: "pending_payment",
          payment_provider: "pesapal",
          tracking_stage: "placed",
          shipping_address: shippingAddress,
        })
        .select()
        .single();

      if (error) throw error;

      // 2️⃣ Call payment function
      const { data, error: fnError } = await supabase.functions.invoke(
        "create-pesapal-payment",
        {
          body: {
            order_id: order.id,
            amount: total,
            email: form.email,
            phone: form.phone,
            first_name: form.firstName,
            last_name: form.lastName,
          },
        }
      );

      if (fnError) throw fnError;

      // ✅ HARD GUARD (THIS WAS MISSING)
      if (!data?.payment_url) {
        throw new Error("Payment URL not returned");
      }

      // 3️⃣ Redirect
      window.location.assign(data.payment_url);
    } catch (err) {
      console.error("Checkout error:", err);
      toast.error("Unable to start payment. Please try again.");
      setLoading(false); // ✅ GUARANTEED RESET
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 flex flex-col">
      {/* Header */}
      <header className="border-b bg-white/70 backdrop-blur-md sticky top-0 z-20">
        <div className="max-w-4xl mx-auto py-5 px-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img
              src={BalmOrthoLogo}
              className="h-[45px]"
              alt="Balm Ortho Medical Supplies"
            />
            <h1 className="text-2xl font-bold text-gray-800">
              Balm Ortho Medical Supplies
            </h1>
          </div>
          <button
            onClick={() => navigate("/shop")}
            className="flex items-center text-[#4eb0e3] hover:text-[#0570b3]"
          >
            <ArrowLeft className="w-4 h-4 mr-1" /> Go back
          </button>
        </div>
      </header>

      {/* Main */}
      <main className="flex-grow max-w-5xl mx-auto py-12 px-4 grid lg:grid-cols-2 gap-10">
        {/* LEFT */}
        <form
          onSubmit={handlePlaceOrder}
          className="space-y-8 bg-white/90 p-8 rounded-2xl shadow-lg"
        >
          {/* Contact */}
          <section>
            <h2 className="text-lg font-semibold mb-3">Contact</h2>
            <div className="space-y-3">
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="Email"
                required
                readOnly={!!session}
                className="w-full border rounded-xl p-3 bg-gray-100"
              />
              <input
                type="tel"
                name="phone"
                value={form.phone}
                onChange={handleChange}
                placeholder="Phone number E.g 254712345678"
                required
                className="w-full border rounded-xl p-3"
              />
            </div>
          </section>

          {/* Shipping */}
          <section>
            <h2 className="text-lg font-semibold mb-3">Shipping Method</h2>
            <select
              name="shippingMethod"
              value={form.shippingMethod}
              onChange={handleChange}
              className="w-full border rounded-xl p-3 mb-3"
            >
              <option value="Pick up (CBD)">Pick up (CBD)</option>
              <option value="Delivery">Delivery</option>
            </select>

            {form.shippingMethod === "Delivery" && (
              <div className="space-y-3">
                <input
                  name="address"
                  value={form.address}
                  onChange={handleChange}
                  placeholder="Address"
                  required
                  className="w-full border rounded-xl p-3"
                />
                <div className="grid grid-cols-2 gap-3">
                  <input
                    name="city"
                    value={form.city}
                    onChange={handleChange}
                    placeholder="City"
                    required
                    className="border rounded-xl p-3"
                  />
                  <input
                    name="postalCode"
                    value={form.postalCode}
                    onChange={handleChange}
                    placeholder="Postal code"
                    required
                    className="border rounded-xl p-3"
                  />
                </div>
              </div>
            )}
          </section>

          {/* Recipient */}
          <section>
            <h2 className="text-lg font-semibold mb-3">Recipient</h2>
            <div className="grid grid-cols-2 gap-3">
              <input
                name="firstName"
                value={form.firstName}
                onChange={handleChange}
                placeholder="First name"
                required
                className="border rounded-xl p-3"
              />
              <input
                name="lastName"
                value={form.lastName}
                onChange={handleChange}
                placeholder="Last name"
                required
                className="border rounded-xl p-3"
              />
            </div>
          </section>

          {/* Payment Notice */}
          <section className="bg-blue-50 border border-blue-100 p-4 rounded-xl text-sm">
            <p className="font-medium text-blue-800">
              Secure payment via Pesapal
            </p>
            <p className="text-blue-700 mt-1">
              You’ll be redirected to Pesapal to complete payment using M-PESA,
              Visa, Mastercard, or Airtel Money.
            </p>
          </section>

          {/* Button */}
          <div className="flex justify-end pt-4 border-t">
            <Button
              type="submit"
              variant="solid"
              disabled={loading}
              className="bg-gradient-to-r from-[#4eb0e3] to-[#0570b3] px-8 py-3 text-white rounded-xl cursor-pointer"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              {loading ? "Redirecting…" : "Proceed to Payment"}
            </Button>
          </div>
        </form>

        {/* RIGHT — Order Summary (unchanged logic) */}
        <aside className="bg-white/90 border rounded-2xl shadow-lg p-6 h-fit">
          <h2 className="text-xl font-semibold mb-4">Order Summary</h2>

          {activeCart.map((item) => {
            const product = item.products || item.product;
            return (
              <div key={item.id} className="flex justify-between py-3">
                <div>
                  <p className="font-medium">{product?.name}</p>
                  <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                </div>
                <p className="font-semibold">
                  KES{" "}
                  {(
                    (product?.price || item.price_at_add) * item.quantity
                  ).toLocaleString()}
                </p>
              </div>
            );
          })}

          <div className="border-t pt-4 mt-4 flex justify-between font-semibold">
            <span>Total</span>
            <span className="text-[#0570b3]">KES {total.toLocaleString()}</span>
          </div>
        </aside>
      </main>
    </div>
  );
}
