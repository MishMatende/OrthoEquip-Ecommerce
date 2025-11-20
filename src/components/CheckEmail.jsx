// src/pages/CheckEmail.jsx
import React from "react";
import { useLocation, Link } from "react-router-dom";
import BalmOrthoLogo from "../assets/BalmOrthoLogo.png";
import { maskEmail } from "../utils/maskEmail";

export default function CheckEmail() {
  const location = useLocation();
  const email = location.state?.email || "";
  const masked = maskEmail(email);

  return (
    <div className="w-full flex flex-col items-center justify-center px-4 py-10">
      <div className="w-full max-w-[330px] px-5 py-6 rounded-2xl backdrop-blur-lg bg-white/70 border border-white/30 shadow-lg text-center">
        <img src={BalmOrthoLogo} className="h-[70px] mx-auto mb-4" alt="Logo" />

        <h2 className="text-xl font-bold text-gray-800 mb-3">
          Check your email
        </h2>
        <p className="text-sm text-gray-700 leading-relaxed">
          If an account exists for <strong>{masked}</strong>, you’ll receive a
          link to reset your password.
        </p>

        <p className="text-xs text-gray-500 mt-3">Didn’t receive the email?</p>

        <Link
          to="/auth/reset"
          className="mt-2 inline-block text-[#4eb0e3] font-semibold hover:underline text-sm"
        >
          Try again
        </Link>
      </div>
    </div>
  );
}
