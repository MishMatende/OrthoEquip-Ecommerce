// src/pages/ResetPassword.jsx
import React, { useState, useEffect } from "react";
import { Button } from "../components/ui/button";
import { UserAuth } from "../context/AuthContext";
import { Loader2, Eye, EyeOff } from "lucide-react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";

export default function ResetPassword() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const { updatePassword } = UserAuth();
  const navigate = useNavigate();

  /* ---------------- PASSWORD STRENGTH ---------------- */
  const getStrength = () => {
    let score = 0;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    return score;
  };

  const strength = getStrength();

  const strengthLabel = ["Very weak", "Weak", "Fair", "Good", "Strong"][
    strength
  ];

  const strengthColor = [
    "bg-red-500",
    "bg-orange-500",
    "bg-yellow-500",
    "bg-blue-500",
    "bg-green-600",
  ][strength];

  /* ---------------- RESET HANDLER ---------------- */
  const handleReset = async (e) => {
    e.preventDefault();

    if (strength < 2) {
      toast.error("Password is too weak");
      return;
    }

    if (password !== confirm) {
      toast.error("Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password,
      });

      if (error) {
        // ✅ Handle Supabase's "same password" rule nicely
        if (error.message?.toLowerCase().includes("same")) {
          toast.error("New password must be different from your old password");
        } else {
          toast.error(error.message || "Failed to reset password");
        }

        setLoading(false);
        return;
      }

      // ✅ SUCCESS
      toast.success("Password updated! Redirecting...");
      setTimeout(() => navigate("/signin", { replace: true }), 800);
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_UPDATED") {
        console.log("Password updated event received");
        toast.success("Password updated successfully! Please sign in.");
        navigate("/signin", { replace: true });
      }
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, [navigate]);

  return (
    <div className="flex justify-center py-20 px-4">
      <form
        onSubmit={handleReset}
        className="w-full max-w-sm bg-white p-6 rounded-xl shadow"
      >
        <h2 className="text-xl font-bold mb-5 text-gray-800">Reset Password</h2>

        {/* New password */}
        <div className="relative mb-3">
          <input
            type={showPassword ? "text" : "password"}
            placeholder="New password"
            className="w-full p-2.5 border rounded pr-10"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
            aria-label="Toggle password visibility"
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>

        {/* Strength meter */}
        <div className="mb-4">
          <div className="flex gap-1 mb-1">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className={`h-1.5 flex-1 rounded ${
                  strength > i ? strengthColor : "bg-gray-200"
                }`}
              />
            ))}
          </div>
          <p className="text-xs text-gray-600">
            Strength: <span className="font-semibold">{strengthLabel}</span>
          </p>
        </div>

        {/* Confirm password */}
        <input
          type={showPassword ? "text" : "password"}
          placeholder="Confirm password"
          className="w-full p-2.5 border rounded mb-4"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          required
        />

        <Button
          type="submit"
          variant="solid"
          disabled={loading}
          className="w-full bg-[#4eb0e3] hover:bg-[#3ca0d4] text-white"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              Updating...
            </span>
          ) : (
            "Update password"
          )}
        </Button>
      </form>
    </div>
  );
}
