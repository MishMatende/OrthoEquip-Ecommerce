import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../supabaseClient";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Plus, Trash2, Lock, Unlock } from "lucide-react";
import { toast } from "sonner";

export default function CreateQuote() {
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");

  const [items, setItems] = useState([]);
  const [customerId, setCustomerId] = useState("");

  // Guest
  const [guestName, setGuestName] = useState("");
  const [guestPhone, setGuestPhone] = useState("");

  // Pricing
  const [discountType, setDiscountType] = useState("none"); // none | flat | percent
  const [discountValue, setDiscountValue] = useState(0);
  const [taxRate, setTaxRate] = useState(0);

  const [validUntil, setValidUntil] = useState("");
  const PRODUCT_LIMIT = 10;

  const [visibleCount, setVisibleCount] = useState(PRODUCT_LIMIT);

  /* ---------------- FETCH DATA ---------------- */

  useEffect(() => {
    fetchCustomers();
    fetchProducts();
  }, []);

  async function fetchCustomers() {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, username, email, phone, role")
      .eq("role", "customer")
      .order("email");

    console.log("CUSTOMERS:", data, error);

    if (error) {
      console.error("Failed to fetch customers:", error);
      return;
    }

    setCustomers(data || []);
  }

  async function fetchProducts() {
    const { data, error } = await supabase
      .from("products")
      .select("id, name, price")
      .order("name");

    console.log("PRODUCTS:", data, error);

    if (error) {
      console.error("Product fetch error:", error);
      return;
    }

    setProducts(data || []);
  }

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
        phone: guestPhone,
        full_name: guestName,
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

  const taxAmount = useMemo(
    () => ((subtotal - discountAmount) * Number(taxRate)) / 100,
    [subtotal, discountAmount, taxRate]
  );

  const total = subtotal - discountAmount + taxAmount;

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
  }

  const filteredProducts = useMemo(() => {
    const list = products.filter((p) =>
      p.name.toLowerCase().includes(search.toLowerCase())
    );

    // If searching, reset visible count
    if (search.trim()) {
      return list.slice(0, PRODUCT_LIMIT);
    }

    return list.slice(0, visibleCount);
  }, [products, search, visibleCount]);

  /* ---------------- UI ---------------- */

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Create Quotation</h1>

      {/* CUSTOMER */}
      <select
        className="w-full border p-2 rounded"
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

      {/* GUEST */}
      {!customerId && (
        <div className="border p-4 rounded space-y-2">
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

      {/* ITEMS */}
      {items.map((item, i) => (
        <div key={i} className="flex gap-2 items-center">
          <span className="flex-1">{item.name}</span>

          <Input
            type="number"
            value={item.quantity}
            onChange={(e) => updateItem(i, "quantity", e.target.value)}
            className="w-20"
          />

          <Input
            type="number"
            disabled={item.locked}
            value={item.price}
            onChange={(e) => updateItem(i, "price", e.target.value)}
            className="w-24"
          />

          <Button variant="ghost" onClick={() => toggleLock(i)}>
            {item.locked ? <Lock size={16} /> : <Unlock size={16} />}
          </Button>

          <Button variant="ghost" onClick={() => removeItem(i)}>
            <Trash2 size={16} />
          </Button>
        </div>
      ))}

      {/* PRICING */}
      <div className="border p-4 rounded space-y-2">
        <p>Subtotal: {subtotal.toFixed(2)}</p>

        <div className="flex gap-2">
          <select
            className="border p-2 rounded"
            value={discountType}
            onChange={(e) => setDiscountType(e.target.value)}
          >
            <option value="none">No discount</option>
            <option value="flat">Flat</option>
            <option value="percent">Percent</option>
          </select>

          {discountType !== "none" && (
            <Input
              type="number"
              value={discountValue}
              onChange={(e) => setDiscountValue(e.target.value)}
            />
          )}
        </div>

        <Input
          type="number"
          placeholder="Tax %"
          value={taxRate}
          onChange={(e) => setTaxRate(e.target.value)}
        />

        <p className="font-bold">Total: {total.toFixed(2)}</p>
      </div>

      <Button onClick={saveQuote}>Save Quote</Button>
    </div>
  );
}
