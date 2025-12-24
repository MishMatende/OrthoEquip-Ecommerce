// src/components/WhatsAppChat.jsx
import React, { useEffect, useState } from "react";
import { FaWhatsapp } from "react-icons/fa";
import { useLocation } from "react-router-dom";

export default function WhatsAppChat({ productName, hidden }) {
  const location = useLocation();
  const [show, setShow] = useState(false);

  // ❌ Hide on checkout
  if (location.pathname.startsWith("/checkout")) return null;

  // ❌ Hide when requested (e.g. image modal)
  if (hidden) return null;

  const phoneNumber = "254100219639"; // no +, no spaces

  // ✅ Build product URL SAFELY
  const productUrl = `${window.location.origin}${location.pathname}`;

  // ✅ Build message as ONE clean string
  let message = "Hello Balm Ortho 👋";

  if (productName) {
    message += ` I'm interested in ${productName}.`;
  }

  message += ` I'm interested in this product: ${productUrl}`;

  const whatsappLink = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(
    message
  )}`;

  // ⏱ Show once per session
  useEffect(() => {
    const hasShown = sessionStorage.getItem("whatsappShown");

    if (!hasShown) {
      const timer = setTimeout(() => {
        setShow(true);
        sessionStorage.setItem("whatsappShown", "true");
      }, 6000);

      return () => clearTimeout(timer);
    } else {
      setShow(true);
    }
  }, []);

  if (!show) return null;

  return (
    <a
      href={whatsappLink}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with us on WhatsApp"
      className="
        fixed bottom-5 right-5 z-50
        group
        flex items-center justify-center
        w-14 h-14 rounded-full
        bg-[#25D366] text-white
        shadow-lg
        hover:scale-110
        cursor-pointer
        transition-transform duration-300
        whatsapp-pulse
      "
    >
      {/* Tooltip */}
      <span
        className="
          absolute right-16
          bg-black text-white text-xs
          px-3 py-1 rounded
          opacity-0 group-hover:opacity-100
          transition-opacity duration-200
          whitespace-nowrap
        "
      >
        Chat with us
      </span>

      <FaWhatsapp size={28} />
    </a>
  );
}
