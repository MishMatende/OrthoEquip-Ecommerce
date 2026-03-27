// src/components/Signin.jsx
import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "./ui/button";
import { UserAuth } from "../context/AuthContext";
import BalmOrthoLogo from "../assets/BalmOrthoLogo.png";
import { Loader2, Eye, EyeOff } from "lucide-react";
import toast from "react-hot-toast";
import { supabase } from "../supabaseClient";

export default function Signin() {
  const location = useLocation();
  const navigate = useNavigate();

  const { signinUser } = UserAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Where the user came from (cart, checkout, etc.)
  const from = location.state?.from || "/";

  useEffect(() => {
    if (location.state?.from) {
      sessionStorage.setItem("redirectAfterLogin", location.state.from);
    }
  }, [location.state]);

  /* -------- SIGN IN -------- */
  const handleSignIn = async (e) => {
    e.preventDefault();
    setLoading(true);

    const result = await signinUser(email, password);

    // ❌ FAILED SIGN IN
    if (!result.success) {
      switch (result.code) {
        case "INVALID_CREDENTIALS":
          toast.error("Incorrect email or password.");
          break;

        case "EMAIL_NOT_CONFIRMED":
          toast.error("Please verify your email before signing in.");
          break;

        case "NETWORK_ERROR":
          toast.warning(
            "Connection issue. Please check your internet and try again.",
          );
          break;

        default:
          toast.error("Something went wrong. Please try again.");
          console.error("Login error:", result.raw);
      }

      setLoading(false);
      return;
    }

    try {
      const user = result.data.session?.user;

      // Check if admin
      const { data: profile, error } = await supabase
        .from("profiles")
        .select("is_admin")
        .eq("id", user.id)
        .single();

      if (error) throw error;

      toast.success("Signed in successfully");

      // Admin redirect
      if (profile?.is_admin) {
        navigate("/admin", { replace: true });
        return;
      }

      // If user came from cart, inform them their cart is preserved
      if (from === "/cart") {
        toast.success("Your cart items have been restored.");
      }

      // Redirect back to where they came from
      const redirectTo =
        location.state?.from ||
        sessionStorage.getItem("redirectAfterLogin") ||
        "/";

      sessionStorage.removeItem("redirectAfterLogin");

      navigate(redirectTo, { replace: true });
    } catch (err) {
      console.error(err);
      toast.warning(
        "Signed in, but we couldn't verify your profile due to a network issue.",
      );
    } finally {
      setLoading(false);
    }
  };

  /* -------- MESSAGE FROM OTHER PAGES -------- */
  useEffect(() => {
    if (location.state?.message) {
      toast.success(location.state.message);
    }
  }, [location.state]);

  return (
    <div className="w-full flex justify-center px-4 py-8">
      <form
        onSubmit={handleSignIn}
        className="w-full max-w-[300px] px-5 py-6 rounded-2xl bg-white shadow-lg"
      >
        <div className="flex flex-col items-center mb-5">
          <img
            src={BalmOrthoLogo}
            className="h-[70px]"
            alt="Balm Ortho Medical Supplies"
          />
          <h2 className="font-bold text-xl text-gray-800 mt-3">Sign in</h2>
        </div>

        <div className="space-y-4">
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            type="email"
            className="w-full p-2.5 rounded-lg border"
            required
          />

          {/* Password with eye toggle */}
          <div className="relative">
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              type={showPassword ? "text" : "password"}
              className="w-full p-2.5 rounded-lg border pr-10"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
            >
              {showPassword ? (
                <EyeOff className="w-5 h-5" />
              ) : (
                <Eye className="w-5 h-5" />
              )}
            </button>
          </div>

          <Link
            to="/forgot-password"
            className="text-xs text-right text-[#4eb0e3] hover:underline w-full block"
          >
            Forgot password?
          </Link>

          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-[#4eb0e3] text-white cursor-pointer"
          >
            {loading ? (
              <span className="flex items-center gap-2 justify-center">
                <Loader2 className="w-4 h-4 animate-spin" />
                Please wait
              </span>
            ) : (
              "Sign in"
            )}
          </Button>

          <p className="text-center text-sm">
            Don’t have an account?{" "}
            <Link
              to="/signup"
              state={{ from }}
              className="text-[#4eb0e3] font-semibold cursor-pointer"
            >
              Sign up
            </Link>
          </p>
        </div>
      </form>
    </div>
  );
}
