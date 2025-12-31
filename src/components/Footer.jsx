import { FaFacebookF, FaTiktok, FaInstagram } from "react-icons/fa";
import { FaPhone, FaEnvelope, FaXTwitter } from "react-icons/fa6";
import React from "react";
import { Link } from "react-router-dom";
import { UserAuth } from "../context/AuthContext";
import BalmOrthoLogo from "../assets/BalmOrthoLogo.png";

export default function Footer() {
  const { session } = UserAuth();

  return (
    <footer className="bg-[#0d1224] text-gray-300 px-6 md:px-16 py-12">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-10">
        {/* LEFT: Brand / About */}
        <div className="md:col-span-4">
          <div className="flex items-center mb-4 space-x-2">
            <img
              src={BalmOrthoLogo}
              className="h-[50px]"
              alt="Balm Ortho Medical Supplies Logo"
            />
            <h2 className="text-2xl font-semibold text-white">
              Balm Ortho Medical Supplies
            </h2>
          </div>

          <p className="text-sm leading-6 mb-4">
            Kenya’s dedicated e-commerce platform for orthopedic and general
            medical supplies — supporting hospitals, clinics and healthcare
            professionals with certified products and dependable delivery.
          </p>

          <ul className="space-y-2 text-sm">
            <li className="flex items-center space-x-2">
              <FaPhone className="text-teal-500" />
              <span>(+254) 100-219-639</span>
            </li>
            <li className="flex items-center space-x-2">
              <FaEnvelope className="text-teal-500" />
              <span>balmortho93@gmail.com</span>
            </li>
          </ul>

          {/* Socials */}
          <div className="flex space-x-4 mt-5 text-xl">
            <Link to="https://www.facebook.com/profile.php?id=61580544819951">
              <FaFacebookF className="hover:text-teal-400" />
            </Link>
            <Link to="https://x.com/BalmOrtho?t=GC7gm5ojOPYqG3Agl85BmQ&s=09">
              <FaXTwitter className="hover:text-teal-400 cursor-pointer" />
            </Link>
            <Link to="https://vm.tiktok.com/ZMHc5xsa9rJev-RGEZS/">
              <FaTiktok className="hover:text-teal-400" />
            </Link>
            <Link to="https://www.instagram.com/balm.ortho93/#">
              <FaInstagram className="hover:text-teal-400" />
            </Link>
          </div>
        </div>

        {/* RIGHT: Company + Services + Payments */}
        <div className="md:col-span-8 grid grid-cols-1 sm:grid-cols-3 gap-8">
          {/* Company */}
          <div className="flex flex-row justify-center gap-10 md:justify-between">
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">Company</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link to="/">Home</Link>
                </li>
                <li>
                  <Link to="/about">About</Link>
                </li>
                <li>
                  <Link to="/shop">Products</Link>
                </li>
                <li>
                  <Link to="/contact">Contact us</Link>
                </li>
                {session && (
                  <li>
                    <Link to="/orders">My Orders</Link>
                  </li>
                )}
              </ul>
            </div>

            {/* Services */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">
                Services
              </h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link to="/signin">Login</Link>
                </li>
                {/* <li>
                  <Link to="/">Profile</Link>
                </li> */}
                <li>
                  <Link to="/about#about-policies">Terms & Conditions</Link>
                </li>
                <li>
                  <Link to="/about#about-FAQs">FAQ</Link>
                </li>
              </ul>
            </div>
          </div>

          {/* Payments */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">
              Payment Methods
            </h3>
            <div className="flex gap-5 justify-center">
              <img
                src="https://upload.wikimedia.org/wikipedia/commons/0/04/Visa.svg"
                alt="Visa"
                className="h-6"
              />
              <img
                src="https://upload.wikimedia.org/wikipedia/commons/1/15/M-PESA_LOGO-01.svg"
                alt="MPESA"
                className="h-6 bg-white p-1 rounded"
              />
              <img
                src="https://upload.wikimedia.org/wikipedia/commons/a/a4/Mastercard_2019_logo.svg"
                alt="Mastercard"
                className="h-6"
              />
              <img
                src="https://upload.wikimedia.org/wikipedia/commons/3/30/American_Express_logo.svg"
                alt="American Express"
                className="h-6"
              />
            </div>
          </div>
        </div>
      </div>
      {/* Bottom copyright bar */}
      <div className="border-t border-white/10 mt-10 pt-6 text-sm text-gray-400">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 px-6 md:px-16">
          <p className="text-center md:text-left">
            © {new Date().getFullYear()}{" "}
            <span className="text-white">Balm Ortho Medical Supplies</span>. All
            rights reserved.
          </p>

          <div className="flex space-x-4 text-sm">
            <Link to="/about#about-policies" className="hover:text-teal-400">
              Privacy Policy
            </Link>
            <span className="opacity-40">|</span>
            <Link to="/about#about-policies" className="hover:text-teal-400">
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
