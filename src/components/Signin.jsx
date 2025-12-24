import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "./ui/button";
import { UserAuth } from "../context/AuthContext";
import BalmOrthoLogo from "../assets/BalmOrthoLogo.png";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "../supabaseClient";

export default function Signin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const { signinUser } = UserAuth();
  const navigate = useNavigate();

  /* -------- SIGN IN -------- */
  const handleSignIn = async (e) => {
    e.preventDefault();
    setLoading(true);

    const result = await signinUser(email, password);

    if (!result.success) {
      toast.error(result.error || "Invalid email or password");
      setLoading(false);
      return;
    }

    const user = result.data.session?.user;
    const { data: profile } = await supabase
      .from("profiles")
      .select("is_admin")
      .eq("id", user.id)
      .single();

    toast.success("Signed in successfully");

    navigate(profile?.is_admin ? "/admin" : "/", { replace: true });
    setLoading(false);
  };

  return (
    <div className="w-full flex justify-center px-4 py-8">
      <form
        onSubmit={handleSignIn}
        className="w-full max-w-[300px] px-5 py-6 rounded-2xl bg-white shadow-lg"
      >
        <div className="flex flex-col items-center mb-5">
          <img src={BalmOrthoLogo} className="h-[70px]" alt="Balm Ortho" />
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

          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            type="password"
            className="w-full p-2.5 rounded-lg border"
            required
          />

          {/* FOrgot Pass word option */}
          {/* <Link
            to="/forgot-password"
            className="text-xs text-right text-[#4eb0e3] hover:underline w-full block"
          >
            Forgot password?
          </Link> */}

          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-[#4eb0e3] text-white"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Please wait
              </span>
            ) : (
              "Sign in"
            )}
          </Button>

          <p className="text-center text-sm">
            Don’t have an account?{" "}
            <Link to="/signup" className="text-[#4eb0e3] font-semibold">
              Sign up
            </Link>
          </p>
        </div>
      </form>
    </div>
  );
}
