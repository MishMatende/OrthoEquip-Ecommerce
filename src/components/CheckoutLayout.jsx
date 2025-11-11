import React from "react";
import { Outlet } from "react-router-dom";
import BarmOrthoBackground from "../assets/BarmOrthoBackground.png";

export default function CheckoutLayout() {
  return (
    <div
      className="min-h-screen flex items-center justify-center bg-cover bg-center"
      style={{
        backgroundImage: `url(${BarmOrthoBackground})`,
        backgroundRepeat: "no-repeat",
        backgroundSize: "cover",
      }}
    >
      <Outlet />
    </div>
  );
}
