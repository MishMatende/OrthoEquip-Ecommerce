import React from "react";

export default function Card() {
  return (
    <div className="bg-white p-4 rounded-md shadow-sm hover:shadow-md transition">
      <div className="relative">
        <span className="absolute top-2 right-2 bg-emerald-700 text-white text-xs font-semibold px-2 py-1 rounded-sm">
          -15%
        </span>

        <img
          src="https://i.imgur.com/0hK7JXf.png"
          alt="Product"
          className="w-full h-48 object-contain bg-gray-50"
        />
      </div>

      <div className="mt-4">
        <h3 className="font-semibold text-gray-900 text-sm mb-1 text-left">
          M. n/s product title
        </h3>
        <div className="flex items-center space-x-2">
          <span className="text-gray-900 font-bold">$110.00</span>
          <span className="text-red-500 line-through text-sm"></span>
          {/*TODO: conditional rendering for discounted amount.*/}
        </div>
      </div>
    </div>
  );
}
