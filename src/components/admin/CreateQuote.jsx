import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../supabaseClient";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Plus, Trash2, Lock, Unlock } from "lucide-react";
import toast from "react-hot-toast";
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
  const [guestEmail, setGuestEmail] = useState("");
  const [guestAddress, setGuestAddress] = useState("");
  const [guestCity, setGuestCity] = useState("");

  // Pricing
  const [discountType, setDiscountType] = useState("none");
  const [discountValue, setDiscountValue] = useState(0);

  const [validUntil, setValidUntil] = useState("");

  const PRODUCT_LIMIT = 10;
  const [visibleCount] = useState(PRODUCT_LIMIT);

  // Loading states
  const [loadingData, setLoadingData] = useState(true);

  // Draft persistence
  const DRAFT_KEY = userId ? `quote_draft_${userId}` : null;
  const [draftReady, setDraftReady] = useState(false);

  /* ---------------- FETCH DATA ---------------- */

  async function fetchCustomers() {
    const { data, error } = await supabase
      .from("customers")
      .select("id, name, phone, email, address, city")
      .order("name");

    if (error) {
      console.error("[fetchCustomers] error:", error);
      toast.error("Failed to fetch customers");
      return [];
    }

    return data || [];
  }

  async function fetchProducts() {
    const { data, error } = await supabase
      .from("products")
      .select("id, name, price, image_url")
      .order("name");

    if (error) {
      console.error("[fetchProducts] error:", error);
      toast.error("Failed to fetch products");
      return [];
    }

    return data || [];
  }

  useEffect(() => {
    if (!session) return;

    let isMounted = true;

    async function loadData() {
      setLoadingData(true);

      const [customersData, productsData] = await Promise.all([
        fetchCustomers(),
        fetchProducts(),
      ]);

      if (!isMounted) return;

      setCustomers(customersData);
      setProducts(productsData);

      setLoadingData(false);
    }

    loadData();

    return () => {
      isMounted = false;
    };
  }, [session]);

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
      setGuestEmail(draft.guestEmail || "");
      setGuestAddress(draft.guestAddress || "");
      setGuestCity(draft.guestCity || "");
      setItems(draft.items || []);
      setDiscountType(draft.discountType || "none");
      setDiscountValue(draft.discountValue || 0);
      setValidUntil(draft.validUntil || "");

      toast.success("Draft restored");
    } catch (err) {
      console.error("[Draft Restore] Failed:", err);
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
      guestEmail,
      guestAddress,
      guestCity,
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
    guestEmail,
    guestAddress,
    guestCity,
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
    setItems((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  }

  function toggleLock(index) {
    setItems((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], locked: !copy[index].locked };
      return copy;
    });
  }

  function removeItem(index) {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }

  /* ---------------- GUEST CUSTOMER ---------------- */

  async function createGuestCustomer() {
    if (
      !guestName ||
      !guestPhone ||
      !guestEmail ||
      !guestAddress ||
      !guestCity
    ) {
      toast.error("Guest name, phone, email, address and city are required");
      return null;
    }

    if (!/^2547\d{8}$/.test(guestPhone)) {
      toast.error("Phone must be in format 2547XXXXXXXX");
      return null;
    }

    // check if phone already exists
    const { data: existingList, error: existingError } = await supabase
      .from("customers")
      .select("id, name, phone")
      .eq("phone", guestPhone);

    if (existingError) {
      console.error("[createGuestCustomer] existingError:", existingError);
      toast.error("Failed to validate guest phone");
      return null;
    }

    const existing = existingList?.[0];

    if (existing) {
      setCustomerId(existing.id);
      return existing.id;
    }

    // Insert new guest
    const { data, error } = await supabase
      .from("customers")
      .insert({
        name: guestName,
        phone: guestPhone,
        email: guestEmail,
        address: guestAddress,
        city: guestCity,
      })
      .select()
      .single();

    if (error) {
      console.error("[createGuestCustomer] insert error:", error);
      toast.error(`Failed to create guest: ${error.message}`);
      return null;
    }

    setCustomers((prev) => [...prev, data]);
    setCustomerId(data.id);

    toast.success("Guest customer created");

    return data.id;
  }

  /* ---------------- TOTALS ---------------- */

  const subtotal = useMemo(
    () =>
      items.reduce((sum, i) => sum + Number(i.quantity) * Number(i.price), 0),
    [items],
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
    try {
      let finalCustomerId = customerId;

      if (!finalCustomerId) {
        finalCustomerId = await createGuestCustomer();
        if (!finalCustomerId) return;
      }

      if (items.length === 0) {
        toast.error("Add at least one product");
        return;
      }

      const validUntilDate = new Date();
      validUntilDate.setDate(validUntilDate.getDate() + 30);

      // Supabase expects YYYY-MM-DD
      const validUntil30Days = validUntilDate.toISOString().split("T")[0];

      const payload = {
        customer_id: finalCustomerId,
        created_by: userId,
        order_type: "quote",
        status: "pending_verification",
        quote_status: "draft",
        valid_until: validUntil30Days || null,
        total,
        payment_status: "unpaid",
      };

      const { data: quote, error: quoteError } = await supabase
        .from("orders")
        .insert(payload)
        .select()
        .single();

      if (quoteError) {
        console.error("[saveQuote] Failed to insert quote:", quoteError);
        toast.error(`Failed to save quote: ${quoteError.message}`);
        return;
      }

      const orderItemsPayload = items.map((i) => ({
        order_id: quote.id,
        product_id: i.product_id,
        quantity: Number(i.quantity),
        price: Number(i.price),
      }));

      const { error: itemsError } = await supabase
        .from("order_items")
        .insert(orderItemsPayload);

      if (itemsError) {
        console.error("[saveQuote] Failed to insert order_items:", itemsError);
        toast.error(`Quote saved but items failed: ${itemsError.message}`);
        return;
      }

      toast.success("Quotation created");

      if (DRAFT_KEY) localStorage.removeItem(DRAFT_KEY);

      setItems([]);
      setCustomerId("");
      setGuestName("");
      setGuestPhone("");
      setGuestEmail("");
      setGuestAddress("");
      setGuestCity("");
      setDiscountType("none");
      setDiscountValue(0);
      setValidUntil("");
    } catch (err) {
      console.error("[saveQuote] UNHANDLED ERROR:", err);
      toast.error("Unexpected error while saving quotation");
    }
  }

  const filteredProducts = useMemo(() => {
    const list = products.filter((p) =>
      p.name.toLowerCase().includes(search.toLowerCase()),
    );
    return list.slice(0, visibleCount);
  }, [products, search, visibleCount]);

  /* ---------------- UI LOADING GUARD ---------------- */

  if (!session) {
    return (
      <div className="max-w-5xl mx-auto px-3 md:px-0 py-10 flex items-center justify-center">
        <div className="text-center space-y-2">
          <div className="w-10 h-10 border-4 border-gray-300 border-t-gray-800 rounded-full animate-spin mx-auto" />
          <p className="text-gray-500 text-sm">Loading session...</p>
        </div>
      </div>
    );
  }

  if (loadingData) {
    return (
      <div className="max-w-5xl mx-auto px-3 md:px-0 py-10 flex items-center justify-center">
        <div className="text-center space-y-2">
          <div className="w-10 h-10 border-4 border-gray-300 border-t-gray-800 rounded-full animate-spin mx-auto" />
          <p className="text-gray-500 text-sm">
            Loading products & customers...
          </p>
        </div>
      </div>
    );
  }

  /* ---------------- UI ---------------- */

  return (
    <div className="max-w-5xl mx-auto space-y-8 px-3 md:px-0">
      <h1 className="text-2xl font-bold">Create Quotation</h1>

      {/* CUSTOMER */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Customer</label>
        <select
          className="w-full border rounded-xl px-3 py-2 bg-white"
          value={customerId}
          onChange={(e) => setCustomerId(e.target.value)}
        >
          <option value="">Select customer</option>
          {customers.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
              {c.phone ? ` — ${c.phone}` : ""}
            </option>
          ))}
        </select>
      </div>

      {/* GUEST */}
      {!customerId && (
        <div className="border rounded-2xl p-4 space-y-3 bg-gray-50">
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
          <Input
            placeholder="Email address"
            value={guestEmail}
            onChange={(e) => setGuestEmail(e.target.value)}
          />

          <Input
            placeholder="Address"
            value={guestAddress}
            onChange={(e) => setGuestAddress(e.target.value)}
          />

          <Input
            placeholder="City"
            value={guestCity}
            onChange={(e) => setGuestCity(e.target.value)}
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
        {/* HEADER */}
        <div
          className="hidden md:grid grid-cols-[80px_1fr_110px_140px_90px] items-center gap-4 
    px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide"
        >
          <div></div>
          <div>Product</div>
          <div className="text-center">Qty</div>
          <div className="text-center">Unit Price</div>
          <div className="text-right">Actions</div>
        </div>

        {items.map((item, i) => (
          <div key={i}>
            {/* ===================== DESKTOP LAYOUT ===================== */}
            <div
              className="hidden md:grid grid-cols-[80px_1fr_140px_160px_90px] items-center gap-4 
      rounded-2xl border bg-white p-4 shadow-sm hover:shadow-md transition"
            >
              {/* IMAGE */}
              <div className="w-16 h-16 rounded-xl overflow-hidden border bg-gray-50 flex items-center justify-center">
                <img
                  src={item.image_url || "/placeholder.png"}
                  alt={item.name}
                  onError={(e) => {
                    e.currentTarget.src = "/placeholder.png";
                  }}
                  className="w-full h-full object-contain"
                />
              </div>

              {/* NAME + TOTAL */}
              <div className="space-y-1">
                <p className="font-semibold text-gray-900">{item.name}</p>
                <p className="text-sm text-gray-500">
                  Total:{" "}
                  <span className="font-semibold text-gray-900">
                    KES{" "}
                    {(
                      Number(item.price) * Number(item.quantity)
                    ).toLocaleString()}
                  </span>
                </p>
              </div>

              {/* QTY */}
              <div className="flex flex-col items-center">
                <div className="flex items-center bg-gray-50 border border-gray-200 rounded-xl overflow-hidden h-10">
                  <button
                    type="button"
                    className="w-10 h-10 flex items-center justify-center text-gray-600 hover:bg-gray-100 transition font-bold"
                    onClick={() =>
                      updateItem(
                        i,
                        "quantity",
                        Math.max(1, Number(item.quantity) - 1),
                      )
                    }
                  >
                    −
                  </button>

                  <input
                    type="text"
                    value={item.quantity}
                    readOnly
                    className="w-12 h-10 text-center bg-transparent outline-none font-semibold text-gray-900"
                  />

                  <button
                    type="button"
                    className="w-10 h-10 flex items-center justify-center text-gray-600 hover:bg-gray-100 transition font-bold"
                    onClick={() =>
                      updateItem(i, "quantity", Number(item.quantity) + 1)
                    }
                  >
                    +
                  </button>
                </div>
              </div>

              {/* PRICE */}
              <div className="flex flex-col items-center">
                <Input
                  type="number"
                  value={item.price}
                  disabled={item.locked}
                  onChange={(e) => updateItem(i, "price", e.target.value)}
                  className={`w-36 h-10 rounded-xl text-center font-semibold border-gray-200 transition
            focus:ring-2 focus:ring-blue-200 focus:border-blue-400
            ${
              item.locked
                ? "bg-gray-100 cursor-not-allowed opacity-70"
                : "bg-gray-50 focus:bg-white"
            }
          `}
                />
              </div>

              {/* ACTIONS */}
              <div className="flex items-center justify-end gap-2">
                <Button
                  variant="ghost"
                  className="rounded-full hover:bg-gray-100"
                  onClick={() => toggleLock(i)}
                >
                  {item.locked ? <Lock size={18} /> : <Unlock size={18} />}
                </Button>

                <Button
                  variant="ghost"
                  className="rounded-full hover:bg-red-50 hover:text-red-600"
                  onClick={() => removeItem(i)}
                >
                  <Trash2 size={18} />
                </Button>
              </div>
            </div>

            {/* ===================== MOBILE LAYOUT ===================== */}
            <div className="md:hidden rounded-2xl border bg-white p-4 shadow-sm space-y-4">
              {/* TOP ROW */}
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-xl overflow-hidden border bg-gray-50 flex items-center justify-center shrink-0">
                  <img
                    src={item.image_url || "/placeholder.png"}
                    alt={item.name}
                    onError={(e) => {
                      e.currentTarget.src = "/placeholder.png";
                    }}
                    className="w-full h-full object-contain"
                  />
                </div>

                <div className="flex-1 space-y-1">
                  <p className="font-semibold text-gray-900 leading-snug">
                    {item.name}
                  </p>

                  <p className="text-sm text-gray-500">
                    Total:{" "}
                    <span className="font-semibold text-gray-900">
                      KES{" "}
                      {(
                        Number(item.price) * Number(item.quantity)
                      ).toLocaleString()}
                    </span>
                  </p>
                </div>
              </div>

              {/* QTY + PRICE */}
              <div className="grid grid-cols-2 gap-3">
                {/* QTY */}
                <div className="flex flex-col">
                  <label className="text-xs text-gray-500 mb-1">Qty</label>

                  <div className="flex items-center bg-gray-50 border border-gray-200 rounded-xl overflow-hidden h-10 justify-between">
                    <button
                      type="button"
                      className="w-10 h-10 flex items-center justify-center text-gray-600 hover:bg-gray-100 transition font-bold"
                      onClick={() =>
                        updateItem(
                          i,
                          "quantity",
                          Math.max(1, Number(item.quantity) - 1),
                        )
                      }
                    >
                      −
                    </button>

                    <input
                      type="text"
                      value={item.quantity}
                      readOnly
                      className="w-full h-10 text-center bg-transparent outline-none font-semibold text-gray-900"
                    />

                    <button
                      type="button"
                      className="w-10 h-10 flex items-center justify-center text-gray-600 hover:bg-gray-100 transition font-bold"
                      onClick={() =>
                        updateItem(i, "quantity", Number(item.quantity) + 1)
                      }
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* PRICE */}
                <div className="flex flex-col">
                  <label className="text-xs text-gray-500 mb-1">
                    Unit Price
                  </label>

                  <Input
                    type="number"
                    value={item.price}
                    disabled={item.locked}
                    onChange={(e) => updateItem(i, "price", e.target.value)}
                    className={`w-full h-10 rounded-xl text-center font-semibold border-gray-200 transition
              focus:ring-2 focus:ring-blue-200 focus:border-blue-400
              ${
                item.locked
                  ? "bg-gray-100 cursor-not-allowed opacity-70"
                  : "bg-gray-50 focus:bg-white"
              }
            `}
                  />
                </div>
              </div>

              {/* ACTIONS */}
              <div className="flex justify-end gap-2">
                <Button
                  variant="ghost"
                  className="rounded-full hover:bg-gray-100"
                  onClick={() => toggleLock(i)}
                >
                  {item.locked ? <Lock size={18} /> : <Unlock size={18} />}
                </Button>

                <Button
                  variant="ghost"
                  className="rounded-full hover:bg-red-50 hover:text-red-600"
                  onClick={() => removeItem(i)}
                >
                  <Trash2 size={18} />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* TOTALS */}
      <div className="border rounded-2xl p-4 bg-gray-50">
        <p className="text-gray-700">Subtotal: {subtotal.toFixed(2)}</p>
        <p className="text-xl font-bold text-gray-900">
          Total: {total.toFixed(2)}
        </p>
      </div>

      <Button size="lg" className="w-full md:w-auto" onClick={saveQuote}>
        Save Quotation
      </Button>
    </div>
  );
}
