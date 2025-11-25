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
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <AnimatePresence>
        {(sidebarOpen || window.innerWidth >= 768) && (
          <motion.aside
            initial={{ x: -300 }}
            animate={{ x: 0 }}
            exit={{ x: -300 }}
            transition={{ type: "spring", stiffness: 120, damping: 20 }}
            className={`fixed md:static z-30 top-0 left-0 h-screen w-64 bg-white text-gray-800 flex flex-col shadow-lg border-r border-gray-200`}
          >
            {/* Header */}
            <div className="px-6 py-5 text-2xl font-bold border-b border-gray-100 flex justify-between items-center">
              Admin Panel
              <button
                className="md:hidden text-gray-600 hover:text-[#4eb0e3]"
                onClick={() => setSidebarOpen(false)}
              >
                <X size={22} />
              </button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 space-y-1 min-h-[90vh]">
              {navItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === "/admin"}
                  onClick={() => setSidebarOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-6 py-2.5 rounded-xl transition-all duration-200 ${
                      isActive
                        ? "bg-[#4eb0e3] text-white font-medium shadow-sm"
                        : "hover:bg-gray-100 text-gray-700 hover:text-[#4eb0e3]"
                    }`
                  }
                >
                  {item.icon}
                  <span>{item.name}</span>
                </NavLink>
              ))}
            </nav>

            {/* Footer */}
            <div className="p-4 border-t border-gray-100 flex items-center justify-between text-sm text-gray-600">
              <span className="truncate">{userProfile?.email}</span>
              <button
                onClick={signoutUser}
                className="hover:text-red-500 transition-colors cursor-pointer"
                title="Sign out"
              >
                <LogOut size={18} />
              </button>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Main Content */}
      {/* Note: added overflow-x-auto on main so content can be scrolled horizontally on small screens */}
      <main className="flex-1 md:mx-2 p-3 transition-all overflow-x-auto">
        {/* Mobile Topbar */}
        <div className="md:hidden flex items-center justify-between mb-6">
          <button
            className="text-gray-700 hover:text-[#4eb0e3]"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu size={24} />
          </button>
          <span className="font-semibold text-lg text-gray-800">
            Admin Panel
          </span>
          <div className="w-6" /> {/* spacer */}
        </div>

        {/* Main outlet area */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-white rounded-2xl shadow-md p-4 md:p-6 min-h-[90vh]"
        >
          {/* This inner wrapper allows the content inside Outlet to define its width.
              If the page content (eg a wide table) is wider than the screen, it will produce a horizontal scrollbar. */}
          <div className="overflow-x-auto">
            <div className="min-w-max">
              <Outlet />
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
