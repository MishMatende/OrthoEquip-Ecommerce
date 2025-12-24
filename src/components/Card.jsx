import React, { useState } from "react";
import { ShoppingCart, Check } from "lucide-react";
import { useCart } from "../context/CartContext";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

export default function Card({ product }) {
  const { addToCart } = useCart();
  const navigate = useNavigate();
  const [added, setAdded] = useState(false);

  const isOutOfStock = product.stock === 0;

  const handleNavigate = () => {
    navigate(`/shop/${product.id}`);
  };

  const handleKeyNavigate = (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleNavigate();
    }
  };

  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (isOutOfStock) {
      toast.error("This product is out of stock");
      return;
    }

    // Optimistic UI
    addToCart(product, 1);
    setAdded(true);

    toast.success(`${product.name} added to cart 🛒`, {
      position: "top-right",
      duration: 2000,
    });

    // Reset icon after animation
    setTimeout(() => setAdded(false), 1200);
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 flex flex-col h-[360px] justify-between">
      {/* Clickable product area */}
      <div
        role="button"
        tabIndex={0}
        onClick={handleNavigate}
        onKeyDown={handleKeyNavigate}
        className="cursor-pointer focus:outline-none rounded-t-2xl"
        aria-label={`View details for ${product.name}`}
      >
        {/* Image */}
        <div className="bg-gray-50 rounded-t-2xl flex items-center justify-center h-[230px] overflow-hidden relative">
          <img
            src={
              product.image_url ||
              "https://images.unsplash.com/photo-1584367360396-25b0d7c4b9a0?auto=format&fit=crop&w=300&q=80"
            }
            alt={product.name || "Product image"}
            className="object-contain max-h-full max-w-full transition-transform duration-300 hover:scale-110"
            loading="lazy"
          />

          {isOutOfStock && (
            <span className="absolute top-3 right-3 bg-red-500 text-white text-xs px-2 py-1 rounded-full">
              Out of stock
            </span>
          )}
        </div>

        {/* Name */}
        <div className="p-3 pb-0">
          <h3 className="font-semibold text-gray-900 text-sm md:text-base leading-snug line-clamp-2">
            {product.name || "Unnamed Product"}
          </h3>
        </div>
      </div>

      {/* Price + Cart */}
      <div className="p-3 pt-2 flex items-center justify-between">
        <span className="text-gray-900 font-bold text-sm md:text-base">
          KES {product.price ? product.price.toLocaleString() : "N/A"}
        </span>

        <button
          type="button"
          onClick={handleAddToCart}
          disabled={isOutOfStock}
          className={`p-2 rounded-full transition-all duration-200
            ${
              isOutOfStock
                ? "cursor-not-allowed opacity-50"
                : "hover:bg-gray-100 active:scale-90"
            }
          `}
          title={isOutOfStock ? "Out of stock" : "Add to Cart"}
          aria-label="Add to cart"
        >
          {added ? (
            <Check size={20} className="text-green-600 animate-scale-in" />
          ) : (
            <ShoppingCart
              size={20}
              className="text-gray-700 hover:text-[#4eb0e3]"
            />
          )}
        </button>
      </div>
    </div>
  );
}
