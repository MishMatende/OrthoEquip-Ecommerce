import React, { useRef, useState, useEffect } from "react";
import {
  Menu,
  ChevronDown,
  ChevronUp,
  Loader2,
  ShoppingCart,
  UserRoundPen,
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
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "../supabaseClient";
import { UserAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";

export default function Navbar() {
  const [categories, setCategories] = useState([]);
  const [openCategories, setOpenCategories] = useState(false);
  const [openMobileMenu, setOpenMobileMenu] = useState(false);
  const [openUserMenu, setOpenUserMenu] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);

  const { cartCount } = useCart();
  const { session, signoutUser } = UserAuth();
  const navigate = useNavigate();

  const categoryRef = useRef(null);
  const userMenuRef = useRef(null);
  const searchRef = useRef(null); // desktop search container
  const mobileSearchRef = useRef(null); // mobile search container

  // --- Logout ---
  const handleSignOut = async () => {
    try {
      await signoutUser();
      setOpenUserMenu(false);
      navigate("/");
    } catch (err) {
      console.error(err);
    }
  };

  // --- Fetch categories ---
  useEffect(() => {
    async function fetchCategories() {
      const { data, error } = await supabase
        .from("products")
        .select("category");
      if (error) return console.error(error);
      const unique = [...new Set(data.map((p) => p.category).filter(Boolean))];
      setCategories(unique);
    }
    fetchCategories();
  }, []);

  // --- Click / touch outside for menus and search ---
  useEffect(() => {
    const handleClickOutside = (e) => {
      const target = e.target;
      if (categoryRef.current && !categoryRef.current.contains(target))
        setOpenCategories(false);
      if (userMenuRef.current && !userMenuRef.current.contains(target))
        setOpenUserMenu(false);

      // check both desktop and mobile search refs
      const clickedInsideSearch =
        (searchRef.current && searchRef.current.contains(target)) ||
        (mobileSearchRef.current && mobileSearchRef.current.contains(target));

      if (!clickedInsideSearch) setShowSearchDropdown(false);
    };

    // Listen to mousedown + touchstart (mobile)
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, []);

  // --- Debounced search ---
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (searchTerm.trim()) handleSearch(searchTerm);
      else {
        setSearchResults([]);
        setShowSearchDropdown(false);
      }
    }, 400);
    return () => clearTimeout(timeout);
  }, [searchTerm]);

  async function handleSearch(value) {
    setSearching(true);
    const { data, error } = await supabase
      .from("products")
      .select("id, name, price, image_url, brand, category")
      .or(
        `name.ilike.%${value}%,brand.ilike.%${value}%,category.ilike.%${value}%`
      );
    if (error) console.error(error);
    setSearchResults(data || []);
    setShowSearchDropdown(true);
    setSearching(false);
  }

  const userOptions = [
    { label: "Profile", path: "/profile" },
    { label: "Dashboard", path: "/dashboard" },
    { label: "Logout", action: handleSignOut, isLogout: true },
  ];

  // --- Animation Variants ---
  const dropdownVariants = {
    hidden: { opacity: 0, y: -8, scale: 0.98 },
    visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.18 } },
    exit: { opacity: 0, y: -6, scale: 0.98, transition: { duration: 0.15 } },
  };

  const mobileMenuVariants = {
    hidden: { opacity: 0, y: -20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.25, ease: "easeOut" },
    },
    exit: { opacity: 0, y: -20, transition: { duration: 0.2, ease: "easeIn" } },
  };

  const searchDropdownVariants = {
    hidden: { opacity: 0, y: -8 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.2 } },
    exit: { opacity: 0, y: -8, transition: { duration: 0.15 } },
  };

  return (
    <div className="mx-[0%] md:mx-[7%] lg:mx-[15%] text-center pt-5">
      <nav className="w-full flex items-center justify-between px-4 py-3 bg-white relative">
        {/* Mobile toggle */}
        <button
          className="md:hidden flex items-center justify-center p-2 text-white bg-[#4eb0e3] border rounded-md"
          onClick={() => setOpenMobileMenu((prev) => !prev)}
        >
          Categories
          {openMobileMenu ? (
            <ChevronUp className="ml-1" size={16} />
          ) : (
            <ChevronDown className="ml-1" size={16} />
          )}
        </button>

        {/* Desktop Categories */}
        <div
          className="relative hidden md:block"
          ref={categoryRef}
          onMouseEnter={() => setOpenCategories(true)}
          onMouseLeave={() => setOpenCategories(false)}
        >
          <button className="categories-button flex items-center gap-2 border text-white bg-[#4eb0e3] px-4 py-2 rounded-md hover:bg-white hover:text-black hover:border hover:border-black transition-all duration-200">
            <Menu size={18} />
            <span className="font-semibold uppercase">Categories</span>
            {openCategories ? (
              <ChevronUp size={16} />
            ) : (
              <ChevronDown size={16} />
            )}
          </button>

          <AnimatePresence>
            {openCategories && (
              <motion.div
                variants={dropdownVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="absolute top-full left-0 w-64 bg-white shadow-xl rounded-md mt-2 z-50 text-black origin-top"
              >
                <ul className="flex flex-col">
                  {categories.length > 0 ? (
                    categories.map((category, i) => (
                      <li
                        key={i}
                        onClick={() => {
                          navigate(
                            `/shop?category=${encodeURIComponent(category)}`
                          );
                          setOpenCategories(false);
                        }}
                        className="flex items-center gap-3 px-4 py-2 hover:bg-gray-100 cursor-pointer"
                      >
                        {category}
                      </li>
                    ))
                  ) : (
                    <li className="px-4 py-2 text-gray-500 text-sm flex items-center">
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Loading categories...
                    </li>
                  )}
                </ul>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Search (Desktop) */}
        <div
          className="hidden md:flex flex-1 max-w-lg mx-4 text-black font-bold relative"
          ref={searchRef}
        >
          <input
            type="text"
            placeholder="Search for product"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onFocus={() => searchResults.length && setShowSearchDropdown(true)}
            className="w-full p-2 pl-[20px] rounded-full focus:outline-none focus:ring-2 focus:ring-[#4eb0e3] shadow-md hover:scale-[1.02] transition-transform duration-200"
          />

          <AnimatePresence>
            {showSearchDropdown && searchTerm && (
              <motion.div
                variants={searchDropdownVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="absolute top-full left-0 w-full bg-white rounded-md shadow-lg mt-2 z-50 text-left overflow-hidden"
              >
                {searching ? (
                  <p className="px-4 py-3 text-gray-500 flex items-center">
                    <Loader2 className="animate-spin mr-2 w-4 h-4" />{" "}
                    Searching...
                  </p>
                ) : searchResults.length > 0 ? (
                  <div className="max-h-[400px] overflow-y-auto">
                    {searchResults.slice(0, 7).map((item) => (
                      <div
                        key={item.id}
                        onClick={() => {
                          navigate(`/shop/${item.id}`);
                          setSearchTerm("");
                          setShowSearchDropdown(false);
                        }}
                        className="px-4 py-2 flex items-center gap-3 hover:bg-gray-100 cursor-pointer transition-all duration-150"
                      >
                        <img
                          src={
                            item.image_url || "https://via.placeholder.com/40"
                          }
                          alt={item.name}
                          className="w-10 h-10 object-contain rounded-md border border-gray-100"
                        />
                        <div className="flex flex-col">
                          <p className="font-medium text-gray-800 text-sm">
                            {item.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {item.brand} • {item.category}
                          </p>
                          <p className="text-xs text-[#4eb0e3] font-semibold">
                            KES {item.price?.toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="px-4 py-3 text-gray-500 text-sm">
                    No products found.
                  </p>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right section */}
        <div className="flex items-center space-x-4">
          <div
            className="relative cursor-pointer"
            onClick={() => navigate("/cart")}
          >
            <ShoppingCart
              size={22}
              className="hover:text-[#4eb0e3] transition"
            />
            {cartCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-[#4eb0e3] text-white text-s font-semibold rounded-full w-4 h-4 flex items-center justify-center">
                {cartCount}
              </span>
            )}
          </div>

          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => {
                if (!session) navigate("/signin");
                else setOpenUserMenu((prev) => !prev);
              }}
              className="flex items-center hover:text-[#4eb0e3] transition cursor-pointer"
            >
              <UserRoundPen className="cursor-pointer" size={22} />
            </button>

            <AnimatePresence>
              {session && openUserMenu && (
                <motion.div
                  variants={dropdownVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="absolute top-full right-0 w-48 bg-white shadow-xl rounded-md mt-2 z-50 text-black origin-top"
                >
                  <ul className="flex flex-col divide-y divide-gray-100">
                    {/* <li>
                      <button
                        type="button"
                        onClick={() => navigate("/profile")}
                        className="w-full text-left px-4 py-2 hover:bg-gray-100 cursor-pointer"
                      >
                        Profile
                      </button>
                    </li>

                    <li>
                      <button
                        type="button"
                        onClick={() => navigate("/dashboard")}
                        className="w-full text-left px-4 py-2 hover:bg-gray-100 cursor-pointer"
                      >
                        Dashboard
                      </button>
                    </li> */}

                    <li>
                      <button
                        type="button"
                        onClick={async () => {
                          if (!signoutUser) {
                            console.error(
                              "signoutUser is not available from AuthContext"
                            );
                            return;
                          }
                          try {
                            await signoutUser();
                            setOpenUserMenu(false);
                            navigate("/");
                          } catch (err) {
                            console.error("Sign out failed:", err);
                          }
                        }}
                        className="w-full text-left px-4 py-2 hover:bg-gray-100 text-red-500 cursor-pointer"
                      >
                        Logout
                      </button>
                    </li>
                  </ul>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {openMobileMenu && (
            <motion.div
              variants={mobileMenuVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="absolute top-full left-0 w-full bg-white shadow-md z-40 py-4 md:hidden"
            >
              {/* Search (Mobile) */}
              <div className="relative px-4 pb-3" ref={mobileSearchRef}>
                <input
                  type="text"
                  placeholder="Search for product"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onFocus={() =>
                    searchResults.length && setShowSearchDropdown(true)
                  }
                  className="w-full p-2 pl-[15px] rounded-full border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#4eb0e3]"
                />

                {/* Mobile search dropdown (re-uses same UI as desktop but constrained for mobile) */}
                <AnimatePresence>
                  {showSearchDropdown && searchTerm && (
                    <motion.div
                      variants={searchDropdownVariants}
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                      className="absolute top-full left-0 w-full bg-white rounded-md shadow-lg mt-2 z-50 text-left overflow-hidden"
                    >
                      {searching ? (
                        <p className="px-4 py-3 text-gray-500 flex items-center">
                          <Loader2 className="animate-spin mr-2 w-4 h-4" />{" "}
                          Searching...
                        </p>
                      ) : searchResults.length > 0 ? (
                        <div className="max-h-[300px] overflow-y-auto">
                          {searchResults.slice(0, 7).map((item) => (
                            <div
                              key={item.id}
                              onClick={() => {
                                navigate(`/shop/${item.id}`);
                                setSearchTerm("");
                                setShowSearchDropdown(false);
                                setOpenMobileMenu(false);
                              }}
                              className="px-4 py-2 flex items-center gap-3 hover:bg-gray-100 cursor-pointer transition-all duration-150"
                            >
                              <img
                                src={
                                  item.image_url ||
                                  "https://via.placeholder.com/40"
                                }
                                alt={item.name}
                                className="w-10 h-10 object-contain rounded-md border border-gray-100"
                              />
                              <div className="flex flex-col">
                                <p className="font-medium text-gray-800 text-sm">
                                  {item.name}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {item.brand} • {item.category}
                                </p>
                                <p className="text-xs text-[#4eb0e3] font-semibold">
                                  KES {item.price?.toLocaleString()}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="px-4 py-3 text-gray-500 text-sm">
                          No products found.
                        </p>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Dynamic Categories from Supabase */}
              <div className="flex flex-col text-left">
                {categories.length > 0 ? (
                  categories.map((category, i) => (
                    <span
                      key={i}
                      onClick={() => {
                        navigate(
                          `/shop?category=${encodeURIComponent(category)}`
                        );
                        setOpenMobileMenu(false);
                      }}
                      className="flex items-center gap-3 px-6 py-2 hover:bg-gray-100 cursor-pointer text-gray-700 transition-all duration-150"
                    >
                      <span className="w-2 h-2 bg-[#4eb0e3] rounded-full"></span>
                      {category}
                    </span>
                  ))
                ) : (
                  <div className="flex items-center px-6 py-3 text-gray-500 text-sm">
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Loading categories...
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>
    </div>
  );
}
