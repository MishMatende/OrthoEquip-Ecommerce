import {
  FaFacebookF,
  FaTwitter,
  FaYoutube,
  FaTiktok,
  FaInstagram,
} from "react-icons/fa";
import {
  FaLocationDot,
  FaPhone,
  FaEnvelope,
  FaX,
  FaXTwitter,
} from "react-icons/fa6";
import React from "react";
import { Link } from "react-router-dom";
import { UserAuth } from "../context/AuthContext";
import BalmOrthoLogo from "../assets/BalmOrthoLogo.png";

export default function Footer() {
  const { session } = UserAuth();

  return (
    <footer className="bg-[#0d1224] text-gray-300 py-10 px-6 md:px-16">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-5 gap-10">
        {/* Left section */}
        <div className="md:col-span-2">
          <div className="flex items-center mb-4 space-x-2">
            <img
              src={BalmOrthoLogo}
              className="h-[50px]"
              alt="Balm Ortho image"
            />
            <h2 className="text-2xl font-semibold text-white">Balm Ortho</h2>
          </div>
          <p className="text-sm text-left leading-6 mb-4">
            Lorem Ipsum is simply dummy text of the and typesetting industry.
            Lorem Ipsum is dummy text of the printing.
          </p>

          <ul className="space-y-2 text-sm">
            {/* <li className="flex items-center space-x-2">
              <FaLocationDot className="text-teal-500" />
              <span>Brooklyn, New York, United States</span>
            </li> */}
            <li className="flex items-center space-x-2">
              <FaPhone className="text-teal-500" />
              <span>(+254)100-219-639</span>
            </li>
            <li className="flex items-center space-x-2">
              <FaEnvelope className="text-teal-500" />
              <span>balmortho93@gmail.com</span>
            </li>
          </ul>

          {/* Social icons */}
          <div className="flex space-x-4 mt-5 text-xl">
            <Link to="https://www.facebook.com/profile.php?id=61580544819951">
              <FaFacebookF className="hover:text-teal-400 cursor-pointer" />
            </Link>
            <Link to="https://x.com/BalmOrtho?t=GC7gm5ojOPYqG3Agl85BmQ&s=09">
              <FaXTwitter className="hover:text-teal-400 cursor-pointer" />
            </Link>
            <Link to="https://vm.tiktok.com/ZMHc5xsa9rJev-RGEZS/">
              <FaTiktok className="hover:text-teal-400 cursor-pointer" />
            </Link>
            <Link to="https://www.instagram.com/balm.ortho93/#">
              <FaInstagram className="hover:text-teal-400 cursor-pointer" />
            </Link>
          </div>
        </div>

        {/* Company */}
        <div>
          <h3 className="text-lg font-semibold text-white mb-4">Company</h3>
          <ul className="space-y-2 text-sm">
            <Link to="/">
              <li>Home</li>
            </Link>
            <Link to="/">
              <li>About</li>
            </Link>
            <Link to="/shop">
              <li>Products</li>
            </Link>
            <Link to="/">
              <li>FAQ</li>
            </Link>
            <Link to="/contact">
              <li>Contact us</li>
            </Link>
            {session && (
              <Link to="/orders">
                <li>My Orders</li>
              </Link>
            )}
          </ul>
        </div>

        {/* Services */}
        <div>
          <h3 className="text-lg font-semibold text-white mb-4">Services</h3>
          <ul className="space-y-2 text-sm">
            <Link to="/signin">
              <li>Login</li>
            </Link>
            <Link to="/">
              <li>My account</li>
            </Link>
            <Link to="/">
              <li>Terms & Conditions</li>
            </Link>
          </ul>
        </div>

        <div className="mt-6 flex flex-col content-center justify-start">
          <h4 className="text-white font-medium mb-3">We Accept</h4>
          <div className="flex justify-evenly">
            <img
              src="https://upload.wikimedia.org/wikipedia/commons/0/04/Visa.svg"
              alt="Visa"
              className="h-6"
            />
            <img
              src="https://upload.wikimedia.org/wikipedia/commons/1/15/M-PESA_LOGO-01.svg"
              alt="MPESA"
              className="h-6 bg-white"
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
