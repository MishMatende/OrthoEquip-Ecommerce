// src/pages/Shop.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { products } from "../../data/products";
import Card from "../../components/Card";
import { Button } from "../../components/ui/button";
import { Slider } from "../../components/ui/slider";
import { Checkbox } from "../../components/ui/checkbox";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "../../components/ui/select";

export default function Shop() {
  const [priceRange, setPriceRange] = useState([0, 110]);
  const [inStock, setInStock] = useState(true);
  const [outStock, setOutStock] = useState(true);
  const [sort, setSort] = useState("A-Z");
  const navigate = useNavigate();

  // ----- Filtering -----
  const filteredProducts = products.filter((p) => {
    const inRange = p.price >= priceRange[0] && p.price <= priceRange[1];
    const stockFilter = (inStock && p.stock) || (outStock && !p.stock);
    return inRange && stockFilter;
  });

  // ----- Sorting -----
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    if (sort === "A-Z") return a.name.localeCompare(b.name);
    if (sort === "Z-A") return b.name.localeCompare(a.name);
    if (sort === "Low-High") return a.price - b.price;
    if (sort === "High-Low") return b.price - a.price;
    return 0;
  });

  return (
    <div className="grid grid-cols-12 gap-6 mt-8">
      {/* ====================== Sidebar ====================== */}
      <aside className="col-span-3 space-y-6">
        {/* Availability */}
        <div>
          <h3 className="font-semibold mb-2">Availability</h3>
          <div className="flex flex-col space-y-2">
            <label className="flex items-center gap-2">
              <Checkbox checked={inStock} onCheckedChange={setInStock} /> In
              Stock
            </label>
            <label className="flex items-center gap-2">
              <Checkbox checked={outStock} onCheckedChange={setOutStock} /> Out
              of Stock
            </label>
          </div>
        </div>

        {/* Price Filter */}
        <div>
          <h3 className="font-semibold mb-2">Price</h3>
          <Slider
            min={0}
            max={110}
            step={1}
            value={priceRange}
            onValueChange={setPriceRange}
          />
          <div className="flex justify-between text-sm mt-2">
            <span>${priceRange[0]}</span>
            <span>${priceRange[1]}</span>
          </div>
        </div>

        {/* Product Type */}
        <div>
          <h3 className="font-semibold mb-2">Product Type</h3>
          <div className="flex flex-col space-y-1 text-sm text-gray-600">
            <label>
              <input type="checkbox" /> Gloves
            </label>
            <label>
              <input type="checkbox" /> Masks
            </label>
            <label>
              <input type="checkbox" /> Sanitizers
            </label>
            <label>
              <input type="checkbox" /> Equipment
            </label>
          </div>
        </div>

        {/* Brand */}
        <div>
          <h3 className="font-semibold mb-2">Brand</h3>
          <div className="flex flex-col space-y-1 text-sm text-gray-600">
            <label>
              <input type="checkbox" /> Vendor A
            </label>
            <label>
              <input type="checkbox" /> Vendor B
            </label>
            <label>
              <input type="checkbox" /> Vendor C
            </label>
          </div>
        </div>

        {/* Color */}
        <div>
          <h3 className="font-semibold mb-2">Color</h3>
          <div className="flex flex-wrap gap-2">
            {["blue", "green", "white", "gray", "black"].map((color) => (
              <div
                key={color}
                className={`w-6 h-6 rounded-full border cursor-pointer`}
                style={{ backgroundColor: color }}
              ></div>
            ))}
          </div>
        </div>

        {/* Material */}
        <div>
          <h3 className="font-semibold mb-2">Material</h3>
          <div className="flex flex-col space-y-1 text-sm text-gray-600">
            <label>
              <input type="checkbox" /> Cotton
            </label>
            <label>
              <input type="checkbox" /> Latex
            </label>
            <label>
              <input type="checkbox" /> Plastic
            </label>
          </div>
        </div>

        {/* Size */}
        <div>
          <h3 className="font-semibold mb-2">Size</h3>
          <div className="flex flex-wrap gap-2">
            {["S", "M", "L", "XL"].map((size) => (
              <span
                key={size}
                className="border rounded-md px-2 py-1 text-xs cursor-pointer hover:bg-green-100"
              >
                {size}
              </span>
            ))}
          </div>
        </div>

        {/* Promo Card */}
        <div className="bg-green-100 p-4 rounded-2xl text-center">
          <h4 className="text-sm font-semibold mb-2">20% OFF</h4>
          <p className="text-xs mb-2">Covid-19 Mask Protection</p>
          <Button size="sm">Buy Now</Button>
        </div>
      </aside>

      {/* ====================== Product Section ====================== */}
      <section className="col-span-9">
        {/* Sorting & Count */}
        <div className="flex justify-between items-center mb-4">
          <Select onValueChange={setSort}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Alphabetically, A-Z" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="A-Z">Alphabetically, A-Z</SelectItem>
              <SelectItem value="Z-A">Alphabetically, Z-A</SelectItem>
              <SelectItem value="Low-High">Price: Low to High</SelectItem>
              <SelectItem value="High-Low">Price: High to Low</SelectItem>
            </SelectContent>
          </Select>

          <p className="text-sm text-gray-500">
            Showing 1 - {sortedProducts.length} of {products.length} results
          </p>
        </div>

        {/* Product Grid */}
        <div className="grid grid-cols-3 gap-6">
          {sortedProducts.map((product) => (
            <div
              key={product.id}
              onClick={() => navigate(`/shop/${product.id}`)}
              className="cursor-pointer"
            >
              <Card product={product} />
            </div>
          ))}
        </div>

        {/* Pagination */}
        <div className="flex justify-center mt-8 space-x-2">
          <Button variant="outline">1</Button>
          <Button variant="ghost">2</Button>
        </div>
      </section>
    </div>
  );
}
