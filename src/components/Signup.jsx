import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Button } from "./ui/button";
import { UserAuth } from "../context/AuthContext";
import BalmOrthoLogo from "../assets/BalmOrthoLogo.png";

export default function Signup() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState("");
  const { session, signupNewUser } = UserAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/";

  const handleSignUp = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const result = await signupNewUser(email, password);

      if (result.success) {
        navigate(from, { replace: true });
      }
    } catch (error) {
      setError("An error occured");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <form
        onSubmit={handleSignUp}
        className="w-full py-5 md:py-14 px-2 md:px-8 shadow-lg rounded-md"
      >
        <img
          src={BalmOrthoLogo}
          className="h-[100px] mx-auto"
          alt="Balm Ortho image"
        />
        <h2 className="font-bold">Sign up</h2>
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
            className="mt-6 w-auto mx-auto bg-"
          >
            Sign up
          </Button>
          {error && <p className="text-red-600 text-center pt-4">{error}</p>}
          <p className="mt-4">
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
