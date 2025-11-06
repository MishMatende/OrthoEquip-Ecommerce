import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Phone, Menu, X, ChevronDown } from "lucide-react";
import BalmOrthoLogo from "../assets/BalmOrthoLogo.png";
import { UserAuth } from "../context/AuthContext";

export default function Header() {
  const [pageOpen, setPageOpen] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [orderOpen, setOrderOpen] = useState(false);
  const { session } = UserAuth();

  return (
    <nav className="relative flex justify-between items-center py-6 px-[4%] bg-white shadow-sm mx-[0%] md:mx-[5%] lg:mx-[10%] text-center">
      <div className="flex items-center space-x-2">
        <img src={BalmOrthoLogo} className="h-[50px]" alt="Balm Ortho image" />

        <span className="text-2xl font-semibold">Balm Ortho Medical</span>
      </div>

      {/* Desktop Menu */}
      <ul className="hidden md:flex items-center gap-6 ml-6 text-lg md:text-md font-medium text-gray-800">
        <Link to="/">
          <li className="hover:text-[#0680cd] cursor-pointer">Home</li>
        </Link>
        <Link to="/shop">
          <li className="hover:text-[#0680cd] cursor-pointer">Shop</li>
        </Link>
        <li className="hover:text-[#0680cd] cursor-pointer">About</li>
        {/* <li className="hover:text-[#0680cd] cursor-pointer">Product</li> */}

        {/* <li
            tabIndex={0}
            className="hover:text-[#0680cd] cursor-pointer flex flex-row justify-center flex-wrap"
            onClick={() => setPageOpen(!pageOpen)}
            onFocus={() => setPageOpen(true)}
            onBlur={() => setPageOpen(false)}
          >
            Pages
            <span className="ml-1">
              <ChevronDown className="self-center h-[100%]" size={16} />
            </span>
            {pageOpen && (
              <div className="absolute top-full left-170 w-64 bg-white shadow-xl rounded-md mt-2 z-50 text-black">
                <ul className="flex flex-col">
                  <li className="flex items-center gap-3 px-4 py-2 hover:bg-gray-100 cursor-pointer">
                    Private Policy
                  </li>
                  <li className="flex items-center gap-3 px-4 py-2 hover:bg-gray-100 cursor-pointer">
                    Refund Policy
                  </li>
                  <li className="flex items-center gap-3 px-4 py-2 hover:bg-gray-100 cursor-pointer">
                    Terms of Service
                  </li>
                  <li className="flex items-center gap-3 px-4 py-2 hover:bg-gray-100 cursor-pointer">
                    Service
                  </li>
                  <li className="flex items-center gap-3 px-4 py-2 hover:bg-gray-100 cursor-pointer">
                    FAQ
                  </li>
                </ul>
              </div>
            )}
          </li> */}

        <Link to="/contact">
          <li className="hover:text-[#0680cd] cursor-pointer">Contact</li>
        </Link>

        {session && (
          <Link to="/orders">
            <li className="hover:text-[#0680cd] cursor-pointer">My Orders</li>
          </Link>
        )}
      </ul>

      {/* Mobile Hamburger Icon */}
      <div className="md:hidden">
        {isOpen ? (
          <X
            size={28}
            className="cursor-pointer text-gray-800"
            onClick={() => setIsOpen(false)}
          />
        ) : (
          <Menu
            size={28}
            className="cursor-pointer text-gray-800"
            onClick={() => setIsOpen(true)}
          />
        )}
      </div>

      {/* Contact (Desktop Only) */}
      <div className="hidden md:flex items-center gap-2 text-[#0680cd] font-medium">
        <Phone size={18} />
        <span className="text-gray-800">(+254)100-219-639</span>
      </div>

      {/* Mobile Menu Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 w-full bg-white flex flex-col items-center gap-4 py-6 shadow-md text-lg font-medium text-gray-800 z-50 md:hidden">
          <Link to="/" onClick={() => setIsOpen(false)}>
            <span className="hover:text-[#0680cd] cursor-pointer">Home</span>
          </Link>
          <Link to="/shop" onClick={() => setIsOpen(false)}>
            <span className="hover:text-[#0680cd] cursor-pointer">Shop</span>
          </Link>
          <span className="hover:text-[#0680cd] cursor-pointer">About</span>
          <Link to="/contact" onClick={() => setIsOpen(false)}>
            <span className="hover:text-[#0680cd] cursor-pointer">Contact</span>
          </Link>
          {session && (
            <Link to="/orders" onClick={() => setIsOpen(false)}>
              <span className="hover:text-[#0680cd] cursor-pointer">
                My Orders
              </span>
            </Link>
          )}

          {/* Contact section for mobile */}
          <div className="flex items-center gap-2 text-[#0680cd] font-medium pt-4 border-t border-gray-200">
            <Phone size={18} />
            <span className="text-gray-800">(+254) 740-375-473</span>
          </div>
        </div>
      )}
    </nav>
  );
}
