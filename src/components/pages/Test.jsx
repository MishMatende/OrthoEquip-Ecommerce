// src/pages/ProductDetails.jsx
import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Loader2, Minus, Plus, X } from "lucide-react";

import { Button } from "../../components/ui/button";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "../../components/ui/tabs";

import { useCart } from "../../context/CartContext";
import { UserAuth } from "../../context/AuthContext";
import { useProduct } from "../../hooks/useProduct";
import WhatsAppChat from "../../components/WhatsAppChat";
import { supabase } from "../../supabaseClient";

export default function ProductDetails() {
  const { session } = UserAuth();
  const { addToCart } = useCart();
  const navigate = useNavigate();
  const { id } = useParams();

  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(null);
  const [zoom, setZoom] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 50, y: 50 });
  const [naturalSize, setNaturalSize] = useState({ w: 0, h: 0 });
  const [displayWidth, setDisplayWidth] = useState(0);

  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalImageSrc, setModalImageSrc] = useState(null);
  const modalRef = useRef(null);
  const imageRef = useRef(null);

  const { data, isLoading, isError, error } = useProduct(id);

  const product =
    (data && data.product) ?? (data && (data.id ? data : null)) ?? null;
  const images = (data && data.images) ?? [];

  useEffect(() => {
    setSelectedImage(null);
    setZoom(false);
  }, [id]);

  useEffect(() => {
    async function fetchReviews() {
      const { data, error } = await supabase
        .from("reviews")
        .select(
          `
          id,
          rating,
          comment,
          anonymous,
          created_at,
          profiles(username)
        `,
        )
        .eq("product_id", id)
        .order("created_at", { ascending: false });

      if (!error) {
        setReviews(data || []);
      }

      setReviewsLoading(false);
    }

    fetchReviews();
  }, [id]);

  const averageRating =
    reviews.length > 0
      ? (
          reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
        ).toFixed(1)
      : 0;

  if (isLoading) {
    return (
      <div className="flex justify-center py-20 text-gray-500">
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

  const handleImgLoad = (e) => {
    const img = e.target;
    setNaturalSize({ w: img.naturalWidth, h: img.naturalHeight });
    setDisplayWidth(img.getBoundingClientRect().width);
  };

  const handleClickImage = () => {
    const src = selectedImage || product.image_url;

    setModalImageSrc(src);
    setModalOpen(true);
  };

  const handleBackdropClick = (e) => {
    if (modalRef.current && !modalRef.current.contains(e.target)) {
      setModalOpen(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-24 py-8">
      {/* Top Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        {/* Images */}
        <div>
          <div className="relative border rounded-2xl overflow-hidden bg-gray-50">
            <img
              ref={imageRef}
              src={selectedImage || product.image_url}
              alt={product.name}
              onLoad={handleImgLoad}
              onClick={handleClickImage}
              className="w-full max-h-[60vh] object-contain cursor-zoom-in"
            />
          </div>

          <div className="flex gap-3 mt-3 overflow-x-auto">
            {(images.length ? images : [product.image_url])
              .filter(Boolean)
              .map((url, idx) => (
                <img
                  key={idx}
                  src={url}
                  onClick={() => setSelectedImage(url)}
                  className={`w-20 h-20 object-cover rounded-xl border-2 cursor-pointer ${
                    selectedImage === url
                      ? "border-[#4eb0e3]"
                      : "border-transparent hover:border-gray-300"
                  }`}
                  alt={`Thumbnail ${idx + 1}`}
                />
              ))}
          </div>
        </div>

        {/* Product Info */}
        <div>
          <h1 className="text-2xl font-semibold text-gray-800">
            {product.name}
          </h1>

          {/* Rating */}
          <div className="flex items-center gap-2 mt-2">
            <span className="text-yellow-400">
              {"★".repeat(Math.round(averageRating))}
            </span>

            <span className="text-sm text-gray-600">
              {averageRating} ({reviews.length} reviews)
            </span>
          </div>

          <p className="text-3xl font-bold text-[#4eb0e3] mt-3">
            KES {Number(product.price).toLocaleString()}
          </p>

          <p className="text-gray-600 mt-4">
            {product.description || "No description available."}
          </p>

          <div className="mt-6 space-y-2 text-sm">
            {product.category && (
              <p>
                <strong>Category:</strong> {product.category}
              </p>
            )}

            {product.brand && (
              <p>
                <strong>Brand:</strong> {product.brand}
              </p>
            )}

            <p>
              <strong>Stock:</strong>{" "}
              {product.stock > 0
                ? `${product.stock} available`
                : "Out of stock"}
            </p>
          </div>

          {/* Quantity + Actions */}
          <div className="mt-6 flex flex-col sm:flex-row gap-4">
            <div className="flex border rounded-xl">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="p-2"
              >
                <Minus size={16} />
              </button>

              <span className="px-4 flex items-center">{quantity}</span>

              <button
                onClick={() =>
                  setQuantity((q) => (q < product.stock ? q + 1 : q))
                }
                className="p-2"
                disabled={quantity >= product.stock}
              >
                <Plus size={16} />
              </button>
            </div>

            <Button
              disabled={product.stock <= 0}
              onClick={() =>
                addToCart(product, Math.min(quantity, product.stock))
              }
              className="bg-[#4eb0e3] hover:bg-[#3ca0d4]"
            >
              Add to Cart
            </Button>

            <Button
              disabled={product.stock <= 0}
              onClick={() => {
                if (!session) {
                  navigate("/signin", {
                    state: { redirectTo: "/checkout" },
                  });
                } else {
                  navigate("/checkout", {
                    state: { buyNow: true, product, quantity },
                  });
                }
              }}
            >
              Buy it now
            </Button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mt-10">
        <Tabs defaultValue="description">
          <TabsList>
            <TabsTrigger value="description">Description</TabsTrigger>
            <TabsTrigger value="reviews">Reviews</TabsTrigger>
            <TabsTrigger value="shipping">Shipping</TabsTrigger>
          </TabsList>

          <TabsContent value="description">{product.description}</TabsContent>

          {/* Reviews */}
          <TabsContent value="reviews">
            {reviewsLoading ? (
              <p className="text-gray-500 mt-4">Loading reviews...</p>
            ) : reviews.length === 0 ? (
              <p className="text-gray-500 mt-4">No reviews yet.</p>
            ) : (
              <div className="space-y-4 mt-4">
                {reviews.map((review) => (
                  <div
                    key={review.id}
                    className="border rounded-xl p-4 bg-white shadow-sm"
                  >
                    <div className="flex justify-between mb-2">
                      <span className="text-yellow-400">
                        {"★".repeat(review.rating)}
                      </span>

                      <span className="text-xs text-gray-400">
                        {new Date(review.created_at).toLocaleDateString()}
                      </span>
                    </div>

                    <p className="text-gray-700 mb-2">{review.comment}</p>

                    <p className="text-sm text-gray-500">
                      {review.anonymous
                        ? "Anonymous"
                        : `@${review.profiles?.username || "user"}`}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="shipping">Fast delivery nationwide.</TabsContent>
        </Tabs>
      </div>

      {/* Image Modal */}
      {modalOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
          onMouseDown={handleBackdropClick}
        >
          <div
            ref={modalRef}
            className="bg-white rounded-lg p-3 max-w-4xl w-full relative"
          >
            <button
              onClick={() => setModalOpen(false)}
              className="absolute top-2 right-2"
            >
              <X />
            </button>

            <img
              src={modalImageSrc}
              alt={product.name}
              className="max-h-[80vh] mx-auto object-contain"
            />
          </div>
        </div>
      )}

      {/* WhatsApp Chat */}
      <WhatsAppChat productName={product.name} hidden={modalOpen} />
    </div>
  );
}
