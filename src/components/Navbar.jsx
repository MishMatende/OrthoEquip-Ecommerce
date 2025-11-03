import React, { useRef, useState, useEffect } from "react";
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
  ShoppingCart,
  UserRoundPen,
  X,
  ChevronUp,
} from "lucide-react";
import img from "../assets/OrthoEquip.jpg";
import { UserAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
// TODO: HAVE TO CLICK LOGOUT TWICE TO LOGOUT

export default function Navbar() {
  const [categories, setCategories] = useState([]);
  const [openCategories, setOpenCategories] = useState(false);
  const [openMobileMenu, setOpenMobileMenu] = useState(false);
  const [openUserManagement, setOpenUserManagement] = useState(false);
  const menuRef = useRef(null);

  const { session, signoutUser } = UserAuth();
  const navigate = useNavigate();
  const handleSingOut = async (e) => {
    e?.preventDefault();
    setOpenUserManagement(false);
    try {
      await signoutUser();
      navigate("/");
    } catch (err) {
      console.log(err);
    }
  };

  // user Button setup
  const handleClick = () => {
    if (session == undefined) {
      navigate("/signup");
    } else {
      setOpenUserManagement((prev) => !prev);
    }
  };

  const handleBlur = (e) => {
    setTimeout(() => {
      if (!menuRef.current.contains(document.activeElement)) {
        setOpenUserManagement(false);
      }
    }, 150);
  };

  const userOptions = [
    { label: "Profile", path: "/profile" },
    { label: "Dashboard", path: "/dashboard" },
    { label: "Settings", path: "/settings" },
    { label: "Logout", action: handleSingOut, isLogout: true },
  ];

  useEffect(() => {
    async function fetchCategories() {
      const { data, error } = await supabase
        .from("products")
        .select("category");

      if (error) console.error("Error fetching categories:", error);
      else {
        const uniqueCategories = [
          ...new Set(data.map((p) => p.category).filter(Boolean)),
        ];
        setCategories(uniqueCategories);
      }
    }

    fetchCategories();
  }, []);

  const handleCategoryClick = (category) => {
    // Navigate to shop page with category as query param
    navigate(`/shop?category=${encodeURIComponent(category)}`);
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        !e.target.closest(".category-dropdown") &&
        !e.target.closest(".categories-button")
      ) {
        setOpenCategories(false);
      }
    };

    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  return (
    <div className="mx-[0%] md:mx-[7%] lg:mx-[15%] text-center pt-5">
      <nav className="w-full flex items-center justify-between px-4 py-3 bg-white relative">
        {/* Left Section: Categories or Hamburger */}
        <div className="flex items-center">
          {/* Mobile Hamburger */}
          <button
            className="md:hidden flex items-center justify-center p-2 text-white"
            onClick={() => setOpenMobileMenu(!openMobileMenu)}
          >
            Categories
            {openMobileMenu ? (
              <ChevronUp size={16} />
            ) : (
              <ChevronDown size={16} />
            )}
          </button>

          {/* Desktop Categories Button */}
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setOpenCategories((prev) => !prev);
              }}
              className="categories-button hidden md:flex items-center gap-2 border text-white bg-[#0680cd] px-4 py-2 rounded-md hover:bg-white hover:text-black hover:border hover:border-black transition-all duration-200"
            >
              <Menu size={18} />
              <span className="font-semibold uppercase">Categories</span>
              <ChevronDown size={16} />
            </button>

            {/* Categories Dropdown (Desktop Only) */}
            {openCategories && (
              <div
                className="absolute top-full left-0 w-64 bg-white shadow-xl rounded-md mt-2 z-50 text-black md:block category-dropdown" // ✅ removed 'hidden'
                onClick={(e) => e.stopPropagation()} // ✅ stop clicks inside dropdown from closing it
              >
                <ul className="flex flex-col">
                  {categories.length > 0 ? (
                    categories.map((category, i) => (
                      <li
                        key={i}
                        onClick={() => {
                          setOpenCategories(false);
                          navigate(
                            `/shop?category=${encodeURIComponent(category)}`
                          );
                        }}
                        className="flex items-center gap-3 px-4 py-2 hover:bg-gray-100 cursor-pointer"
                      >
                        {category}
                      </li>
                    ))
                  ) : (
                    <li className="px-4 py-2 text-gray-500 text-sm">
                      Loading categories...
                    </li>
                  )}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Center: Search Bar */}
        <div className="hidden md:flex flex-1 max-w-lg mx-4 text-black font-bold">
          <input
            type="text"
            placeholder="Search for product"
            className="w-full p-2 pl-[20px] rounded-full focus:outline-none focus:ring-2 focus:ring-[#0680cd] shadow-md hover:scale-[1.02] transition-transform duration-200"
          />
        </div>

        {/* Right Section: Icons */}
        <div className="flex items-center space-x-4">
          <ShoppingCart
            size={22}
            className="hover:text-blue-600 transition-colors duration-200 cursor-pointer"
          />
          <div
            tabIndex="0"
            className="cursor-pointer"
            onFocus={() => setOpenUserManagement(true)}
            onBlur={() => setOpenUserManagement(false)}
          >
            <div
              className="relative flex items-center gap-2"
              ref={menuRef}
              onBlur={handleBlur}
              tabIndex={0}
            >
              {/* User Button  */}
              <div className="relative group">
                <button
                  onClick={() => {
                    if (!session) navigate("/signup");
                    else setOpenUserManagement((prev) => !prev);
                  }}
                  className="flex items-center hover:text-blue-600 transition-colors duration-200 focus:outline-none"
                >
                  <UserRoundPen size={22} />

                  {!session && (
                    <span
                      className="absolute top-full left-1/2 -translate-x-1/2 mt-2
                   bg-white text-blue-600 text-s font-medium
                   px-2 py-1 rounded shadow
                   opacity-0 group-hover:opacity-100
                   transition-all duration-200
                   whitespace-nowrap"
                    >
                      Sign Up
                    </span>
                  )}
                </button>
              </div>

              {/* Dropdown Menu */}
              {session && openUserManagement && (
                <div className="absolute top-full right-0 w-48 bg-white shadow-xl rounded-md mt-2 z-50 text-black">
                  <ul className="flex flex-col divide-y divide-gray-100">
                    {userOptions.map((option, index) => (
                      <li
                        key={index}
                        className={`flex items-center gap-3 px-4 py-2 hover:bg-gray-100 cursor-pointer ${
                          option.isLogout ? "text-red-500" : ""
                        }`}
                        onClick={() => {
                          if (option.action) {
                            option.action();
                          } else if (option.path) {
                            navigate(option.path);
                            setOpenUserManagement(false);
                          }
                        }}
                      >
                        <p>{option.label}</p>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* <UserRoundPen
              size={22}
              className="hover:text-blue-600 transition-colors duration-200"
            />
            {openUserManagement && (
              <div className="absolute top-full right-0 w-50 bg-white shadow-xl rounded-md mt-2 z-50 text-black hidden md:block">
                <ul className="flex flex-col">
                  <li className="flex items-center gap-3 px-4 py-2 hover:bg-gray-100 cursor-pointer">
                    <p>Logout</p>
                  </li>
                </ul>
              </div>
            )} */}
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        {openMobileMenu && (
          <div className="absolute top-full w-full bg-white shadow-md z-40 py-4">
            {/* Search Field */}
            <div className="px-4 pb-3">
              <input
                type="text"
                placeholder="Search for product"
                className="w-full p-2 pl-[15px] rounded-full border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#0680cd]"
              />
            </div>

            {/* Categories */}
            <div className="flex flex-col text-left">
              {[
                { icon: <Bed />, label: "Hospital Stretchers" },
                { icon: <Zap />, label: "Defibrillators" },
                { icon: <SprayCan />, label: "Anesthesia Machines" },
                { icon: <Monitor />, label: "Patient Monitors" },
                { icon: <BottleWine />, label: "Sterilizers" },
                { icon: <ChartColumnBig />, label: "EKG/ECG Machines" },
                { icon: <BedSingle />, label: "Surgical Tables" },
                { icon: <Heater />, label: "Blanket & Fluid Warmers" },
                { icon: <Settings />, label: "Electrosurgical Units" },
              ].map((item, i) => (
                <span
                  key={i}
                  className="flex items-center gap-3 px-6 py-2 hover:bg-gray-100 cursor-pointer text-gray-700"
                >
                  {item.icon} {item.label}
                </span>
              ))}
            </div>
          </div>
        )}
      </nav>
    </div>
  );
}
