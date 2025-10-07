import React from "react";
import { Mail, MapPin, ChevronDown } from "lucide-react";
import {
  FaFacebookF,
  FaTwitter,
  FaYoutube,
  FaVimeoV,
  FaTiktok,
} from "react-icons/fa";

export default function InfoBanner() {
  return (
    <div className="w-full bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-2 text-sm text-gray-700">
        <div className="flex justify-between gap-6 w-full">
          <div className="flex items-center gap-2">
            <Mail size={16} className="text-teal-600" />
            <a
              href="mailto:hnyambura1997@gmail.com"
              className="hover:text-teal-600"
            >
              hnyambura1997@gmail.com
            </a>
          </div>
          <div className="flex items-center gap-2">
            <MapPin size={16} className="text-teal-600" />
            <span className="font-medium">Nairobi, Kenya</span>
          </div>
        </div>
        {/* <div className="flex items-center gap-6">
          <div className="flex items-center gap-1 cursor-pointer hover:text-teal-600">
            <span>English</span>
            <ChevronDown size={14} />
          </div>
          <div className="flex items-center gap-4 text-gray-700">
            <FaFacebookF className="hover:text-teal-600 cursor-pointer" />
            <FaTwitter className="hover:text-teal-600 cursor-pointer" />
            <FaYoutube className="hover:text-teal-600 cursor-pointer" />
            <FaVimeoV className="hover:text-teal-600 cursor-pointer" />
            <FaTiktok className="hover:text-teal-600 cursor-pointer" />
          </div>
        </div> */}
      </div>
    </div>
  );
}
