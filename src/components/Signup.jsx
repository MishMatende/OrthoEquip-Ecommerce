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
    <div className="relative">
      {/* Persistent Banner */}
      {showBanner && (
        <div
          role="alert"
          className="bg-[#0680cd] border border-[#0680cd] text-white px-4 py-3 rounded-md mb-6 text-center font-medium"
        >
          ✅ Please check your email for a link to confirm your account.
        </div>
      )}

      <form
        onSubmit={handleSignUp}
        autoComplete="off"
        className="w-full py-5 md:py-14 px-2 md:px-8 shadow-lg rounded-md bg-white"
      >
        <img
          src={BalmOrthoLogo}
          className="h-[100px] mx-auto"
          alt="Balm Ortho logo"
        />
        <h2 className="font-bold text-xl text-center mt-4">Sign up</h2>

        <div className="flex flex-col p-4">
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
            className="p-3 border rounded-md border-black"
            placeholder="Email"
            type="email"
            name="user_email"
            autoComplete="off"
            required
          />

          <input
            onChange={(e) => setPassword(e.target.value)}
            value={password}
            className="p-3 mt-6 border rounded-md border-black"
            placeholder="Password"
            type="password"
            name="user_pass"
            autoComplete="new-password"
            required
          />

          <Button
            type="submit"
            disabled={loading}
            className="mt-6 w-auto mx-auto"
          >
            {loading ? "Signing up..." : "Sign up"}
          </Button>

          {error && <p className="text-red-600 text-center pt-4">{error}</p>}

          <p className="mt-4 text-center">
            Already have an account?{" "}
            <Link className="text-[#0680cd] font-bold" to="/signin">
              Sign in
            </Link>
          </p>
        </div>
      </form>
    </div>
  );
}
