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

  // modal state
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

  // prevent background scroll when modal open
  useEffect(() => {
    document.body.style.overflow = modalOpen ? "hidden" : "";
    return () => (document.body.style.overflow = "");
  }, [modalOpen]);

  // close modal on Escape
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && setModalOpen(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

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

  const canZoom = () =>
    naturalSize.w && displayWidth ? naturalSize.w / displayWidth > 1.15 : false;

  const getZoomScale = () => {
    if (!naturalSize.w || !displayWidth) return 1.5;
    const raw = naturalSize.w / displayWidth;
    return Math.min(Math.max(raw, 1.1), 2.5);
  };

  const handleImgLoad = (e) => {
    const img = e.target;
    setNaturalSize({ w: img.naturalWidth, h: img.naturalHeight });
    setDisplayWidth(img.getBoundingClientRect().width);
  };

  const handleClickImage = () => {
    const src =
      selectedImage ||
      product.image_url ||
      "https://images.unsplash.com/photo-1584367360396-25b0d7c4b9a0";

    if (canZoom()) {
      setZoom((z) => !z);
    } else {
      setModalImageSrc(src);
      setModalOpen(true);
    }
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
            <div
              onClick={handleClickImage}
              onMouseMove={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                setMousePosition({
                  x: ((e.pageX - rect.left) / rect.width) * 100,
                  y: ((e.pageY - rect.top) / rect.height) * 100,
                });
                setDisplayWidth(rect.width);
              }}
              className={zoom ? "cursor-zoom-out" : "cursor-zoom-in"}
            >
              <img
                ref={imageRef}
                src={selectedImage || product.image_url}
                alt={product.name}
                onLoad={handleImgLoad}
                className="w-full max-h-[60vh] object-contain transition-transform duration-300"
                style={
                  zoom
                    ? {
                        transformOrigin: `${mousePosition.x}% ${mousePosition.y}%`,
                        transform: `scale(${getZoomScale()})`,
                      }
                    : {}
                }
              />
            </div>
          </div>

          <p className="text-sm text-gray-500 mt-2 italic">
            {canZoom()
              ? zoom
                ? "Click image to zoom out"
                : "Click image to zoom in"
              : "Tap to open full-size image"}
          </p>

          <div className="flex gap-3 mt-3 overflow-x-auto">
            {(images.length ? images : [product.image_url])
              .filter(Boolean)
              .map((url, idx) => (
                <img
                  key={idx}
                  src={url}
                  onClick={() => {
                    setSelectedImage(url);
                    setZoom(false);
                  }}
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
              {product.stock <= 0 ? "Out of Stock" : "Add to Cart"}
            </Button>

            <Button
              variant="outline"
              disabled={product.stock <= 0}
              onClick={() => {
                if (!session) {
                  navigate("/signin", {
                    state: { redirectTo: "/checkout" },
                  });
                } else {
                  navigate("/checkout", {
                    state: {
                      buyNow: true,
                      product,
                      quantity,
                    },
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

          <TabsContent value="reviews">No reviews yet.</TabsContent>

          <TabsContent value="shipping">Fast delivery nationwide.</TabsContent>
        </Tabs>
      </div>

      {/* Image Modal */}
      {modalOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
          onMouseDown={handleBackdropClick}
          onTouchStart={handleBackdropClick}
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

      {/* WhatsApp Chat Bubble */}
      <WhatsAppChat productName={product.name} hidden={modalOpen} />
    </div>
  );
}
