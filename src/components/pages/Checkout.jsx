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
  const [paymentMethod, setPaymentMethod] = useState("Mpesa");
  const [mpesaNumber, setMpesaNumber] = useState("");
  const [cardDetails, setCardDetails] = useState({
    cardNumber: "",
    expiry: "",
    cvv: "",
  });

  const activeCart = buyNowData
    ? [
        {
          product_id: buyNowData.product.id,
          products: buyNowData.product,
          quantity: buyNowData.quantity,
        },
      ]
    : cart;

  // Autofill user email
  useEffect(() => {
    if (session?.user?.email) {
      setForm((prev) => ({ ...prev, email: session.user.email }));
    }
  }, [session]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // Mpesa auto-format
  const handleMpesaChange = (e) => {
    let input = e.target.value.replace(/\D/g, ""); // remove non-numeric
    if (input.startsWith("0")) input = "254" + input.slice(1);
    if (!input.startsWith("254")) input = "254" + input;
    if (input.length > 12) input = input.slice(0, 12);
    setMpesaNumber("+" + input);
  };

  const total = activeCart.reduce(
    (sum, item) =>
      sum + (item.products?.price || item.price_at_add) * item.quantity,
    0
  );

  const validateFields = () => {
    const requiredBase = [
      form.email,
      form.phone,
      form.firstName,
      form.lastName,
      form.shippingMethod,
    ];

    if (form.shippingMethod === "Delivery") {
      requiredBase.push(form.address, form.city, form.postalCode);
    }

    if (paymentMethod === "Mpesa") {
      requiredBase.push(mpesaNumber);
      if (!/^(\+2547\d{8})$/.test(mpesaNumber)) return false;
    } else {
      requiredBase.push(
        cardDetails.cardNumber,
        cardDetails.expiry,
        cardDetails.cvv
      );
    }

    return requiredBase.every((field) => field.trim() !== "");
  };

  const handlePlaceOrder = async (e) => {
    e.preventDefault();

    if (!session) {
      toast.error("Please sign in to complete your purchase.");
      return;
    }

    if (!validateFields()) {
      toast.error("Please fill in all fields correctly.");
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
`;

      const { data: order, error } = await supabase
        .from("orders")
        .insert({
          user_id: session.user.id,
          total_amount: total,
          status: "pending_payment",
          payment_provider: "pesapal",
          tracking_stage: "placed",
          shipping_address: shippingAddress,
          payment_method: paymentMethod,
        })
        .select()
        .single();

      if (error) throw error;

      // Call Edge Function to initiate Pesapal payment
      const { data: paymentRes, error: paymentErr } =
        await supabase.functions.invoke("create-pesapal-payment", {
          body: {
            order_id: order.id,
            amount: total,
            email: form.email,
            phone: form.phone,
            first_name: form.firstName,
            last_name: form.lastName,
          },
        });

      if (paymentErr) throw paymentErr;

      // Redirect user to Pesapal checkout
      window.location.href = paymentRes.payment_url;
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!activeCart.length) navigate("/cart");
  }, [cart]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 flex flex-col">
      {/* Header */}
      <header className="border-b bg-white/70 backdrop-blur-md sticky top-0 z-20">
        <div className="max-w-4xl mx-auto py-5 px-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src={BalmOrthoLogo} className="h-[45px]" alt="Balm Ortho" />
            <h1 className="text-2xl font-bold text-gray-800 tracking-tight">
              Balm Ortho Medical
            </h1>
          </div>
          <button
            onClick={() => navigate("/shop")}
            className="flex items-center text-[#4eb0e3] hover:text-[#0570b3] transition cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 mr-1" /> Go back
          </button>
        </div>
      </header>

      {/* Main */}
      <main className="flex-grow max-w-5xl mx-auto py-12 px-4 grid lg:grid-cols-2 gap-10">
        {/* LEFT SIDE */}
        <form
          onSubmit={handlePlaceOrder}
          className="space-y-8 bg-white/90 backdrop-blur-sm p-8 rounded-2xl shadow-lg border border-gray-100"
        >
          {/* Contact */}
          <section>
            <h2 className="text-lg font-semibold text-gray-800 mb-3">
              Contact
            </h2>
            <div className="space-y-3">
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="Email"
                required
                className={`w-full border rounded-xl p-3 transition focus:ring-2 focus:ring-[#4eb0e3] ${
                  session ? "bg-gray-100" : "bg-white"
                }`}
                readOnly={!!session}
              />
              <input
                type="tel"
                name="phone"
                value={form.phone}
                onChange={handleChange}
                placeholder="Phone number"
                required
                className="w-full border rounded-xl p-3 bg-white focus:ring-2 focus:ring-[#4eb0e3]"
              />
            </div>
          </section>

          {/* Shipping Method */}
          <section>
            <h2 className="text-lg font-semibold text-gray-800 mb-3">
              Shipping Method
            </h2>
            <select
              name="shippingMethod"
              value={form.shippingMethod}
              onChange={handleChange}
              required
              className="w-full border rounded-xl p-3 mb-3 bg-white focus:ring-2 focus:ring-[#4eb0e3] cursor-pointer"
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
                  className="border rounded-xl p-3 w-full bg-white focus:ring-2 focus:ring-[#4eb0e3]"
                />
                <div className="grid grid-cols-2 gap-3">
                  <input
                    name="city"
                    value={form.city}
                    onChange={handleChange}
                    placeholder="City"
                    required
                    className="border rounded-xl p-3 bg-white focus:ring-2 focus:ring-[#4eb0e3]"
                  />
                  <input
                    name="postalCode"
                    value={form.postalCode}
                    onChange={handleChange}
                    placeholder="Postal code"
                    required
                    className="border rounded-xl p-3 bg-white focus:ring-2 focus:ring-[#4eb0e3]"
                  />
                </div>
              </div>
            )}
          </section>

          {/* Recipient */}
          <section>
            <h2 className="text-lg font-semibold text-gray-800 mb-3">
              Recipient
            </h2>
            <div className="grid grid-cols-2 gap-3">
              <input
                name="firstName"
                value={form.firstName}
                onChange={handleChange}
                placeholder="First name"
                required
                className="border rounded-xl p-3 bg-white focus:ring-2 focus:ring-[#4eb0e3]"
              />
              <input
                name="lastName"
                value={form.lastName}
                onChange={handleChange}
                placeholder="Last name"
                required
                className="border rounded-xl p-3 bg-white focus:ring-2 focus:ring-[#4eb0e3]"
              />
            </div>
          </section>

          {/* Payment */}
          <section>
            <h2 className="text-lg font-semibold text-gray-800 mb-3">
              Payment
            </h2>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              required
              className="w-full border rounded-xl p-3 mb-3 bg-white focus:ring-2 focus:ring-[#4eb0e3] cursor-pointer"
            >
              <option value="Mpesa">Mpesa</option>
              <option value="Card">Card</option>
            </select>

            {paymentMethod === "Mpesa" ? (
              <input
                type="tel"
                value={mpesaNumber}
                onChange={handleMpesaChange}
                placeholder="+2547XXXXXXXX"
                required
                className="border rounded-xl p-3 w-full bg-white focus:ring-2 focus:ring-[#4eb0e3]"
              />
            ) : (
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Card number"
                  value={cardDetails.cardNumber}
                  onChange={(e) =>
                    setCardDetails({
                      ...cardDetails,
                      cardNumber: e.target.value,
                    })
                  }
                  required
                  className="border rounded-xl p-3 w-full bg-white focus:ring-2 focus:ring-[#4eb0e3]"
                />
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    placeholder="MM/YY"
                    value={cardDetails.expiry}
                    onChange={(e) =>
                      setCardDetails({ ...cardDetails, expiry: e.target.value })
                    }
                    required
                    className="border rounded-xl p-3 bg-white focus:ring-2 focus:ring-[#4eb0e3]"
                  />
                  <input
                    type="text"
                    placeholder="CVV"
                    value={cardDetails.cvv}
                    onChange={(e) =>
                      setCardDetails({ ...cardDetails, cvv: e.target.value })
                    }
                    required
                    className="border rounded-xl p-3 bg-white focus:ring-2 focus:ring-[#4eb0e3]"
                  />
                </div>
                <div className="flex gap-3 mt-2">
                  <img
                    src="https://upload.wikimedia.org/wikipedia/commons/0/04/Mastercard-logo.png"
                    alt="Mastercard"
                    className="h-6"
                  />
                  <img
                    src="https://upload.wikimedia.org/wikipedia/commons/4/41/Visa_Logo.png"
                    alt="Visa"
                    className="h-6"
                  />
                </div>
              </div>
            )}
          </section>

          {/* Button */}
          <div className="flex justify-end pt-4 border-t">
            <Button
              type="submit"
              disabled={loading}
              className="bg-gradient-to-r from-[#4eb0e3] to-[#0570b3] hover:opacity-90 transition-all duration-300 px-8 py-3 rounded-xl text-white font-medium flex items-center cursor-pointer"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              {loading ? "Processing..." : "Place Order"}
            </Button>
          </div>
        </form>

        {/* RIGHT SIDE */}
        <aside className="bg-white/90 backdrop-blur-sm border rounded-2xl shadow-lg p-6 h-fit">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">
            Order Summary
          </h2>
          <div className="divide-y divide-gray-200">
            {activeCart.map((item) => {
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
              <span className="text-[#0570b3]">
                KES {total.toLocaleString()}
              </span>
            </div>
          </div>
        </aside>
      </main>
    </div>
  );
}
