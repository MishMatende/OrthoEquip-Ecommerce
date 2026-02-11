import React, { useState, useRef, useEffect } from "react";
import { Button } from "../components/ui/button";
import { UserAuth } from "../context/AuthContext";
import toast from "react-hot-toast";
import { Loader2, Mail } from "lucide-react";
import { Link } from "react-router-dom";

const COOLDOWN_SECONDS = 30;

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const emailRef = useRef(null);

  const { forgotPassword } = UserAuth();

  /* -------- Restore cooldown on reload -------- */
  useEffect(() => {
    const storedUntil = sessionStorage.getItem("resetCooldownUntil");
    if (storedUntil) {
      const remaining = Math.ceil((Number(storedUntil) - Date.now()) / 1000);
      if (remaining > 0) setCooldown(remaining);
    }
  }, []);

  /* -------- Countdown timer -------- */
  useEffect(() => {
    if (cooldown <= 0) return;

    const interval = setInterval(() => {
      setCooldown((c) => {
        if (c <= 1) {
          sessionStorage.removeItem("resetCooldownUntil");
          return 0;
        }
        return c - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [cooldown]);

  /* -------- Submit handler -------- */
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email.trim()) {
      toast.error("Please enter your email address");
      emailRef.current?.focus();
      return;
    }

    setLoading(true);

    try {
      const result = await forgotPassword(email);

      if (result.success) {
        toast.success("Password reset link sent. Check your email.");
        const until = Date.now() + COOLDOWN_SECONDS * 1000;
        sessionStorage.setItem("resetCooldownUntil", until.toString());
        setCooldown(COOLDOWN_SECONDS);
      } else {
        toast.error(result.error || "Failed to send reset email");
      }
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center px-4 py-16">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm bg-white p-6 rounded-xl shadow"
      >
        {/* Info banner */}
        <div className="mb-5 rounded-lg bg-blue-50 border border-blue-200 p-4 text-sm text-blue-800">
          <div className="flex items-start gap-2">
            <Mail size={18} className="mt-0.5" />
            <p>
              Enter the email associated with your account. We’ll send you a
              secure link to reset your password.
            </p>
          </div>
        </div>

        <h2 className="text-xl font-bold mb-4 text-gray-800">
          Forgot Password
        </h2>

        <input
          ref={emailRef}
          type="email"
          placeholder="Email address"
          className="w-full p-2.5 border rounded mb-4"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={loading}
        />

        <Button
          type="submit"
          variant="solid"
          disabled={loading || cooldown > 0}
          className="w-full bg-[#4eb0e3] hover:bg-[#3ca0d4] text-white"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              Sending...
            </span>
          ) : cooldown > 0 ? (
            `Resend in ${cooldown}s`
          ) : (
            "Send reset link"
          )}
        </Button>

        <p className="text-sm text-center mt-4">
          Remembered your password?{" "}
          <Link
            to="/signin"
            className="text-[#4eb0e3] font-semibold hover:underline"
          >
            Sign in
          </Link>
        </p>
      </form>
    </div>
  );
}
