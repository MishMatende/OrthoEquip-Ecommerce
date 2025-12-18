// src/components/admin/AdminLayout.jsx
import { Outlet, NavLink, useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { UserAuth } from "../../context/AuthContext";
import { useCart } from "../../context/cartContext"; // <-- make sure path matches your project
import {
  LogOut,
  Menu,
  X,
  LayoutDashboard,
  Package,
  ShoppingCart,
  BarChart2,
  Settings,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

export default function AdminLayout() {
  const { userProfile, signoutUser } = UserAuth();
  const { clearCart } = useCart(); // call to clear cart on logout
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false); // spinner state
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  const navItems = [
    { name: "Dashboard", path: "/admin", icon: <LayoutDashboard size={18} /> },
    { name: "Products", path: "/admin/products", icon: <Package size={18} /> },
    { name: "Orders", path: "/admin/orders", icon: <ShoppingCart size={18} /> },
    {
      name: "Analytics",
      path: "/admin/analytics",
      icon: <BarChart2 size={18} />,
    },
    { name: "Settings", path: "/admin/settings", icon: <Settings size={18} /> },
  ];

  // sign out handler: shows spinner, clears cart, shows toast
  async function handleSignOut() {
    try {
      setSigningOut(true);

      if (typeof signoutUser === "function") {
        const res = await signoutUser();
        if (res?.ok) {
          // clear client & server cart if available
          try {
            await clearCart(); // best-effort; clearCart should handle auth/no-auth internally
          } catch (e) {
            console.warn("clearCart failed during signout:", e);
          }

          toast.success("Signed out");
          setSidebarOpen(false);
          navigate("/signin");
        } else {
          console.error("signout failed", res?.error);
          toast.error("Sign out failed — please try again");
          // fallback navigate
          navigate("/signin");
        }
      } else {
        toast("Signed out");
        navigate("/signin");
      }
    } catch (err) {
      console.error("Sign out failed:", err);
      toast.error("Sign out failed — please try again");
      navigate("/signin");
    } finally {
      setSigningOut(false);
    }
  }

  return (
    <div className="min-h-screen flex bg-gray-50">
      <AnimatePresence>
        {sidebarOpen && (
          <motion.button
            type="button"
            aria-hidden
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 z-20 bg-black/40 md:hidden"
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {(sidebarOpen ||
          (typeof window !== "undefined" && window.innerWidth >= 768)) && (
          <motion.aside
            key="admin-sidebar"
            initial={{ x: -320 }}
            animate={{ x: 0 }}
            exit={{ x: -320 }}
            transition={{ type: "spring", stiffness: 120, damping: 18 }}
            className="fixed md:static z-30 top-0 left-0 h-screen w-64 bg-white text-gray-800 flex flex-col shadow-lg border-r border-gray-200"
            aria-label="Admin sidebar"
          >
            <div className="px-5 py-4 text-2xl font-bold border-b border-gray-100 flex justify-between items-center">
              <span className="truncate">Admin Panel</span>
              <button
                className="md:hidden text-gray-600 hover:text-[#4eb0e3]"
                onClick={() => setSidebarOpen(false)}
                aria-label="Close sidebar"
              >
                <X size={20} />
              </button>
            </div>

            <nav className="flex-1 overflow-y-auto py-4 px-2">
              <ul className="space-y-2">
                {navItems.map((item) => (
                  <li key={item.path}>
                    <NavLink
                      to={item.path}
                      end={item.path === "/admin"}
                      onClick={() => setSidebarOpen(false)}
                      className={({ isActive }) =>
                        `flex items-center gap-3 px-4 py-2 rounded-lg transition-colors duration-150 ${
                          isActive
                            ? "bg-[#4eb0e3] text-white shadow-sm"
                            : "text-gray-700 hover:bg-gray-100 hover:text-[#4eb0e3]"
                        }`
                      }
                    >
                      {item.icon}
                      <span className="text-sm font-medium truncate">
                        {item.name}
                      </span>
                    </NavLink>
                  </li>
                ))}
              </ul>
            </nav>

            <div className="p-4 border-t border-gray-100 flex items-center justify-between text-sm text-gray-600">
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex-1 truncate text-xs">
                  {userProfile?.email || "No email"}
                </div>
              </div>

              <button
                onClick={handleSignOut}
                className="flex items-center gap-2 text-gray-600 hover:text-red-500 p-2 rounded-md transition-colors"
                title="Sign out"
                aria-label="Sign out"
                disabled={signingOut}
              >
                {signingOut ? (
                  <Loader2 className="animate-spin" size={16} />
                ) : (
                  <LogOut size={16} />
                )}
                <span className="hidden md:inline text-xs">Sign out</span>
              </button>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      <main className="flex-1 flex flex-col">
        <header className="w-full bg-white border-b border-gray-100 p-3 md:hidden flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              className="p-2 rounded-md bg-[#4eb0e3] text-white hover:bg-[#3ca0d4]"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open menu"
            >
              <Menu size={18} />
            </button>

            <div className="text-lg font-semibold">Admin Panel</div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleSignOut}
              className="p-2 rounded-md hover:bg-gray-100"
              aria-label="Sign out"
              disabled={signingOut}
            >
              {signingOut ? (
                <Loader2 className="animate-spin" size={18} />
              ) : (
                <LogOut size={18} />
              )}
            </button>
          </div>
        </header>

        <div className="p-3 md:p-6 flex-1 overflow-auto">
          <div className="bg-white rounded-2xl shadow-sm p-4 md:p-6 min-h-[80vh] overflow-x-auto">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
}
