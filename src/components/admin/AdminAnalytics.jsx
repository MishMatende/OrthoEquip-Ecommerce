import { useEffect, useState } from "react";
import { supabase } from "../../supabaseClient";
import { Loader2 } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

export default function AdminAnalytics() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = async () => {
    setLoading(true);

    // Fetch all orders
    const { data: orders, error } = await supabase.from("orders").select("*");
    if (error) {
      console.error("Error fetching analytics:", error);
      setLoading(false);
      return;
    }

    // KPI calculations
    const totalOrders = orders.length;
    const totalRevenue = orders.reduce(
      (sum, o) => sum + Number(o.total_amount || 0),
      0
    );
    const deliveredOrders = orders.filter(
      (o) => o.status === "delivered"
    ).length;
    const pendingOrders = orders.filter((o) => o.status === "pending").length;

    // Revenue by month
    const revenueByMonth = {};
    orders.forEach((order) => {
      const date = new Date(order.created_at);
      const month = date.toLocaleString("default", { month: "short" });
      const key = `${month} ${date.getFullYear()}`;
      revenueByMonth[key] =
        (revenueByMonth[key] || 0) + Number(order.total_amount || 0);
    });

    const revenueData = Object.entries(revenueByMonth).map(
      ([month, total]) => ({
        month,
        total,
      })
    );

    // Orders by status (for pie chart)
    const statusCounts = orders.reduce((acc, order) => {
      const s = order.status || "unknown";
      acc[s] = (acc[s] || 0) + 1;
      return acc;
    }, {});

    const pieData = Object.entries(statusCounts).map(([status, count]) => ({
      status,
      count,
    }));

    setStats({
      totalOrders,
      totalRevenue,
      deliveredOrders,
      pendingOrders,
      revenueData,
      pieData,
    });
    setLoading(false);
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#9b59b6"];

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-6">Analytics Dashboard</h1>

      {loading ? (
        <div className="flex justify-center items-center h-64 text-gray-500">
          <Loader2 className="w-6 h-6 animate-spin mr-2" />
          Loading analytics...
        </div>
      ) : (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white p-4 rounded-xl shadow text-center">
              <p className="text-gray-500 text-sm">Total Revenue (KES)</p>
              <h2 className="text-2xl font-bold">
                {stats.totalRevenue.toFixed(2)}
              </h2>
            </div>
            <div className="bg-white p-4 rounded-xl shadow text-center">
              <p className="text-gray-500 text-sm">Total Orders</p>
              <h2 className="text-2xl font-bold">{stats.totalOrders}</h2>
            </div>
            <div className="bg-white p-4 rounded-xl shadow text-center">
              <p className="text-gray-500 text-sm">Delivered</p>
              <h2 className="text-2xl font-bold text-green-600">
                {stats.deliveredOrders}
              </h2>
            </div>
            <div className="bg-white p-4 rounded-xl shadow text-center">
              <p className="text-gray-500 text-sm">Pending</p>
              <h2 className="text-2xl font-bold text-yellow-600">
                {stats.pendingOrders}
              </h2>
            </div>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Revenue Line Chart */}
            <div className="bg-white p-4 rounded-xl shadow">
              <h3 className="font-semibold mb-3">Revenue by Month</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={stats.revenueData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="total"
                    stroke="#0680cd"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Orders by Status Pie Chart */}
            <div className="bg-white p-4 rounded-xl shadow">
              <h3 className="font-semibold mb-3">Orders by Status</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={stats.pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={120}
                    fill="#8884d8"
                    dataKey="count"
                    label={({ status }) => status}
                  >
                    {stats.pieData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
