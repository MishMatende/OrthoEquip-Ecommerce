// src/pages/ProductDetails.jsx
import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "../../supabaseClient"; // import your Supabase client
import { Button } from "../../components/ui/button";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "../../components/ui/tabs";
import { Loader2, Minus, Plus } from "lucide-react";
import { useCart } from "../../context/CartContext";
import { useNavigate } from "react-router-dom";
import { useProduct } from "../../hooks/useProduct";

export default function ProductDetails() {
  const { addToCart } = useCart();

  const { id } = useParams(); // product id from URL
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(null);
  const [zoom, setZoom] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 50, y: 50 });
  const navigate = useNavigate();

  const { data, isLoading, isError, error, isFetching } = useProduct(id);

  const product = data?.product;
  const images = data?.images || [];

  if (isLoading) {
    return (
      <div className="flex flex-row justify-center py-20 text-gray-500">
        <Loader2 className="w-6 h-6 animate-spin mr-3" />
        Loading product details...
      </div>
    );
  }

  if (isError) {
    return (
      <div className="text-center py-20 text-red-600">
        Failed to load product: {error?.message}
      </div>
    );
  }

  if (!product) {
    return (
      <div className="text-center py-20 text-gray-500">
        Product not found 😕
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-24 py-8 text-center">
      {/* Top Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        {/* Left: Images */}
        <div>
          {/* Main Image with Zoom */}
          <div className="relative border rounded-2xl overflow-hidden mb-2 bg-gray-50">
            {/* Zoomable image */}
            <div
              onClick={() => setZoom((z) => !z)}
              onMouseMove={(e) => {
                const { left, top, width, height } =
                  e.currentTarget.getBoundingClientRect();
                const x = ((e.pageX - left) / width) * 100;
                const y = ((e.pageY - top) / height) * 100;
                setMousePosition({ x, y });
              }}
              className={`relative overflow-hidden transition-all duration-300 ${
                zoom ? "cursor-zoom-out" : "cursor-zoom-in"
              }`}
            >
              <img
                src={
                  selectedImage ||
                  product.image_url ||
                  "https://images.unsplash.com/photo-1584367360396-25b0d7c4b9a0?auto=format&fit=crop&w=600&q=80"
                }
                alt={product.name}
                className={`w-full h-[400px] object-contain transition-transform duration-300 ease-in-out ${
                  zoom ? "scale-150" : "scale-100"
                }`}
                style={{
                  transformOrigin: `${mousePosition.x}% ${mousePosition.y}%`,
                }}
              />
            </div>
          </div>

          {/* Click instruction text */}
          <p className="text-md text-gray-500 mt-2 italic pb-2">
            {zoom ? "Click image to zoom out" : "Click image to zoom in"}
          </p>

          {/* Thumbnail Gallery */}
          <div className="flex gap-3 overflow-x-auto pb-2">
            {(images.length > 0 ? images : [product.image_url])
              .filter(Boolean)
              .map((url, idx) => (
                <img
                  key={idx}
                  src={url}
                  onClick={() => setSelectedImage(url)}
                  className={`w-20 h-20 object-cover rounded-xl border-2 cursor-pointer transition-transform hover:scale-105 ${
                    selectedImage === url
                      ? "border-[#4eb0e3]"
                      : "border-transparent hover:border-gray-300"
                  }`}
                  alt={`Product ${idx + 1}`}
                />
              ))}
          </div>
        </div>

        {/* Right: Product info */}
        <div className="text-left">
          <h1 className="text-xl sm:text-2xl font-semibold text-gray-800 mb-2">
            {product.name}
          </h1>

          <div className="flex items-center gap-3 mt-3">
            <p className="text-2xl sm:text-3xl font-bold text-[#4eb0e3]">
              KES {Number(product.price).toLocaleString()}
            </p>
            {/* {product.old_price && (
              <p className="text-xl text-gray-400 line-through">
                KES {Number(product.old_price).toLocaleString()}
              </p>
            )}
            {product.discount && (
              <span className="text-sm bg-[#4eb0e3] text-green-600 font-semibold px-2 py-1 rounded">
                Save -{product.discount}%
              </span>
            )} */}
          </div>

          <p className="text-sm text-gray-600 mt-4 leading-relaxed">
            {product.description || "No description available."}
          </p>

          <div className="mt-6 space-y-2 text-sm">
            {product.category && (
              <p>
                <span className="font-semibold text-gray-700">Category:</span>{" "}
                {product.category}
              </p>
            )}
            {product.brand && (
              <p>
                <span className="font-semibold text-gray-700">Brand:</span>{" "}
                {product.brand}
              </p>
            )}
            {product.stock !== undefined && (
              <p>
                <span className="font-semibold text-gray-700">Stock:</span>{" "}
                {product.stock > 0
                  ? `${product.stock} available`
                  : "Out of stock"}
              </p>
            )}
          </div>

          {/* Quantity + Buttons */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 mt-6 w-full">
            {/* Quantity Selector */}
            <div className="flex items-center justify-between sm:justify-start border rounded-xl w-full sm:w-auto">
              <button
                className="p-2 hover:bg-gray-100 cursor-pointer"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                disabled={quantity <= 1}
              >
                <Minus size={16} />
              </button>
              <span className="px-4 text-gray-700">{quantity}</span>
              <button
                className={`p-2 hover:bg-gray-100 cursor-pointer ${
                  quantity >= product.stock
                    ? "opacity-50 cursor-not-allowed"
                    : ""
                }`}
                onClick={() =>
                  setQuantity((prev) =>
                    prev < product.stock ? prev + 1 : prev
                  )
                }
                disabled={quantity >= product.stock}
              >
                <Plus size={16} />
              </button>
            </div>

            {/* Add to Cart */}
            <Button
              onClick={() => {
                const safeQuantity = Math.min(quantity, product.stock);
                addToCart(product, safeQuantity);
              }}
              className="bg-[#4eb0e3] hover:bg-[#3ca0d4] rounded-xl w-full sm:w-auto px-6 py-3 text-white font-semibold"
              disabled={product.stock <= 0}
            >
              {product.stock <= 0 ? "Out of Stock" : "Add to Cart"}
            </Button>

            {/* Buy it now */}
            <Button
              variant="outline"
              className={`rounded-xl w-full sm:w-auto px-6 py-3 font-semibold ${
                product.stock <= 0
                  ? "opacity-50 cursor-not-allowed"
                  : "cursor-pointer hover:bg-gray-100"
              }`}
              disabled={product.stock <= 0}
              onClick={() =>
                navigate("/checkout", {
                  state: {
                    buyNow: true,
                    product: {
                      id: product.id,
                      name: product.name,
                      price: product.price,
                      image_url: product.image_url,
                    },
                    quantity,
                  },
                })
              }
            >
              {product.stock <= 0 ? "Out of Stock" : "Buy it now"}
            </Button>
          </div>
        </div>
      </div>

      {/* Tabs Section */}
      <div className="mt-10 text-left">
        <Tabs defaultValue="description">
          <TabsList className="border-b flex gap-6">
            <TabsTrigger value="description">Description</TabsTrigger>
            <TabsTrigger value="reviews">Reviews</TabsTrigger>
            <TabsTrigger value="shipping">Shipping Policy</TabsTrigger>
          </TabsList>

          <TabsContent
            value="description"
            className="pt-6 text-gray-600 text-sm leading-relaxed"
          >
            {product.description || "No description available."}
          </TabsContent>

          <TabsContent value="reviews" className="pt-6 text-gray-600 text-sm">
            No reviews yet.
          </TabsContent>

          <TabsContent value="shipping" className="pt-6 text-gray-600 text-sm">
            Fast delivery. Orders are processed within the same day.
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
