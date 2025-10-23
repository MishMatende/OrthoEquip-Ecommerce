import React from "react";
import ProductShowCase from "../ProductShowCase";
import Card from "../Card";
import MaskThermometer from "../../assets/MaskThermometer.webp";
import { Check } from "lucide-react";

export default function Home() {
  return (
    <>
      <section className="mx-[0%] lg:mx-[2%] xl:mx-[20%] text-center">
        <ProductShowCase />
        <h1 className="text-black pb-10">Featured Products</h1>
        <div className="grid grid-cols-3 xl:grid-cols-4 gap-6">
          {/* TODO: Use Mapping to render multiple cards components */}
          {/* Left Column - Tall Banners */}
          <div className="flex flex-row xl:flex-col gap-6 col-span-3 xl:col-span-1 justify-center">
            <Card className="h-[300px]" />
            <Card className="h-[300px]" />
          </div>

          {/* Right Section - Product Grid */}
          <div className="col-span-3 grid grid-cols-3 gap-6">
            {/* Top row */}
            <Card className="h-[200px]" />
            <Card className="h-[200px]" />
            <Card className="h-[200px]" />

            {/* Middle row */}
            <Card className="h-[200px]" />
            <Card className="h-[200px]" />
            <Card className="h-[200px]" />

            {/* Bottom row */}
            {/* <Card className="h-[200px]" /> */}
          </div>
        </div>
      </section>
      <section className="bg-gray-100 py-10">
        <div className="container mx-auto flex flex-col md:flex-row items-center justify-between min-h-[70vh] lg:px-8 ">
          {/* Left Image */}
          <div className="flex-1 flex justify-center md:justify-start">
            <img
              src={MaskThermometer}
              alt="N95 Mask"
              className="w-full max-w-sm md:max-w-md object-contain"
            />
          </div>

          {/* Right Text */}
          <div className="flex-1 flex flex-col pl-5 justify-center text-left space-y-6 text-gray-800">
            <div>
              <h5 className="text-sm text-blue-600 font-semibold uppercase tracking-wide">
                N95 Facial Covering Mask
              </h5>
              <h1 className="text-4xl md:text-5xl font-bold leading-tight">
                Grade A Safety Masks For Sale. <br /> Hurry Up!
              </h1>
              <p className="text-gray-600 mt-4 max-w-lg">
                Over 39,000 people work for us in more than 70 countries all
                over the world. This breadth of global coverage, combined with
                specialist services, ensures we deliver excellence everywhere.
              </p>
            </div>

            <div className="flex gap-20 mt-4">
              <ul className="list-none space-y-1">
                <li className="flex">
                  <Check />
                  Activated carbon
                </li>
                <li className="flex">
                  <Check />6 layer Filtration
                </li>
              </ul>
              <ul className="list-none space-y-1">
                <li className="flex">
                  <Check />
                  Breathing Valve
                </li>
                <li className="flex">
                  <Check />
                  Rewashes & Reusable
                </li>
              </ul>
            </div>

            <div>
              <p className="mt-6 font-semibold text-blue-600 hover:underline cursor-pointer">
                LEARN MORE
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-[0%] lg:mx-[2%] xl:mx-[20%] text-center">
        {/* Best Selling Product */}
        <h1 className="text-black pb-10">Best Selling</h1>
        <div className="grid grid-cols-4 gap-6 md:grid-cols-3">
          {/* TODO: Use Mapping to render multiple cards components */}
          {/* Left Column - Tall Banners */}
          {/* Right Section - Product Grid */}
          <div className="col-span-3 grid grid-cols-3 gap-6">
            {/* Top row */}
            <Card className="h-[200px]" />
            <Card className="h-[200px]" />
            <Card className="h-[200px]" />

            {/* Middle row */}
            <Card className="h-[200px]" />
            <Card className="h-[200px]" />
            <Card className="h-[200px]" />

            {/* Bottom row */}
            {/* <Card className="h-[200px]" /> */}
          </div>
        </div>
      </section>
    </>
  );
}
