import { ChevronDown } from "lucide-react";
import {
  FaFacebookF,
  FaTwitter,
  FaYoutube,
  FaVimeoV,
  FaTiktok,
} from "react-icons/fa";

import mailIcon from "../assets/mail (1).svg";
import phoneIcon from "../assets/phone.svg";
import mapPinIcon from "../assets/map-pin.svg";

export default function TopBar() {
  return (
    <div className="w-full border-b border-gray-200 bg-slate-50 text-gray-700 text-sm">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between px-4 md:px-6 py-1 gap-2 md:gap-0">
        {/* Contact info */}
        <div className="flex flex-row items-center justify-between w-full gap-3">
          {/* Email */}
          <div className="flex items-center gap-2 text-xs md:text-sm">
            <img src={mailIcon} alt="Mail icon" className="w-4 h-4" />
            <a
              href="mailto:balmortho93@gmail.com"
              className="hover:text-[#0680cd] break-all"
            >
              balmortho93@gmail.com
            </a>
          </div>

          {/* Phone */}
          <div className="flex items-center gap-2 text-xs md:text-sm">
            <img src={phoneIcon} alt="Phone icon" className="w-4 h-4" />
            <span className="text-gray-800">(+254) 100-219-639</span>
          </div>

          {/* Location */}
          <div className="hidden md:flex items-center gap-2">
            <img src={mapPinIcon} alt="Location icon" className="w-4 h-4" />
            <span className="font-medium">Nairobi, Kenya</span>
          </div>
        </div>

        {/* Language + Social icons */}
        {/* <div className="hidden md:flex items-center gap-6"> */}
        {/* Language selector */}
        {/* <div className="flex items-center gap-1 cursor-pointer hover:text-[#0680cd]"> */}
        {/* <span>English</span> */}
        {/* <ChevronDown size={14} /> */}
        {/* </div> */}

        {/* Social icons */}
        {/* <div className="flex items-center gap-4"> */}
        {/* <FaFacebookF className="hover:text-[#0680cd] cursor-pointer" /> */}
        {/* <FaTwitter className="hover:text-[#0680cd] cursor-pointer" /> */}
        {/* <FaYoutube className="hover:text-[#0680cd] cursor-pointer" /> */}
        {/* <FaVimeoV className="hover:text-[#0680cd] cursor-pointer" /> */}
        {/* <FaTiktok className="hover:text-[#0680cd] cursor-pointer" /> */}
        {/* </div> */}
        {/* </div> */}
      </div>
    </div>
  );
}
