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

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <AuthContextProvider>
      <CartProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<App />}>
              <Route index element={<Home />} />
              <Route path="shop" element={<Shop />} />
              <Route path="shop/:id" element={<ProductDetails />} />
              <Route path="contact" element={<Contact />} />
              <Route path="cart" element={<Cart />} />
            </Route>
            <Route element={<AuthLayout />}>
              <Route path="signin" element={<Signin />} />
              <Route path="signup" element={<Signup />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </CartProvider>
    </AuthContextProvider>
  </StrictMode>
);
