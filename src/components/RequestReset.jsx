import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";
import BalmOrthoLogo from "../assets/BalmOrthoLogo.png";
import { Loader2 } from "lucide-react";
import { supabase } from "../supabaseClient";

export default function RequestReset() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleRequestReset = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const normalized = (email || "").trim().toLowerCase();
    if (!normalized) {
      setError("Please enter your email address.");
      setLoading(false);
      return;
    }

    try {
      const redirectTo =
        import.meta.env.VITE_RESET_REDIRECT_URL ||
        `${window.location.origin}/auth/reset-password`;

      // Client-only: don't check existence, just request reset.
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        normalized,
        { redirectTo }
      );

      if (resetError) {
        console.error("supabase.resetPasswordForEmail error:", resetError);
        // Generic error so we don't leak existence info
        setError(
          "Failed to send reset email. Please try again later or contact support."
        );
        return;
      }

      // Success — navigate to the check-email / masked-success page
      // We still pass the normalized email to show a masked address if you want.
      navigate("/auth/check-email", { state: { email: normalized } });
    } catch (err) {
      console.error("RequestReset unexpected error:", err);
      setError("Something went wrong. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full flex flex-col items-center justify-center px-4 py-8">
      <form
        onSubmit={handleRequestReset}
        className="w-full max-w-[300px] px-5 py-6 sm:px-6 sm:py-8 rounded-2xl backdrop-blur-lg bg-white/70 border border-white/30 shadow-lg"
      >
        <div className="flex flex-col items-center">
          <img
            src={BalmOrthoLogo}
            className="h-[70px] mb-3"
            alt="Balm Ortho logo"
          />
          <h2 className="font-bold text-xl text-gray-800 mb-5">
            Reset password
          </h2>
        </div>

        <div className="flex flex-col space-y-4">
          <p className="text-sm text-gray-700 text-center">
            Enter the email associated with your account. We’ll send you a reset
            link if the account exists.
          </p>

          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="p-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#4eb0e3] focus:outline-none bg-white/80 placeholder-gray-500 text-gray-800 text-sm"
            placeholder="Email"
            type="email"
            required
            autoComplete="email"
          />

          <Button
            type="submit"
            disabled={loading || !email}
            className="mt-3 w-full py-2.5 bg-[#4eb0e3] hover:bg-[#3ca0d4] text-white font-semibold rounded-lg transition-all text-sm"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              "Send reset link"
            )}
          </Button>

          {/* Friendly error text under button */}
          {error && (
            <p className="text-red-600 text-center pt-1 text-sm">{error}</p>
          )}
        </div>
      </form>
    </div>
  );
}
