import React from "react";
import Navbar from "./Navbar";
import Header from "./Header";
import ProdcutShowCase from "./ProdcutShowCase";
import Card from "./Card";
import TrendingProduct from "./TrendingProduct";
import MaskThermometer from "../assets/MaskThermometer.webp";
import { Link } from "react-router-dom";

export default function Home() {
  return (
    <>
      <Header />
      <Navbar />
      <ProdcutShowCase />
      <h1>Featured Products</h1>
      <div className="grid grid-cols-4 gap-6">
        {/* TODO: Use Mapping to render multiple cards components */}
        {/* Left Column - Tall Banners */}
        <div className="flex flex-col gap-6 col-span-1">
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
      {/* <TrendingProduct /> */}
      <div className="py-25 bg-gray-100 my-20 flex">
        <div className="h-[200px]">
          <img src={MaskThermometer} />
        </div>
        <div className="h-[300px] text-black flex flex-col">
          <div className="text-left">
            <h5>N95 Facial Covering Mask</h5>
            <h1>
              Grade A Safety Masks For Sale. <br />
              Hurry Up!
            </h1>
            <p>
              Over 39,000 people work for us in more than 70 countries all over
              the This breadth of global coverage, combined with specialist
              services
            </p>
          </div>
          <div className="flex flex-row gap-20 text-left">
            <ul>
              <li>Activated carbon</li>
              <li>6 layer Filtration</li>
            </ul>
            <ul>
              <li>Breathing Valve</li>
              <li>Rewashes & Reusaable</li>
            </ul>
          </div>
          <div className="text-left">
            {/* <Link>LEARN MORE</Link> */}
            <p>LEARN MORE</p>
            {/* TODO: FIX LINK TAG ABOVE */}
          </div>
        </div>
      </div>
    </>
  );
}
