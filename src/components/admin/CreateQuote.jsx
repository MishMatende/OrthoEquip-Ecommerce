import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../supabaseClient";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Plus, Trash2, Lock, Unlock } from "lucide-react";
import { toast } from "sonner";
import { UserAuth } from "../../context/AuthContext";

export default function CreateQuote() {
  const { session } = UserAuth();
  const userId = session?.user?.id;

  /* ---------------- STATE ---------------- */

  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");

  const [items, setItems] = useState([]);
  const [customerId, setCustomerId] = useState("");

  // Guest
  const [guestName, setGuestName] = useState("");
  const [guestPhone, setGuestPhone] = useState("");

  // Pricing
  const [discountType, setDiscountType] = useState("none");
  const [discountValue, setDiscountValue] = useState(0);

  const [validUntil, setValidUntil] = useState("");

  const PRODUCT_LIMIT = 10;
  const [visibleCount] = useState(PRODUCT_LIMIT);

  // Draft persistence
  const DRAFT_KEY = userId ? `quote_draft_${userId}` : null;
  const [draftReady, setDraftReady] = useState(false);

  /* ---------------- FETCH DATA ---------------- */

  useEffect(() => {
    fetchCustomers();
    fetchProducts();
  }, []);

  async function fetchCustomers() {
    const { data } = await supabase
      .from("profiles")
      .select("id, username, email, phone")
      .eq("role", "customer")
      .order("email");

    setCustomers(data || []);
  }

  async function fetchProducts() {
    const { data } = await supabase
      .from("products")
      .select("id, name, price, image_url")
      .order("name");

    setProducts(data || []);
  }

  /* ---------------- DRAFT RESTORE ---------------- */

  useEffect(() => {
    if (!DRAFT_KEY) return;

    const saved = localStorage.getItem(DRAFT_KEY);
    if (!saved) {
      setDraftReady(true);
      return;
    }

    try {
      const draft = JSON.parse(saved);

      setCustomerId(draft.customerId || "");
      setGuestName(draft.guestName || "");
      setGuestPhone(draft.guestPhone || "");
      setItems(draft.items || []);
      setDiscountType(draft.discountType || "none");
      setDiscountValue(draft.discountValue || 0);
      setValidUntil(draft.validUntil || "");

      toast.message("Draft restored");
    } catch {
      localStorage.removeItem(DRAFT_KEY);
    } finally {
      setDraftReady(true);
    }
  }, [DRAFT_KEY]);

  /* ---------------- DRAFT AUTOSAVE ---------------- */

  useEffect(() => {
    if (!DRAFT_KEY || !draftReady) return;

    const draft = {
      customerId,
      guestName,
      guestPhone,
      items,
      discountType,
      discountValue,
      validUntil,
    };

    localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  }, [
    DRAFT_KEY,
    draftReady,
    customerId,
    guestName,
    guestPhone,
    items,
    discountType,
    discountValue,
    validUntil,
  ]);

  /* ---------------- PRODUCTS ---------------- */

  function addProduct(product) {
    if (items.some((i) => i.product_id === product.id)) {
      toast.error("Product already added");
      return;
    }

    setItems((prev) => [
      ...prev,
      {
        product_id: product.id,
        name: product.name,
        image_url: product.image_url,
        quantity: 1,
        price: product.price,
        locked: true,
      },
    ]);
  }

  function updateItem(index, field, value) {
    const copy = [...items];
    copy[index][field] = value;
    setItems(copy);
  }

  function toggleLock(index) {
    const copy = [...items];
    copy[index].locked = !copy[index].locked;
    setItems(copy);
  }

  function removeItem(index) {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }

  /* ---------------- GUEST CUSTOMER ---------------- */

  async function createGuestCustomer() {
    if (!guestName || !guestPhone) {
      toast.error("Guest name and phone required");
      return null;
    }

    if (!/^2547\d{8}$/.test(guestPhone)) {
      toast.error("Phone must be in format 2547XXXXXXXX");
      return null;
    }

    const { data, error } = await supabase
      .from("profiles")
      .insert({
        username: guestName,
        phone: guestPhone,
        role: "customer",
      })
      .select()
      .single();

    if (error) {
      toast.error("Failed to create guest");
      return null;
    }

    setCustomers((prev) => [...prev, data]);
    setCustomerId(data.id);
    return data.id;
  }

  /* ---------------- TOTALS ---------------- */

  const subtotal = useMemo(
    () =>
      items.reduce((sum, i) => sum + Number(i.quantity) * Number(i.price), 0),
    [items]
  );

  const discountAmount = useMemo(() => {
    if (discountType === "flat") return Number(discountValue);
    if (discountType === "percent")
      return (subtotal * Number(discountValue)) / 100;
    return 0;
  }, [discountType, discountValue, subtotal]);

  const total = subtotal - discountAmount;

  /* ---------------- SAVE ---------------- */

  async function saveQuote() {
    let finalCustomerId = customerId;

    if (!finalCustomerId) {
      finalCustomerId = await createGuestCustomer();
      if (!finalCustomerId) return;
    }

    if (items.length === 0) {
      toast.error("Add at least one product");
      return;
    }

    const { data: quote, error } = await supabase
      .from("orders")
      .insert({
        user_id: finalCustomerId,
        order_type: "quote",
        quote_status: "draft",
        valid_until: validUntil,
        total,
        payment_status: "unpaid",
      })
      .select()
      .single();

    if (error) {
      toast.error("Failed to save quote");
      return;
    }

    await supabase.from("order_items").insert(
      items.map((i) => ({
        order_id: quote.id,
        product_id: i.product_id,
        quantity: i.quantity,
        price: i.price,
      }))
    );

    toast.success("Quotation created");

    if (DRAFT_KEY) localStorage.removeItem(DRAFT_KEY);

    setItems([]);
    setCustomerId("");
    setGuestName("");
    setGuestPhone("");
    setDiscountType("none");
    setDiscountValue(0);
    setValidUntil("");
  }

  const filteredProducts = useMemo(() => {
    const list = products.filter((p) =>
      p.name.toLowerCase().includes(search.toLowerCase())
    );
    return list.slice(0, visibleCount);
  }, [products, search, visibleCount]);

  /* ---------------- UI ---------------- */

  return (
    <div className="max-w-5xl mx-auto space-y-8 px-3 md:px-0">
      <h1 className="text-2xl font-bold">Create Quotation</h1>

      {/* CUSTOMER */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Customer</label>
        <select
          className="w-full border rounded px-3 py-2"
          value={customerId}
          onChange={(e) => setCustomerId(e.target.value)}
        >
          <option value="">Select customer</option>
          {customers.map((c) => (
            <option key={c.id} value={c.id}>
              {c.username || c.email}
              {c.phone ? ` — ${c.phone}` : ""}
            </option>
          ))}
        </select>
      </div>

      {/* GUEST */}
      {!customerId && (
        <div className="border rounded-lg p-4 space-y-3 bg-gray-50">
          <p className="font-medium">Guest customer</p>
          <Input
            placeholder="Guest name"
            value={guestName}
            onChange={(e) => setGuestName(e.target.value)}
          />
          <Input
            placeholder="2547XXXXXXXX"
            value={guestPhone}
            onChange={(e) => setGuestPhone(e.target.value)}
          />
        </div>
      )}

      {/* PRODUCT SEARCH */}
      <Input
        placeholder="Search products..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {/* PRODUCTS */}
      <div className="flex flex-wrap gap-2">
        {filteredProducts.map((p) => (
          <Button key={p.id} variant="outline" onClick={() => addProduct(p)}>
            <Plus className="w-4 h-4 mr-1" />
            {p.name}
          </Button>
        ))}
      </div>

      {/* SELECTED ITEMS */}
      <div className="space-y-4">
        {items.map((item, i) => (
          <div
            key={i}
            className="border rounded-lg p-3 flex flex-col md:flex-row gap-4"
          >
            <div className="relative w-full md:w-20 h-40 md:h-20">
              <img
                src={
                  item.image_url
                    ? encodeURI(item.image_url)
                    : "/placeholder.png"
                }
                alt={item.name}
                onError={(e) => {
                  e.currentTarget.src = "/placeholder.png";
                }}
                className="w-full h-full object-cover rounded border"
              />

              {!item.image_url && (
                <span className="absolute bottom-1 right-1 text-[10px] bg-gray-700 text-white px-1 rounded">
                  No image
                </span>
              )}
            </div>

            <div className="flex-1 space-y-1">
              <p className="font-medium">{item.name}</p>
              <p className="text-sm text-gray-500">Unit price: {item.price}</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-1 gap-2">
              <Input
                type="number"
                value={item.quantity}
                onChange={(e) => updateItem(i, "quantity", e.target.value)}
              />
              <Input
                type="number"
                disabled={item.locked}
                value={item.price}
                onChange={(e) => updateItem(i, "price", e.target.value)}
              />
            </div>

            <div className="flex md:flex-col gap-2">
              <Button variant="ghost" onClick={() => toggleLock(i)}>
                {item.locked ? <Lock size={16} /> : <Unlock size={16} />}
              </Button>
              <Button variant="ghost" onClick={() => removeItem(i)}>
                <Trash2 size={16} />
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* TOTALS */}
      <div className="border rounded-lg p-4 space-y-3 bg-gray-50">
        <p>Subtotal: {subtotal.toFixed(2)}</p>
        <p className="text-lg font-bold">Total: {total.toFixed(2)}</p>
      </div>

      <Button size="lg" className="w-full md:w-auto" onClick={saveQuote}>
        Save Quotation
      </Button>
    </div>
  );
}
