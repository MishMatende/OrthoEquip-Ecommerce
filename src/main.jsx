import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Routes, BrowserRouter, Route } from "react-router-dom";
import { AuthContextProvider } from "./context/AuthContext";
import { CartProvider } from "./context/CartContext";
import "./index.css";
import App from "./App.jsx";
import Home from "./components/pages/Home";
import Shop from "./components/pages/Shop";
import ProductDetails from "./components/pages/ProductDetails";
import Contact from "./components/pages/Contact";
import Signin from "./components/Signin";
import Signup from "./components/Signup";
import AuthLayout from "./components/AuthLayout";
import Cart from "./components/pages/Cart";
import Checkout from "./components/pages/Checkout";
import OtherLayout from "./components/OtherLayout";
import OrderConfirmation from "./components/pages/OrderConfirmation";
import Orders from "./components/pages/Orders";
import CheckoutLayout from "./components/CheckoutLayout";
import OrderTracking from "./components/pages/OrderTracking";
import AdminLayout from "./components/admin/AdminLayout";
import AdminProducts from "./components/admin/AdminProducts";
import AdminOrders from "./components/admin/AdminOrders";
import AdminAnalytics from "./components/admin/AdminAnalytics";
import AdminDashboard from "./components/admin/AdminDashboard";
import AdminSettings from "./components/admin/AdminSettings";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <AuthContextProvider>
        <CartProvider>
          <Routes>
            <Route path="/" element={<App />}>
              <Route index element={<Home />} />
              <Route path="shop" element={<Shop />} />
              <Route path="shop/:id" element={<ProductDetails />} />
              <Route path="contact" element={<Contact />} />
              <Route path="cart" element={<Cart />} />
              <Route path="track/:orderId" element={<OrderTracking />} />
              <Route path="orders" element={<Orders />} />
              <Route
                path="order-confirmation/:orderId"
                element={<OrderConfirmation />}
              />
            </Route>
            <Route element={<CheckoutLayout />}>
              <Route path="checkout" element={<Checkout />} />
            </Route>
            <Route element={<AdminLayout />}>
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/products" element={<AdminProducts />} />
              <Route path="/admin/orders" element={<AdminOrders />} />
              <Route path="/admin/analytics" element={<AdminAnalytics />} />
              <Route path="/admin/settings" element={<AdminSettings />} />
            </Route>
            <Route element={<AuthLayout />}>
              <Route path="signin" element={<Signin />} />
              <Route path="signup" element={<Signup />} />
            </Route>
          </Routes>
        </CartProvider>
      </AuthContextProvider>
    </BrowserRouter>
  </StrictMode>
);
