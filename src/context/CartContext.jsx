import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { UserAuth } from "./AuthContext";

const CartContext = createContext();

export function CartProvider({ children }) {
  const { session } = UserAuth();
  const [cart, setCart] = useState([]);
  const [cartId, setCartId] = useState(null);

  // ---------------------------
  // Load or create cart on login
  // ---------------------------
  useEffect(() => {
    if (session) {
      fetchOrCreateCart();
    } else {
      const localCart = JSON.parse(localStorage.getItem("cart") || "[]");
      setCart(localCart);
    }
  }, [session]);

  // ---------------------------
  // Fetch or create user cart
  // ---------------------------
  async function fetchOrCreateCart() {
    try {
      // Try to fetch existing cart
      const { data: carts, error: fetchError } = await supabase
        .from("carts")
        .select("id")
        .eq("user_id", session.user.id);

      if (fetchError) throw fetchError;

      let id;
      if (!carts || carts.length === 0) {
        // No cart — create one
        const { data: newCart, error: insertError } = await supabase
          .from("carts")
          .insert({ user_id: session.user.id })
          .select("id")
          .single();
        if (insertError) throw insertError;
        id = newCart.id;
      } else {
        // Use first cart
        id = carts[0].id;
      }

      setCartId(id);

      // Fetch items for this cart
      const { data: items, error: itemsError } = await supabase
        .from("cart_items")
        .select("*, products(name, image_url, price)")
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
      // Local cart for guests
      const localCart = JSON.parse(localStorage.getItem("cart") || "[]");
      const existing = localCart.find((i) => i.product_id === product.id);

      if (existing) existing.quantity += quantity;
      else localCart.push({ product_id: product.id, quantity, product });

      localStorage.setItem("cart", JSON.stringify(localCart));
      setCart(localCart);
      alert("Added to cart!");
      return;
    }

    // Ensure cart exists
    let id = cartId;
    if (!id) {
      await fetchOrCreateCart();
      id = cartId;
    }

    // Check if item already exists in cart
    const { data: existingItem } = await supabase
      .from("cart_items")
      .select("id, quantity")
      .eq("cart_id", id)
      .eq("product_id", product.id)
      .maybeSingle();

    if (existingItem) {
      // Increment quantity
      const { error } = await supabase
        .from("cart_items")
        .update({ quantity: existingItem.quantity + quantity })
        .eq("id", existingItem.id);
      if (error) console.error("Error updating cart:", error);
    } else {
      // Insert new item
      const { error } = await supabase.from("cart_items").insert({
        cart_id: id,
        product_id: product.id,
        quantity,
        price_at_add: product.price,
      });
      if (error) console.error("Error inserting item:", error);
    }

    await fetchOrCreateCart(); // refresh UI
    alert("Added to cart!");
  }

  // ---------------------------
  // Remove from cart
  // ---------------------------
  async function removeFromCart(itemId) {
    if (!session) {
      const localCart = cart.filter((item) => item.product_id !== itemId);
      localStorage.setItem("cart", JSON.stringify(localCart));
      setCart(localCart);
      return;
    }

    await supabase.from("cart_items").delete().eq("id", itemId);
    fetchOrCreateCart();
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
        cartCount: cart.length,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}
