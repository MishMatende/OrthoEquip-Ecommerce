// src/context/cartContext.jsx
import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { UserAuth } from "./AuthContext";
import toast from "react-hot-toast";

const CartContext = createContext();

export function CartProvider({ children }) {
  const auth = UserAuth();
  const session = auth?.session;
  const loadingAuth = auth?.loadingAuth;

  const [cart, setCart] = useState([]);
  const [cartId, setCartId] = useState(null);
  const [loadingItemId, setLoadingItemId] = useState(null);
  const [creatingCart, setCreatingCart] = useState(false);

  useEffect(() => {
    if (loadingAuth === true) return;

    if (session) {
      fetchOrCreateCart().catch((e) => console.error(e));
    } else {
      const localCart = JSON.parse(localStorage.getItem("cart") || "[]");
      setCart(localCart);
      setCartId(null);
    }
  }, [session, loadingAuth]);

  async function fetchOrCreateCart() {
    if (!session?.user?.id) return null;

    if (creatingCart) return cartId;

    setCreatingCart(true);

    try {
      const { data: cartRow, error: cartError } = await supabase
        .from("carts")
        .upsert({ user_id: session.user.id }, { onConflict: "user_id" })
        .select("id")
        .single();

      if (cartError) throw cartError;

      const id = cartRow.id;

      setCartId(id);

      // 2️⃣ Fetch existing server items
      const { data: serverItems, error: itemsError } = await supabase
        .from("cart_items")
        .select("*, products(name, image_url, price, brand)")
        .eq("cart_id", id);

      if (itemsError) throw itemsError;

      // 3️⃣ Load anonymous cart
      const anonCart = JSON.parse(localStorage.getItem("cart") || "[]");

      if (anonCart.length > 0) {
        const serverMap = new Map();

        (serverItems || []).forEach((item) => {
          serverMap.set(item.product_id, item);
        });

        for (const anonItem of anonCart) {
          const existing = serverMap.get(anonItem.product_id);

          if (existing) {
            await supabase
              .from("cart_items")
              .update({
                quantity: existing.quantity + anonItem.quantity,
              })
              .eq("id", existing.id);
          } else {
            await supabase.from("cart_items").insert({
              cart_id: id,
              product_id: anonItem.product_id,
              quantity: anonItem.quantity,
              price_at_add: anonItem.product?.price ?? null,
            });
          }
        }

        // 4️⃣ Clear local cart AFTER merge
        localStorage.removeItem("cart");
      }

      // 5️⃣ Reload updated cart
      const { data: refreshedItems, error: refreshedError } = await supabase
        .from("cart_items")
        .select("*, products(name, image_url, price, brand)")
        .eq("cart_id", id);

      if (refreshedError) throw refreshedError;

      setCart(refreshedItems || []);

      return id;
    } catch (err) {
      console.error("Error fetching/creating cart:", err);
      return null;
    } finally {
      setCreatingCart(false);
    }
  }

  // ---------------------------
  // Add to cart
  // ---------------------------
  async function addToCart(product, quantity = 1) {
    if (!session) {
      const localCart = JSON.parse(localStorage.getItem("cart") || "[]");
      const existing = localCart.find((i) => i.product_id === product.id);

      if (existing) existing.quantity += quantity;
      else localCart.push({ product_id: product.id, quantity, product });

      localStorage.setItem("cart", JSON.stringify(localCart));
      setCart(localCart);
      toast.success("Added to cart!", { position: "top-right" });
      return;
    }

    let id = cartId;
    if (!id) {
      id = await fetchOrCreateCart();
      if (!id) {
        toast.error("Could not create cart. Try again.");
        return;
      }
    }

    const { data: existingItem, error: existingError } = await supabase
      .from("cart_items")
      .select("id, quantity")
      .eq("cart_id", id)
      .eq("product_id", product.id)
      .maybeSingle();

    if (existingError)
      console.error("Error checking existing cart item:", existingError);

    if (existingItem) {
      const { error } = await supabase
        .from("cart_items")
        .update({ quantity: existingItem.quantity + quantity })
        .eq("id", existingItem.id);
      if (error) console.error("Error updating cart:", error);
    } else {
      const { error } = await supabase.from("cart_items").insert({
        cart_id: id,
        product_id: product.id,
        quantity,
        price_at_add: product.price,
      });
      if (error) console.error("Error inserting item:", error);
    }

    await fetchOrCreateCart();
    toast.success("Added to cart!", { position: "top-right" });
  }

  // ---------------------------
  // Remove from cart
  // ---------------------------
  async function removeFromCart(itemId) {
    setLoadingItemId(itemId);
    if (!session) {
      const localCart = cart.filter((item) => item.product_id !== itemId);
      localStorage.setItem("cart", JSON.stringify(localCart));
      setCart(localCart);
      setLoadingItemId(null);
      return;
    }

    await supabase.from("cart_items").delete().eq("id", itemId);
    await fetchOrCreateCart();
    setLoadingItemId(null);
  }

  // ---------------------------
  // Update quantity
  // ---------------------------
  async function updateQuantity(itemId, newQuantity) {
    if (newQuantity <= 0) {
      await removeFromCart(itemId);
      return;
    }

    if (!session) {
      const updatedCart = cart.map((item) =>
        item.product_id === itemId ? { ...item, quantity: newQuantity } : item,
      );
      setCart(updatedCart);
      localStorage.setItem("cart", JSON.stringify(updatedCart));
      return;
    }

    setLoadingItemId(itemId);
    const { error } = await supabase
      .from("cart_items")
      .update({ quantity: newQuantity })
      .eq("id", itemId);
    if (error) console.error("Error updating quantity:", error);
    await fetchOrCreateCart();
    setLoadingItemId(null);
  }

  // ---------------------------
  // Clear cart (local + server)
  // ---------------------------
  async function clearCart() {
    try {
      // clear local anonymous cart
      try {
        localStorage.removeItem("cart");
      } catch (e) {
        console.warn("Couldn't remove local cart:", e);
      }

      if (session && cartId) {
        // delete items server-side for the user's cart
        const { error } = await supabase
          .from("cart_items")
          .delete()
          .eq("cart_id", cartId);
        if (error) console.error("Error clearing server cart:", error);
      }

      // reset client state
      setCart([]);
      setCartId(null);
    } catch (err) {
      console.error("clearCart failed:", err);
    }
  }

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart, // <-- exposed so other parts can call it on sign out
        cartCount: cart.length,
        loadingItemId,
        cartId,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}
