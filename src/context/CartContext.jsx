import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { UserAuth } from "./AuthContext";
import { toast } from "sonner";

const CartContext = createContext();

export function CartProvider({ children }) {
  const { session, loadingAuth } = UserAuth(); // 🆕 include loadingAuth
  const [cart, setCart] = useState([]);
  const [cartId, setCartId] = useState(null);
  const [loadingItemId, setLoadingItemId] = useState(null);

  useEffect(() => {
    // 🧠 Only run after AuthContext is done loading
    if (loadingAuth) return;

    if (session) {
      fetchOrCreateCart();
    } else {
      const localCart = JSON.parse(localStorage.getItem("cart") || "[]");
      setCart(localCart);
    }
  }, [session, loadingAuth]);

  async function fetchOrCreateCart() {
    if (!session?.user?.id) return; // 🧱 avoid early calls

    try {
      const { data: carts, error: fetchError } = await supabase
        .from("carts")
        .select("id")
        .eq("user_id", session.user.id);

      if (fetchError) throw fetchError;

      let id;
      if (!carts || carts.length === 0) {
        const { data: newCart, error: insertError } = await supabase
          .from("carts")
          .insert({ user_id: session.user.id })
          .select("id")
          .single();
        if (insertError) throw insertError;
        id = newCart.id;
      } else {
        id = carts[0].id;
      }

      setCartId(id);

      const { data: items, error: itemsError } = await supabase
        .from("cart_items")
        .select("*, products(name, image_url, price, brand)")
        .eq("cart_id", id);

      if (itemsError) throw itemsError;
      setCart(items || []);
    } catch (err) {
      console.error("Error fetching/creating cart:", err);
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
      toast.success("Added to cart!", {
        position: "top-right",
      });
      return;
    }

    let id = cartId;
    if (!id) {
      await fetchOrCreateCart();
      id = cartId;
    }

    const { data: existingItem } = await supabase
      .from("cart_items")
      .select("id, quantity")
      .eq("cart_id", id)
      .eq("product_id", product.id)
      .maybeSingle();

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
    toast.success("Added to cart!", {
      position: "top-right",
    });
  }

  // ---------------------------
  // Remove from cart (with loading)
  // ---------------------------
  async function removeFromCart(itemId) {
    setLoadingItemId(itemId); // 🆕 show loading animation
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
  // Increase / Decrease Quantity
  // ---------------------------
  async function updateQuantity(itemId, newQuantity) {
    if (newQuantity <= 0) {
      await removeFromCart(itemId);
      return;
    }

    if (!session) {
      const updatedCart = cart.map((item) =>
        item.product_id === itemId ? { ...item, quantity: newQuantity } : item
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
  // Context return
  // ---------------------------
  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
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
