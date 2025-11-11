import { useEffect, useState } from "react";
import { supabase } from "../../supabaseClient";
import {
  Loader2,
  Package,
  DollarSign,
  ShoppingBag,
  AlertTriangle,
} from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    setLoading(true);

    const { data: orders } = await supabase.from("orders").select("*");
    const { data: products } = await supabase.from("products").select("*");

    const totalOrders = orders?.length || 0;
    const totalRevenue = orders?.reduce(
      (sum, o) => sum + Number(o.total_amount || 0),
      0
    );
    const totalProducts = products?.length || 0;
    const lowStock = products?.filter((p) => p.stock < 5).length || 0;

    setStats({
      totalOrders,
      totalRevenue,
      totalProducts,
      lowStock,
    });
    setLoading(false);
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return (
    <div className="p-6 space-y-8">
      <div className="flex items-center justify-end">
        <button
          onClick={fetchStats}
          className="bg-[#4eb0e3] text-white px-4 py-2 rounded-md hover:bg-[#056fb1] transition"
        >
          Refresh
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64 text-gray-500">
          <Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading dashboard...
        </div>
      ) : (
        <>
          {/* Stats Cards */}
          <motion.div
            layout
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            <StatCard
              title="Total Orders"
              value={stats.totalOrders}
              icon={<ShoppingBag className="w-6 h-6 text-blue-500" />}
              gradient="from-blue-500/10 to-blue-500/5"
            />
            <StatCard
              title="Total Revenue (KES)"
              value={`${stats.totalRevenue.toFixed(2)}`}
              icon={<DollarSign className="w-6 h-6 text-green-500" />}
              gradient="from-green-500/10 to-green-500/5"
            />
            <StatCard
              title="Products"
              value={stats.totalProducts}
              icon={<Package className="w-6 h-6 text-purple-500" />}
              gradient="from-purple-500/10 to-purple-500/5"
            />
            <StatCard
              title="Low Stock"
              value={stats.lowStock}
              icon={<AlertTriangle className="w-6 h-6 text-amber-500" />}
              gradient="from-amber-500/10 to-amber-500/5"
            />
          </motion.div>

          {/* Quick Links */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-10"
          >
            <LinkButton to="/admin/products" label="Manage Products" />
            <LinkButton to="/admin/orders" label="View Orders" />
            <LinkButton to="/admin/analytics" label="Analytics Dashboard" />
          </motion.div>
        </>
      )}
    </div>
  );
}

/* ✅ Modern Card Component */
function StatCard({ title, value, icon, gradient }) {
  return (
    <motion.div
      whileHover={{ y: -6 }}
      transition={{ type: "spring", stiffness: 300, damping: 15 }}
      className={`p-5 rounded-xl bg-gradient-to-br ${gradient} backdrop-blur-md shadow-sm hover:shadow-md transition`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500 font-medium">{title}</p>
          <h2 className="text-2xl font-semibold text-gray-800 mt-1">{value}</h2>
        </div>
        <div className="p-2 bg-white/70 rounded-lg shadow-inner">{icon}</div>
      </div>
    </motion.div>
  );
}

/* ✅ Reusable button links */
function LinkButton({ to, label }) {
  return (
    <Link
      to={to}
      className="bg-[#4eb0e3] hover:bg-[#056fb1] text-white text-center py-3 rounded-lg font-medium shadow-md hover:shadow-lg transition"
    >
      {label}
    </Link>
  );
}
