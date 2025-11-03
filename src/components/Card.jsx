import React from "react";

export default function Card({ product }) {
  return (
    <div className="bg-white p-4 rounded-md shadow-sm hover:shadow-md transition">
      <div className="relative">
        {/* Discount Tag */}
        {/* {product.discount && (
          <span className="absolute top-2 right-2 bg-emerald-700 text-white text-xs font-semibold px-2 py-1 rounded-sm">
            -{product.discount}%
          </span>
        )} */}

        <img
          src={
            product.image_url ||
            "https://images.unsplash.com/photo-1584367360396-25b0d7c4b9a0?auto=format&fit=crop&w=300&q=80"
          }
          alt={product.name || "Product image"}
          className="w-full h-48 object-contain bg-gray-50"
        />
      </div>

      <div className="mt-4">
        <h3 className="font-semibold text-gray-900 text-sm mb-1 text-left truncate">
          {product.name || "Unnamed Product"}
        </h3>

        <div className="flex items-center space-x-2">
          <span className="text-gray-900 font-bold">
            KES {product.price ? product.price.toLocaleString() : "N/A"}
          </span>
        </div>
      </div>
    </div>
  );
}
