import React from "react";
import { ShoppingCart } from "lucide-react";
import { useCart } from "../context/CartContext";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

export default function Card({ product }) {
  const { addToCart } = useCart();
  const navigate = useNavigate();

  const handleCardClick = () => {
    navigate(`/shop/${product.id}`); // ✅ Navigate to product details
  };

  const handleAddToCart = (e) => {
    e.stopPropagation(); // ✅ Prevent triggering navigation
    addToCart(product, 1);
    toast.success(`${product.name} added to cart 🛒`, {
      position: "top-right",
      duration: 2000,
    });
  };

  return (
    <div
      onClick={handleCardClick}
      className="bg-white rounded-2xl shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-pointer flex flex-col h-[360px]"
    >
      {/* Image Section */}
      <div className="bg-gray-50 rounded-t-2xl flex items-center justify-center h-[230px] overflow-hidden">
        <img
          src={
            product.image_url ||
            "https://images.unsplash.com/photo-1584367360396-25b0d7c4b9a0?auto=format&fit=crop&w=300&q=80"
          }
          alt={product.name || "Product image"}
          className="object-contain max-h-full max-w-full transition-transform duration-300 hover:scale-110"
          loading="lazy"
        />
      </div>

      {/* Info Section */}
      <div className="p-3 flex-1 flex flex-col justify-between text-left">
        <h3 className="font-semibold text-gray-900 text-sm md:text-base leading-snug line-clamp-2">
          {product.name || "Unnamed Product"}
        </h3>

        {/* Price + Cart Icon */}
        <div className="flex items-center justify-between mt-2">
          <span className="text-gray-900 font-bold text-sm md:text-base">
            KES {product.price ? product.price.toLocaleString() : "N/A"}
          </span>

          {/* Cart Icon Button */}
          <button
            onClick={handleAddToCart}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors duration-200 cursor-pointer"
            title="Add to Cart"
          >
            <ShoppingCart
              size={20}
              className="text-gray-700 hover:text-[#4eb0e3]"
            />
          </button>
        </div>
      </div>
    </div>
  );
}
