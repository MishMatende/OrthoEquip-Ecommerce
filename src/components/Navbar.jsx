import React, { useState } from "react";
import {
  Phone,
  Menu,
  ChevronDown,
  Bed,
  Zap,
  SprayCan,
  Monitor,
  BottleWine,
  ChartColumnBig,
  BedSingle,
  Heater,
  Settings,
} from "lucide-react";
import { Link } from "react-router";

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [pageOpen, setPageOpen] = useState(false);

  return (
    <>
      <nav className="w-full flex items-center justify-between px-6 py-3 bg-white relative">
        <div className="flex items-center relative">
          <button
            onClick={() => setOpen(!open)}
            onFocus={() => setOpen(true)}
            onBlur={() => setOpen(false)}
            className="flex items-center gap-2 text-white px-4 py-2 rounded-sm"
          >
            <Menu size={18} />
            <span className="font-semibold uppercase">Categories</span>
            <ChevronDown size={16} />
          </button>

          {open && (
            <div className="absolute top-full left-0 w-64 bg-white shadow-xl rounded-md mt-2 z-50 text-black">
              <ul className="flex flex-col">
                <li className="flex items-center gap-3 px-4 py-2 hover:bg-gray-100 cursor-pointer">
                  <Bed /> Hospital Stretchers
                </li>
                <li className="flex items-center gap-3 px-4 py-2 hover:bg-gray-100 cursor-pointer">
                  <Zap /> Defibrillators
                </li>
                <li className="flex items-center gap-3 px-4 py-2 hover:bg-gray-100 cursor-pointer">
                  <SprayCan /> Anesthesia Machines
                </li>
                <li className="flex items-center gap-3 px-4 py-2 hover:bg-gray-100 cursor-pointer">
                  <Monitor /> Patient Monitors
                </li>
                <li className="flex items-center gap-3 px-4 py-2 hover:bg-gray-100 cursor-pointer">
                  <BottleWine /> Sterilizers
                </li>
                <li className="flex items-center gap-3 px-4 py-2 hover:bg-gray-100 cursor-pointer">
                  <ChartColumnBig /> EKG/ECG Machines
                </li>
                <li className="flex items-center gap-3 px-4 py-2 hover:bg-gray-100 cursor-pointer">
                  <BedSingle /> Surgical Tables
                </li>
                <li className="flex items-center gap-3 px-4 py-2 hover:bg-gray-100 cursor-pointer">
                  <Heater /> Blanket & Fluid Warmers
                </li>
                <li className="flex items-center gap-3 px-4 py-2 hover:bg-gray-100 cursor-pointer">
                  <Settings /> Electrosurgical Units
                </li>
              </ul>
            </div>
          )}
        </div>

        <ul className="flex items-center gap-6 ml-6 text-sm font-medium text-gray-800">
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
        </ul>

        <div className="flex items-center gap-2 text-[#0680cd] font-medium">
          <Phone size={18} />
          <span className="text-gray-800">(+254) 740-375-473</span>
        </div>
      </nav>
    </>
  );
}
