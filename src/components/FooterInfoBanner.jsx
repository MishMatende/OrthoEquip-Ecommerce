import React from "react";
import { FaGift, FaTruck, FaMoneyBillWave, FaCreditCard } from "react-icons/fa";

export default function FooterInfoBanner() {
  const items = [
    {
      icon: <FaTruck className="text-4xl text-gray-800" />,
      title: "Guaranteed shipping",
      subtitle: "Same Day Delivery",
    },
    {
      icon: <FaMoneyBillWave className="text-4xl text-gray-800" />,
      title: "Worth Every  Penny",
      subtitle: "Don't compromise on quality!",
    },
    {
      icon: <FaCreditCard className="text-4xl text-gray-800" />,
      title: "Secure checkout",
      subtitle: "Personal Details Protected",
    },
  ];
  return (
    <section className="bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 text-center px-6">
        {items.map((item, index) => (
          <div key={index} className="flex flex-col items-center space-y-2">
            {item.icon}
            <h3 className="font-semibold text-gray-900">{item.title}</h3>
            <p className="text-sm text-gray-600">{item.subtitle}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
