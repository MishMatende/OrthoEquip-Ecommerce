import { Outlet, NavLink, useLocation } from "react-router-dom";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { UserAuth } from "../../context/AuthContext";
import {
  LogOut,
  Menu,
  X,
  LayoutDashboard,
  Package,
  ShoppingCart,
  BarChart2,
  Settings,
} from "lucide-react";

export default function AdminLayout() {
  const { userProfile, signoutUser } = UserAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

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

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Sidebar */}
      <AnimatePresence>
        {(sidebarOpen || window.innerWidth >= 768) && (
          <motion.aside
            initial={{ x: -300 }}
            animate={{ x: 0 }}
            exit={{ x: -300 }}
            transition={{ type: "spring", stiffness: 120, damping: 20 }}
            className={`fixed md:static z-30 top-0 left-0 h-full w-64 backdrop-blur-xl bg-[#0680cd]/90 text-white flex flex-col shadow-xl border-r border-white/10`}
          >
            {/* Header */}
            <div className="px-6 py-4 text-2xl font-bold border-b border-white/20 flex justify-between items-center">
              Admin Panel
              <button
                className="md:hidden text-white"
                onClick={() => setSidebarOpen(false)}
              >
                <X size={22} />
              </button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 mt-6 space-y-1">
              {navItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === "/admin"}
                  onClick={() => setSidebarOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-6 py-2.5 rounded-r-full transition-all duration-200 ${
                      isActive
                        ? "bg-white text-[#0680cd] shadow-md font-semibold"
                        : "hover:bg-white/20 hover:translate-x-1"
                    }`
                  }
                >
                  {item.icon}
                  {item.name}
                </NavLink>
              ))}
            </nav>

            {/* Footer */}
            <div className="p-4 border-t border-white/20 flex items-center justify-between text-sm">
              <span className="truncate opacity-80">{userProfile?.email}</span>
              <button
                onClick={signoutUser}
                className="hover:text-red-200 transition-colors"
                title="Sign out"
              >
                <LogOut size={18} />
              </button>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="flex-1 md:mx-2 transition-all p-2">
        {/* Mobile Topbar */}
        <div className="md:hidden flex items-center justify-between mb-6">
          <button
            className="text-gray-700 hover:text-[#0680cd]"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu size={24} />
          </button>
          <span className="font-semibold text-lg">Admin Panel</span>
          <div className="w-6" /> {/* spacer */}
        </div>

        {/* Breadcrumb */}
        {/* <div className="text-sm text-gray-500 mb-4">
          Admin /{" "}
          {location.pathname.split("/").slice(2).join(" / ") || "Dashboard"}
        </div> */}

        {/* Outlet renders the nested admin pages */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-white rounded-xl shadow-sm p-4 md:p-6 min-h-[90vh]"
        >
          <Outlet />
        </motion.div>
      </main>
    </div>
  );
}
