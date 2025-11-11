import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Button } from "./ui/button";
import { UserAuth } from "../context/AuthContext";
import BalmOrthoLogo from "../assets/BalmOrthoLogo.png";
import { Loader2 } from "lucide-react";
import { supabase } from "../supabaseClient";

export default function Signin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState("");
  const { session, signinUser } = UserAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/";

  const handleSignIn = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const result = await signinUser(email, password);

      if (result.success) {
        const user = result.data.session?.user;
        if (!user) throw new Error("No session user found");

        // Fetch the profile again to confirm is_admin
        const { data: profile } = await supabase
          .from("profiles")
          .select("is_admin")
          .eq("id", user.id)
          .single();

        if (profile?.is_admin) {
          navigate("/admin", { replace: true }); // 👈 admin route
        } else {
          navigate("/", { replace: true }); // normal user route
        }
      } else {
        setError(result.error || "Invalid email or password");
      }
    } catch (err) {
      console.error("Sign-in error:", err);
      setError("Something went wrong, please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <form
        onSubmit={handleSignIn}
        className="w-full py-5 md:py-14 px-2 md:px-8 shadow-lg rounded-md bg-white"
      >
        <img
          src={BalmOrthoLogo}
          className="h-[100px] mx-auto"
          alt="Balm Ortho logo"
        />
        <h2 className="font-bold text-xl text-center mt-4">Sign in</h2>

        <div className="flex flex-col p-4">
          <input
            onChange={(e) => setEmail(e.target.value)}
            className="p-3 border rounded-md border-black"
            placeholder="Email"
            type="email"
            name=""
          />
          <input
            onChange={(e) => setPassword(e.target.value)}
            className="p-3 mt-6 border rounded-md border-black"
            placeholder="Password"
            type="password"
            name=""
          />
          <Button
            type="submit"
            disabled={loading}
            className="mt-6 w-auto mx-auto"
          >
            {loading ? <Loader2 className="w-6 h-6 animate-spin mr-2" /> : ""}
            {loading ? "Signing in..." : "Sign in"}
          </Button>
          {error && <p className="text-red-600 text-center pt-4">{error}</p>}
          <p className="mt-4 text-center">
            Don't have an account?{" "}
            <Link className="text-[#0680cd] font-bold" to="/signup">
              Sign up
            </Link>
          </p>
        </div>
      </form>
    </div>
  );
}
