import { useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { supabase } from "../../supabaseClient";
import { useCart } from "../../context/CartContext";
import { UserAuth } from "../../context/AuthContext";
import { Button } from "../../components/ui/button";
import BalmOrthoLogo from "../../assets/BalmOrthoLogo.png";
import { Loader2, ArrowLeft, Info, FileDown } from "lucide-react";
import toast from "react-hot-toast";

const FORM_STORAGE_KEY = "checkout_form";

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
  const [orderId, setOrderId] = useState(null);
  const [paid, setPaid] = useState(false);

  const activeCart = buyNowData
    ? [
        {
          product_id: buyNowData.product.id,
          products: buyNowData.product,
          quantity: buyNowData.quantity,
        },
      ]
    : cart;

  /* ------------------ FORM PERSISTENCE ------------------ */

  useEffect(() => {
    const saved = localStorage.getItem(FORM_STORAGE_KEY);
    if (saved) setForm(JSON.parse(saved));
  }, []);

  useEffect(() => {
    localStorage.setItem(FORM_STORAGE_KEY, JSON.stringify(form));
  }, [form]);

  /* ------------------ SESSION ------------------ */

  useEffect(() => {
    if (session?.user?.email) {
      setForm((p) => ({ ...p, email: session.user.email }));
    }
  }, [session]);

  /* ------------------ LOAD PROFILE ------------------ */

  useEffect(() => {
    const loadProfile = async () => {
      if (!session?.user?.id) return;

      const { data } = await supabase
        .from("profiles")
        .select("phone, username")
        .eq("id", session.user.id)
        .single();

      if (!data) return;

      setForm((p) => {
        const updated = { ...p };

        if (!p.phone && data.phone) updated.phone = data.phone;

        if ((!p.firstName || !p.lastName) && data.username) {
          const parts = data.username.trim().split(" ");
          updated.firstName = p.firstName || parts[0] || "";
          updated.lastName = p.lastName || parts.slice(1).join(" ") || "";
        }

        return updated;
      });
    };

    loadProfile();
  }, [session]);

  useEffect(() => {
    if (!activeCart.length) navigate("/cart");
  }, [activeCart, navigate]);

  /* ------------------ HELPERS ------------------ */

  const normalizePhone = (phone) => {
    let p = phone.trim();
    if (p.startsWith("0")) p = "254" + p.slice(1);
    if (p.startsWith("+")) p = p.slice(1);
    return p;
  };

  const total = activeCart.reduce(
    (sum, item) =>
      sum + (item.products?.price || item.price_at_add) * item.quantity,
    0,
  );

  const validateFields = () => {
    const required = [form.email, form.phone, form.firstName, form.lastName];
    if (form.shippingMethod === "Delivery") {
      required.push(form.address, form.city, form.postalCode);
    }
    return required.every((f) => f.trim() !== "");
  };

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  /* ------------------ PLACE ORDER ------------------ */

  const handlePlaceOrder = async (e) => {
    e.preventDefault();

    if (!session) {
      toast.error("Please sign in");
      return;
    }

    if (!validateFields()) {
      toast.error("Fill in all required fields");
      return;
    }

    setLoading(true);

    try {
      const username = `${form.firstName} ${form.lastName}`.trim();

      await supabase.from("profiles").upsert(
        {
          id: session.user.id,
          phone: form.phone,
          username,
        },
        { onConflict: "id" },
      );

      const shippingAddress = `
${form.firstName} ${form.lastName}
${form.shippingMethod === "Delivery" ? form.address : "Pick up (CBD)"}
${form.city}
Postal: ${form.postalCode}
Phone: ${form.phone}
`.trim();

      const { data: order, error } = await supabase
        .from("orders")
        .insert({
          user_id: session.user.id,
          total_amount: total,
          status: "pending_verification",
          payment_provider: "intasend",
          payment_reference: crypto.randomUUID().slice(0, 10),
          shipping_address: shippingAddress,
        })
        .select()
        .single();

      if (error) throw error;

      setOrderId(order.id);

      const { data, fnError } = await supabase.functions.invoke(
        "intasend-wallet-stk",
        {
          body: {
            order_id: order.id,
            amount: total,
            phone: normalizePhone(form.phone),
            email: form.email,
            name: username,
          },
        },
      );

      if (fnError) throw error;

      if (!data?.success) {
        throw new Error(data?.fnError || "STK failed");
      }

      toast.info("Check your phone for the M-PESA STK prompt");
      localStorage.removeItem(FORM_STORAGE_KEY);
      setLoading(false);
      navigate(`/order-confirmation/${order.id}`);
    } catch (err) {
      console.error(err);
      setLoading(false);
      toast.error("Payment initiation failed");
    }
  };

  /* ------------------ UI ------------------ */

  return (
    <div className="min-h-screen bg-blue-50">
      <header className="bg-white border-b">
        <div className="max-w-5xl mx-auto p-4 flex justify-between">
          <div className="flex items-center space-x-2">
            <img
              src={BalmOrthoLogo}
              className="h-[50px]"
              alt="Balm Ortho Medical Supplies image"
            />
            <Link to="/" className="text-xl font-semibold md:text-2xl">
              Balm Ortho Medical Supplies
            </Link>
          </div>
          <button onClick={() => navigate("/shop")}>
            <ArrowLeft className="w-4 h-4 inline" /> Shop
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto grid lg:grid-cols-2 gap-10 p-6">
        {/* ------------------ FORM ------------------ */}
        <form
          onSubmit={handlePlaceOrder}
          className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border space-y-6"
        >
          <h2 className="font-semibold text-lg">Contact</h2>

          <input
            name="email"
            value={form.email}
            readOnly
            className="w-full border rounded-lg px-4 py-3"
          />

          <input
            name="phone"
            value={form.phone}
            onChange={handleChange}
            placeholder="Phone e.g. 2547XXXXXXXX"
            className="w-full border rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500"
          />

          {/* INFO NOTE */}
          <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3">
            <div className="flex gap-3">
              <Info className="w-4 h-4 text-blue-600 mt-0.5" />
              <div className="text-sm text-blue-800 space-y-1">
                <p className="font-medium">
                  Secure M-PESA payment via IntaSend
                </p>
                <p>
                  We use <span className="font-semibold">IntaSend</span> to
                  initiate an M-PESA STK push.
                </p>
                <p>
                  Please confirm the phone number above is the number you’ll use
                  to complete payment.
                </p>
              </div>
            </div>
          </div>

          <h2 className="font-semibold text-lg">Recipient</h2>
          <div className="grid grid-cols-2 gap-3">
            <input
              name="firstName"
              value={form.firstName}
              onChange={handleChange}
              placeholder="First name"
              className="border rounded-lg px-4 py-3"
            />
            <input
              name="lastName"
              value={form.lastName}
              onChange={handleChange}
              placeholder="Last name"
              className="border rounded-lg px-4 py-3"
            />
          </div>

          <h2 className="font-semibold text-lg">Shipping</h2>
          <select
            name="shippingMethod"
            value={form.shippingMethod}
            onChange={handleChange}
            className="border rounded-lg px-4 py-3 w-full"
          >
            <option>Pick up (CBD)</option>
            <option>Delivery</option>
          </select>

          {form.shippingMethod === "Delivery" && (
            <>
              <input
                name="address"
                value={form.address}
                onChange={handleChange}
                placeholder="Address"
                className="border rounded-lg px-4 py-3 w-full"
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  name="city"
                  value={form.city}
                  onChange={handleChange}
                  placeholder="City"
                  className="border rounded-lg px-4 py-3"
                />
                <input
                  name="postalCode"
                  value={form.postalCode}
                  onChange={handleChange}
                  placeholder="Postal"
                  className="border rounded-lg px-4 py-3"
                />
              </div>
            </>
          )}

          <Button disabled={loading} type="submit" className="w-full">
            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Pay with M-PESA (STK Push)
          </Button>
        </form>

        {/* ------------------ SUMMARY ------------------ */}
        <aside className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border">
          <h2 className="font-semibold mb-6 text-lg">Order Summary</h2>

          <div className="space-y-4">
            {activeCart.map((i) => (
              <div
                key={i.product_id}
                className="flex items-center gap-4 border-b pb-4 last:border-b-0"
              >
                <img
                  src={i.products.image_url}
                  alt={i.products.name}
                  className="w-16 h-16 rounded-lg object-cover border"
                />

                <div className="flex-1">
                  <p className="font-medium">{i.products.name}</p>
                  <p className="text-sm text-gray-500">
                    KES {i.products.price.toLocaleString()} each
                  </p>
                </div>

                <div className="text-right">
                  <span className="inline-flex bg-gray-100 rounded-full px-3 py-1 text-sm font-medium">
                    × {i.quantity}
                  </span>
                  <p className="mt-2 font-semibold">
                    KES {(i.products.price * i.quantity).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="border-t mt-6 pt-6 flex justify-between text-lg font-bold">
            <span>Total</span>
            <span>KES {total.toLocaleString()}</span>
          </div>
        </aside>
      </main>
    </div>
  );
}
