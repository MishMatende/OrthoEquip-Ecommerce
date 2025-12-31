import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Button } from "./ui/button";
import { UserAuth } from "../context/AuthContext";
import BalmOrthoLogo from "../assets/BalmOrthoLogo.png";

export default function Signup() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showBanner, setShowBanner] = useState(false);

  const { signupNewUser } = UserAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/";

  const handleSignUp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setShowBanner(false);

    try {
      const result = await signupNewUser(email, password);

      if (result.success) {
        // Show banner and do NOT redirect
        setShowBanner(true);
      }
    } catch (error) {
      setError("An error occurred during signup. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full flex flex-col items-center justify-center px-4 py-8">
      {/* Success Banner */}
      {showBanner && (
        <div
          role="alert"
          className="bg-[#4eb0e3]/90 text-white px-4 py-3 rounded-lg mb-5 text-center font-medium shadow-md w-full max-w-sm"
        >
          ✅ Please check your email for a link to confirm your account.
        </div>
      )}

      <form
        onSubmit={handleSignUp}
        autoComplete="off"
        className="w-full max-w-[300px] px-5 py-6 sm:px-6 sm:py-8 rounded-2xl backdrop-blur-lg bg-white/70 border border-white/30 shadow-lg"
      >
        <div className="flex flex-col items-center">
          <img
            src={BalmOrthoLogo}
            className="h-[70px] mb-3"
            alt="Balm Ortho Medical Supplies logo"
          />
          <h2 className="font-bold text-xl text-gray-800 mb-5">Sign up</h2>
        </div>

        <div className="flex flex-col space-y-4">
          {/* Hidden fake inputs to stop autofill */}
          <input
            type="text"
            name="fakeuser"
            autoComplete="off"
            className="hidden"
          />
          <input
            type="password"
            name="fakepass"
            autoComplete="new-password"
            className="hidden"
          />

          <input
            onChange={(e) => setEmail(e.target.value)}
            value={email}
            className="p-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#4eb0e3] focus:outline-none bg-white/80 placeholder-gray-500 text-gray-800 text-sm"
            placeholder="Email"
            type="email"
            name="user_email"
            autoComplete="off"
            required
          />

          <input
            onChange={(e) => setPassword(e.target.value)}
            value={password}
            className="p-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#4eb0e3] focus:outline-none bg-white/80 placeholder-gray-500 text-gray-800 text-sm"
            placeholder="Password"
            type="password"
            name="user_pass"
            autoComplete="new-password"
            required
          />

          <Button
            type="submit"
            disabled={loading}
            className="mt-3 w-full py-2.5 bg-[#4eb0e3] hover:bg-[#3ca0d4] text-white font-semibold rounded-lg transition-all text-sm cursor-pointer"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : ""}
            {loading ? "Signing up..." : "Sign up"}
          </Button>

          {error && (
            <p className="text-red-600 text-center pt-1 text-sm">{error}</p>
          )}

          <p className="text-center text-gray-700 text-sm">
            Already have an account?{" "}
            <Link
              className="text-[#4eb0e3] font-semibold hover:underline"
              to="/signin"
            >
              Sign in
            </Link>
          </p>
        </div>
      </form>
    </div>
  );
}
