// src/pages/ProductDetails.jsx
import React, { useState } from "react";
import { useParams } from "react-router-dom";
import { products } from "../../data/products";
import { Button } from "../../components/ui/button";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "../../components/ui/tabs";
import { Minus, Plus } from "lucide-react";

export default function ProductDetails() {
  const { id } = useParams();
  const product = products.find((p) => p.id === Number(id));
  const [selectedColor, setSelectedColor] = useState(product?.colors?.[0]);
  const [quantity, setQuantity] = useState(1);

  if (!product) {
    return (
      <div className="text-center py-20 text-gray-500">
        Product not found 😕
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto py-10">
      {/* Top Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        {/* Left: Images */}
        <div>
          <div className="border rounded-2xl overflow-hidden">
            <img
              src={selectedColor}
              alt={product.name}
              className="w-full object-contain"
            />
          </div>

          {/* Thumbnails */}
          <div className="flex gap-3 mt-4">
            {product.colors.map((color, i) => (
              <button
                key={i}
                onClick={() => setSelectedColor(color)}
                className={`border rounded-xl p-1 w-20 h-20 flex items-center justify-center ${
                  selectedColor === color
                    ? "border-green-500"
                    : "border-gray-200"
                }`}
              >
                <img
                  src={color}
                  alt={`color ${i}`}
                  className="object-contain w-full h-full"
                />
              </button>
            ))}
          </div>
        </div>

        {/* Right: Product info */}
        <div>
          <h1 className="text-lg font-semibold text-gray-800">
            {product.name}
          </h1>

          <div className="flex items-center gap-3 mt-3">
            <p className="text-3xl font-bold text-green-600">
              ${product.price.toFixed(2)}
            </p>
            {product.oldPrice && (
              <p className="text-xl text-gray-400 line-through">
                ${product.oldPrice.toFixed(2)}
              </p>
            )}
            {product.discount && (
              <span className="text-sm bg-green-100 text-green-600 font-semibold px-2 py-1 rounded">
                Save -{product.discount}%
              </span>
            )}
          </div>

          <p className="text-sm text-gray-600 mt-4 leading-relaxed">
            {product.description}
          </p>

          <div className="mt-6 space-y-2 text-sm">
            <p>
              <span className="font-semibold text-gray-700">SKU:</span>{" "}
              {product.sku}
            </p>
            <p>
              <span className="font-semibold text-gray-700">Vendor:</span>{" "}
              {product.vendor}
            </p>
            <p>
              <span className="font-semibold text-gray-700">Type:</span>{" "}
              {product.type}
            </p>
          </div>

          {/* Quantity + Buttons */}
          <div className="flex items-center gap-4 mt-6">
            <div className="flex items-center border rounded-xl">
              <button
                className="p-2 hover:bg-gray-100"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
              >
                <Minus size={16} />
              </button>
              <span className="px-4 text-gray-700">{quantity}</span>
              <button
                className="p-2 hover:bg-gray-100"
                onClick={() => setQuantity(quantity + 1)}
              >
                <Plus size={16} />
              </button>
            </div>
            <Button className="bg-green-600 hover:bg-green-700 rounded-xl px-6">
              Add to Cart
            </Button>
            <Button variant="outline" className="rounded-xl px-6">
              Buy it now
            </Button>
          </div>
        </div>
      </div>

      {/* Tabs Section */}
      <div className="mt-10">
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
            {product.description}
          </TabsContent>
          <TabsContent value="reviews" className="pt-6 text-gray-600 text-sm">
            No reviews yet.
          </TabsContent>
          <TabsContent value="shipping" className="pt-6 text-gray-600 text-sm">
            Free worldwide shipping. Orders are processed within 1–2 business
            days.
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
