import { FaFacebookF, FaTwitter, FaYoutube, FaTiktok } from "react-icons/fa";
import { FaLocationDot, FaPhone, FaEnvelope } from "react-icons/fa6";
import React from "react";

export default function Footer() {
  return (
    <footer className="bg-[#0d1224] text-gray-300 py-10 px-6 md:px-16">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-5 gap-10">
        {/* Left section */}
        <div className="md:col-span-2">
          <div className="flex items-center mb-4 space-x-2">
            <div className="bg-teal-500 p-2 rounded-full">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="white"
                className="w-5 h-5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-semibold text-white">Vicodin</h2>
          </div>
          <p className="text-sm leading-6 mb-4">
            Lorem Ipsum is simply dummy text of the and typesetting industry.
            Lorem Ipsum is dummy text of the printing.
          </p>

          <ul className="space-y-2 text-sm">
            <li className="flex items-center space-x-2">
              <FaLocationDot className="text-teal-500" />
              <span>Brooklyn, New York, United States</span>
            </li>
            <li className="flex items-center space-x-2">
              <FaPhone className="text-teal-500" />
              <span>+0123-456789</span>
            </li>
            <li className="flex items-center space-x-2">
              <FaEnvelope className="text-teal-500" />
              <span>example@example.com</span>
            </li>
          </ul>

          {/* Social icons */}
          <div className="flex space-x-4 mt-5 text-xl">
            <FaFacebookF className="hover:text-teal-400 cursor-pointer" />
            <FaTwitter className="hover:text-teal-400 cursor-pointer" />
            <FaYoutube className="hover:text-teal-400 cursor-pointer" />
            <FaTiktok className="hover:text-teal-400 cursor-pointer" />
          </div>
        </div>

        {/* Company */}
        <div>
          <h3 className="text-lg font-semibold text-white mb-4">Company</h3>
          <ul className="space-y-2 text-sm">
            <li>About</li>
            <li>Blog</li>
            <li>All Products</li>
            <li>Locations Map</li>
            <li>FAQ</li>
            <li>Contact us</li>
          </ul>
        </div>

        {/* Services */}
        <div>
          <h3 className="text-lg font-semibold text-white mb-4">Services</h3>
          <ul className="space-y-2 text-sm">
            <li>Order tracking</li>
            <li>WishList</li>
            <li>Login</li>
            <li>My account</li>
            <li>Terms & Conditions</li>
            <li>Promotional Offers</li>
          </ul>
        </div>

        {/* Customer Care */}
        <div>
          <h3 className="text-lg font-semibold text-white mb-4">
            Customer Care
          </h3>
          <ul className="space-y-2 text-sm">
            <li>Login</li>
            <li>My account</li>
            <li>Wishlist</li>
            <li>Order tracking</li>
            <li>FAQ</li>
            <li>Contact us</li>
          </ul>
        </div>

        <div className="mt-6">
          <h4 className="text-white font-medium mb-2">We Accept</h4>
          <div className="flex space-x-3">
            <img
              src="https://upload.wikimedia.org/wikipedia/commons/0/04/Visa.svg"
              alt="Visa"
              className="h-6"
            />
            <img
              src="https://upload.wikimedia.org/wikipedia/commons/5/5a/Discover_Card_logo.svg"
              alt="Discover"
              className="h-6"
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
    </footer>
  );
}
