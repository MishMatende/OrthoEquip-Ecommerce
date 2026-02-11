import { StrictMode, Suspense, lazy } from "react";
import { createRoot } from "react-dom/client";
import { Routes, BrowserRouter, Route } from "react-router-dom";
import { AuthContextProvider } from "./context/AuthContext";
import { CartProvider } from "./context/CartContext";
import "./index.css";
import App from "./App.jsx";
import { Loader2 } from "lucide-react";
import About from "./components/pages/About";
import ResetPassword from "./components/ResetPassword";

// React Query
import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { queryClient } from "./lib/queryClient";
import PaymentCallback from "./components/pages/PaymentCallback";
import ForgotPassword from "./components/ForgotPassword";
import QuoteDetails from "./components/pages/QuoteDetails";
import Quotes from "./components/admin/Quotes";
import CreateQuote from "./components/admin/CreateQuote";
import CheckoutFromQuote from "./components/pages/CheckoutFromQuote";
import Profile from "./components/pages/Profile";
import QuoteDetailsAdmin from "./components/admin/QuoteDetailsAdmin";
import { Buffer } from "buffer";

// ✅ Lazy-load all pages and layouts
const Home = lazy(() => import("./components/pages/Home"));
const Shop = lazy(() => import("./components/pages/Shop"));
const ProductDetails = lazy(() => import("./components/pages/ProductDetails"));
const Contact = lazy(() => import("./components/pages/Contact"));
const Signin = lazy(() => import("./components/Signin"));
const Signup = lazy(() => import("./components/Signup"));
const AuthLayout = lazy(() => import("./components/AuthLayout"));
const Cart = lazy(() => import("./components/pages/Cart"));
const Checkout = lazy(() => import("./components/pages/Checkout"));
const CheckoutLayout = lazy(() => import("./components/CheckoutLayout"));
const OrderConfirmation = lazy(
  () => import("./components/pages/OrderConfirmation"),
);
const Orders = lazy(() => import("./components/pages/Orders"));
const OrderTracking = lazy(() => import("./components/pages/OrderTracking"));
const AdminLayout = lazy(() => import("./components/admin/AdminLayout"));
const AdminProducts = lazy(() => import("./components/admin/AdminProducts"));
const AdminOrders = lazy(() => import("./components/admin/AdminOrders"));
const AdminAnalytics = lazy(() => import("./components/admin/AdminAnalytics"));
const AdminDashboard = lazy(() => import("./components/admin/AdminDashboard"));
const AdminSettings = lazy(() => import("./components/admin/AdminSettings"));

// ✅ Global fallback loader (for Suspense)
const LoadingScreen = () => (
  <div className="min-h-screen flex flex-col items-center justify-center text-[#4eb0e3] bg-white">
    <Loader2 className="animate-spin w-8 h-8 mb-3" />
    <p className="text-gray-600 font-medium">Loading...</p>
  </div>
);

window.Buffer = Buffer;

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthContextProvider>
          <CartProvider>
            <Suspense fallback={<LoadingScreen />}>
              <Routes>
                {/* 🌐 Public Site Layout */}
                <Route path="/" element={<App />}>
                  <Route index element={<Home />} />
                  <Route path="shop" element={<Shop />} />
                  <Route path="shop/:id" element={<ProductDetails />} />
                  <Route path="contact" element={<Contact />} />
                  <Route path="cart" element={<Cart />} />
                  <Route path="track/:orderId" element={<OrderTracking />} />
                  <Route path="orders" element={<Orders />} />
                  <Route path="about" element={<About />} />
                  <Route
                    path="order-confirmation/:orderId"
                    element={<OrderConfirmation />}
                  />
                  <Route
                    path="/payment-callback"
                    element={<PaymentCallback />}
                  />
                  <Route path="/quote/:id" element={<QuoteDetails />} />
                  <Route
                    path="/checkout-from-quote/:id"
                    element={<CheckoutFromQuote />}
                  />
                  <Route path="profile" element={<Profile />} />
                </Route>

                {/* 🛒 Checkout Flow */}
                <Route element={<CheckoutLayout />}>
                  <Route path="checkout" element={<Checkout />} />
                </Route>

                {/* 🔐 Auth Pages */}
                <Route element={<AuthLayout />}>
                  <Route path="signin" element={<Signin />} />
                  <Route path="signup" element={<Signup />} />
                  <Route path="/reset-password" element={<ResetPassword />} />
                  <Route path="/forgot-password" element={<ForgotPassword />} />
                </Route>

                {/* ⚙️ Admin Section */}
                <Route element={<AdminLayout />}>
                  <Route path="/admin" element={<AdminDashboard />} />
                  <Route path="/admin/products" element={<AdminProducts />} />
                  <Route path="/admin/orders" element={<AdminOrders />} />
                  <Route path="/admin/analytics" element={<AdminAnalytics />} />
                  <Route path="/admin/settings" element={<AdminSettings />} />
                  <Route path="/admin/quotes" element={<Quotes />} />
                  <Route path="/admin/quotes/new" element={<CreateQuote />} />
                  <Route
                    path="/admin/quotes/:id"
                    element={<QuoteDetailsAdmin />}
                  />
                </Route>
              </Routes>
            </Suspense>
          </CartProvider>
        </AuthContextProvider>
      </BrowserRouter>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  </StrictMode>,
);
