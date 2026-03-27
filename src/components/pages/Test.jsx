import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Button } from "./ui/button";
import { UserAuth } from "../context/AuthContext";
import BalmOrthoLogo from "../assets/BalmOrthoLogo.png";
import { Loader2, Eye, EyeOff } from "lucide-react";
import toast from "react-hot-toast";

export default function Signup() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { signupNewUser } = UserAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from || "/";

  const handleSignUp = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await signupNewUser(email, password);

      if (result.success) {
        toast.success("Account created!");
        navigate("/signin", { state: { from } });
        return;
      }

      switch (result.code) {
        case "USER_EXISTS":
          toast.error("This email is already registered. Please sign in.");
          break;

        case "WEAK_PASSWORD":
          toast.error("Password must be at least 6 characters.");
          break;

        case "NETWORK_ERROR":
          toast.error("Network error. Please check your connection.");
          break;

        default:
          toast.error("Signup failed. Please try again.");
      }
    } catch {
      toast.error("Unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full flex flex-col items-center justify-center px-4 py-8">
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

          {/* Password with eye toggle */}
          <div className="relative">
            <input
              onChange={(e) => setPassword(e.target.value)}
              value={password}
              className="p-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#4eb0e3] focus:outline-none bg-white/80 placeholder-gray-500 text-gray-800 text-sm pr-10"
              placeholder="Password"
              type={showPassword ? "text" : "password"}
              name="user_pass"
              autoComplete="new-password"
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

          <Button
            type="submit"
            variant="solid"
            disabled={loading}
            className="mt-3 w-full py-2.5 bg-[#4eb0e3] hover:bg-[#3ca0d4] text-white font-semibold rounded-lg transition-all text-sm cursor-pointer"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
            {loading ? "Signing up..." : "Sign up"}
          </Button>

          <p className="text-center text-gray-700 text-sm">
            Already have an account?{" "}
            <Link
              to="/signin"
              state={{ from }}
              className="text-[#4eb0e3] font-semibold hover:underline"
            >
              Sign in
            </Link>
          </p>
        </div>
      </form>
    </div>
  );
}
