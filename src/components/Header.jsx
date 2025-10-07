import React from "react";
import img from "../assets/OrthoEquip.jpg";
import { ShoppingCart, UserRoundPen } from "lucide-react";

export default function Header() {
  return (
    <nav className="flex items-center justify-between p-4 bg-white text-black">
      <div className="flex items-center space-x-2">
        <span className="text-xl font-semibold">OrthoEquip</span>
      </div>
      <div className="flex-1 max-w-lg mx-4 text-black font-bold">
        <input
          type="text"
          placeholder="Search for product"
          className="w-full p-2 rounded-full focus:outline-none focus:ring-2 focus:ring-[#0680cd] shadow-md hover:scale-105 transition-transform duration-200"
        />
      </div>
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-1">
          <ShoppingCart
            size={20}
            className="hover:text-blue-600 transition-colors duration-200 cursor-pointer"
          />
        </div>
        <div>
          <UserRoundPen
            size={20}
            className="hover:text-blue-600 transition-colors duration-200 cursor-pointer"
          />
          {/* <span className="text-gray-600">Login</span> */}
        </div>
      </div>
    </nav>
  );
}
