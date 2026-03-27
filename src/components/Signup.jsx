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

      /* ---------------- SUCCESS ---------------- */
      if (result.success) {
        toast.success("Account created!");

        navigate("/signin", { state: { from } });
        return;
      }

      /* ---------------- ERROR HANDLING ---------------- */
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
    <div className="w-full flex justify-center px-4 py-8">
      <form
        onSubmit={handleSignUp}
        autoComplete="off"
        className="w-full max-w-[300px] px-5 py-6 rounded-2xl bg-white shadow-lg"
      >
        <div className="flex flex-col items-center mb-5">
          <img
            src={BalmOrthoLogo}
            className="h-[70px]"
            alt="Balm Ortho Medical Supplies"
          />
          <h2 className="font-bold text-xl text-gray-800 mt-3">Sign up</h2>
        </div>

        <div className="space-y-4">
          {/* Autofill blockers */}
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
            className="w-full p-2.5 rounded-lg border"
            placeholder="Email"
            type="email"
            name="user_email"
            autoComplete="off"
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

          <Button
            type="submit"
            variant="solid"
            disabled={loading}
            className="w-full bg-[#4eb0e3] text-white cursor-pointer"
          >
            {loading ? (
              <span className="flex items-center gap-2 justify-center">
                <Loader2 className="w-4 h-4 animate-spin" />
                Please wait
              </span>
            ) : (
              "Sign up"
            )}
          </Button>

          <p className="text-center text-sm">
            Already have an account?{" "}
            <Link
              to="/signin"
              state={{ from }}
              className="text-[#4eb0e3] font-semibold cursor-pointer"
            >
              Sign in
            </Link>
          </p>
        </div>
      </form>
    </div>
  );
}
