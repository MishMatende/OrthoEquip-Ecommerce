import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "../../supabaseClient";
import { useCart } from "../../context/CartContext";
import { UserAuth } from "../../context/AuthContext";
import { Button } from "../../components/ui/button";
import BalmOrthoLogo from "../../assets/BalmOrthoLogo.png";
import { Loader2, ArrowLeft, FileDown } from "lucide-react";
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

  useEffect(() => {
    if (session?.user?.email) {
      setForm((p) => ({ ...p, email: session.user.email }));
    }
  }, [session]);

  useEffect(() => {
    if (!activeCart.length) navigate("/cart");
  }, [activeCart, navigate]);

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

  // 🔁 Poll payment status
  useEffect(() => {
    if (!orderId || paid) return;

    let attempts = 0;

    const interval = setInterval(async () => {
      attempts++;

      const { data } = await supabase
        .from("orders")
        .select("status")
        .eq("id", orderId)
        .single();

      if (data?.status === "paid") {
        clearInterval(interval);
        setPaid(true);
        toast.success("Payment successful 🎉");
        return;
      }

      if (data?.status === "failed") {
        clearInterval(interval);
        toast.error("Payment failed or cancelled");
        return;
      }

      // ⏱ stop after 2 minutes
      if (attempts >= 30) {
        clearInterval(interval);
        toast.warning("Payment still pending. Check your phone.");
      }
    }, 4000);

    return () => clearInterval(interval);
  }, [orderId, paid]);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

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
          status: "pending_payment",
          payment_provider: "intasend",
          payment_reference: crypto.randomUUID().slice(0, 10),
          shipping_address: shippingAddress,
        })
        .select()
        .single();

      if (error) throw error;

      setOrderId(order.id);

      const { error: fnError } = await supabase.functions.invoke(
        "intasend-wallet-stk",
        {
          body: {
            order_id: order.id,
            amount: total,
            phone: normalizePhone(form.phone),
            email: form.email,
            name: `${form.firstName} ${form.lastName}`,
          },
        },
      );

      if (fnError) throw fnError;

      toast.info("Check your phone for M-PESA prompt");
    } catch (err) {
      console.error(err);
      toast.error("Payment initiation failed");
    } finally {
      setLoading(false);
    }
  };

  const downloadInvoice = async () => {
    const res = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-invoice`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ order_id: orderId }),
      },
    );

    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Invoice-${orderId}.pdf`;
    a.click();
  };

  return (
    <div className="min-h-screen bg-blue-50">
      <header className="bg-white border-b">
        <div className="max-w-4xl mx-auto p-4 flex justify-between">
          <img src={BalmOrthoLogo} className="h-10" />
          <button onClick={() => navigate("/shop")}>
            <ArrowLeft className="w-4 h-4 inline" /> Shop
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto grid lg:grid-cols-2 gap-10 p-6">
        <form
          onSubmit={handlePlaceOrder}
          className="bg-white p-6 rounded-xl space-y-6"
        >
          <h2 className="font-semibold text-lg">Contact</h2>

          <input
            name="email"
            value={form.email}
            readOnly
            className="w-full border p-3 rounded"
          />

          <input
            name="phone"
            value={form.phone}
            onChange={handleChange}
            placeholder="Phone e.g. 2547XXXXXXXX"
            className="w-full border p-3 rounded"
          />

          <h2 className="font-semibold text-lg">Recipient</h2>
          <div className="grid grid-cols-2 gap-3">
            <input
              name="firstName"
              value={form.firstName}
              onChange={handleChange}
              placeholder="First name"
              className="border p-3 rounded"
            />
            <input
              name="lastName"
              value={form.lastName}
              onChange={handleChange}
              placeholder="Last name"
              className="border p-3 rounded"
            />
          </div>

          <h2 className="font-semibold text-lg">Shipping</h2>
          <select
            name="shippingMethod"
            value={form.shippingMethod}
            onChange={handleChange}
            className="border p-3 rounded w-full"
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
                className="border p-3 rounded w-full"
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  name="city"
                  value={form.city}
                  onChange={handleChange}
                  placeholder="City"
                  className="border p-3 rounded"
                />
                <input
                  name="postalCode"
                  value={form.postalCode}
                  onChange={handleChange}
                  placeholder="Postal"
                  className="border p-3 rounded"
                />
              </div>
            </>
          )}

          {!paid ? (
            <Button disabled={loading} type="submit">
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Pay with M-PESA
            </Button>
          ) : (
            <Button type="button" onClick={downloadInvoice}>
              <FileDown className="w-4 h-4 mr-2" />
              Download Invoice
            </Button>
          )}
        </form>

        <aside className="bg-white p-6 rounded-xl">
          <h2 className="font-semibold mb-4">Order Summary</h2>
          {activeCart.map((i) => (
            <div key={i.product_id} className="flex justify-between">
              <span>
                {i.products.name} × {i.quantity}
              </span>
              <span>
                KES {(i.products.price * i.quantity).toLocaleString()}
              </span>
            </div>
          ))}
          <div className="border-t mt-4 pt-4 font-bold">
            Total: KES {total.toLocaleString()}
          </div>
        </aside>
      </main>
    </div>
  );
}
