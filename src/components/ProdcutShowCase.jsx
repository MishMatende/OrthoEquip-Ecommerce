import React, { useState, useEffect } from "react";

export default function ProductShowCase() {
  const slides = [
    {
      title: "Gold Standard Pre-Workout",
      subtitle: "Up to 50% off today only!",
      price: "$16.99",
      button: "Shop Now",
      bg: "bg-gray-100",
    },
    {
      title: "Muscle Gain Formula",
      subtitle: "Buy 1 get 1 free!",
      price: "$24.99",
      button: "Shop Now",
      bg: "bg-emerald-50",
    },
    {
      title: "Protein Blend Deluxe",
      subtitle: "Save 30% this week!",
      price: "$19.99",
      button: "Shop Now",
      bg: "bg-orange-50",
    },
  ];

  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % slides.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [slides.length]);

  return (
    <div className="w-full py-10 px-6 h-[1000px]">
      <div className="max-w-7xl mx-auto grid md:grid-cols-3 gap-6">
        <div
          className={`col-span-2 p-10 flex flex-col justify-center transition-all duration-500 ${slides[current].bg}`}
        >
          <p className="text-emerald-700 font-semibold mb-2">
            {slides[current].subtitle}
          </p>
          <h2 className="text-4xl font-extrabold text-gray-900 leading-tight mb-3">
            {slides[current].title}
          </h2>
          <p className="text-amber-500 font-medium mb-6">
            Starting at {slides[current].price}
          </p>
          <button className="bg-emerald-700 hover:bg-emerald-800 text-white font-semibold py-3 px-8 rounded-sm transition">
            {slides[current].button}
          </button>

          <div className="flex space-x-2 mt-8">
            {slides.map((_, i) => (
              <span
                key={i}
                onClick={() => setCurrent(i)}
                className={`h-2 w-2 rounded-full cursor-pointer transition ${
                  i === current ? "bg-emerald-700" : "bg-gray-300"
                }`}
              ></span>
            ))}
          </div>
        </div>

        <div className="flex flex-col space-y-6">
          <div className="bg-orange-50 p-6 flex justify-between items-center rounded-sm">
            <div>
              <h3 className="text-xl font-extrabold text-gray-900 mb-1">
                First Aid Kits <br /> Pre Package
              </h3>
              <p className="text-amber-500 text-sm font-medium mb-3">
                Starting at $16.99
              </p>
              <button className="bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-semibold py-2 px-4 rounded-sm transition">
                Shop Now →
              </button>
            </div>
            <img
              src="https://i.imgur.com/WXf5KqY.png"
              alt="First Aid Kit"
              className="w-28 h-28 object-contain"
            />
          </div>

          <div className="bg-teal-50 p-6 flex justify-between items-center rounded-sm">
            <div>
              <p className="text-emerald-700 text-sm font-semibold mb-1">
                Hot product
              </p>
              <h3 className="text-xl font-extrabold text-gray-900 mb-1">
                Hand Sanitizer <br /> Package
              </h3>
              <p className="text-orange-500 font-semibold mb-3">
                $199.00 <span className="text-gray-500 text-sm">/60%</span>
              </p>
              <button className="bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-semibold py-2 px-4 rounded-sm transition">
                Shop Now →
              </button>
            </div>
            <img
              src="https://i.imgur.com/Fq7pI1v.png"
              alt="Hand Sanitizer"
              className="w-24 h-28 object-contain"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
