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
import { ChevronDown, ChevronUp } from "lucide-react";

export default function Shop() {
  const [priceRange, setPriceRange] = useState([0, 110]);
  const [inStock, setInStock] = useState(true);
  const [outStock, setOutStock] = useState(true);
  const [sort, setSort] = useState("A-Z");
  const [open, setOpen] = useState({
    availability: false,
    price: false,
    productType: false,
    brand: false,
    color: false,
    material: false,
    size: false,
  });
  const navigate = useNavigate();

  const toggle = (key) => setOpen((prev) => ({ ...prev, [key]: !prev[key] }));

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

  // ----- Collapsible Section Component -----
  const Section = ({ title, name, children }) => (
    <div className="border-b border-gray-100 pb-4">
      <button
        onClick={() => toggle(name)}
        className="w-full flex justify-between items-center mb-2 text-gray-800 font-semibold text-lg hover:text-blue-600 transition"
      >
        {title}
        {open[name] ? (
          <ChevronUp size={18} className="text-gray-500" />
        ) : (
          <ChevronDown size={18} className="text-gray-500" />
        )}
      </button>

      <div
        className={`transition-all duration-300 overflow-hidden ${
          open[name] ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        {children}
      </div>
    </div>
  );

  return (
    <div className="grid grid-cols-12 gap-6 mt-8 mx-[0%] md:mx-[2%] lg:mx-[20%] text-center">
      {/* ====================== Sidebar ====================== */}
      <aside className="col-span-3 bg-white p-5 rounded-2xl shadow-sm border border-gray-100 space-y-6">
        {/* Availability */}
        <Section title="Availability" name="availability">
          <div className="flex flex-col gap-2 text-gray-700">
            <label className="flex items-center gap-2 hover:text-blue-600 cursor-pointer">
              <Checkbox checked={inStock} onCheckedChange={setInStock} />
              <span>In Stock</span>
            </label>
            <label className="flex items-center gap-2 hover:text-blue-600 cursor-pointer">
              <Checkbox checked={outStock} onCheckedChange={setOutStock} />
              <span>Out of Stock</span>
            </label>
          </div>
        </Section>

        {/* Price */}
        <Section title="Price" name="price">
          <div className="px-2 mt-2">
            <Slider
              min={0}
              max={110}
              step={1}
              value={priceRange}
              onValueChange={setPriceRange}
              className="w-full"
            />
            <div className="flex justify-between text-sm text-gray-600 mt-2">
              <span>${priceRange[0]}</span>
              <span>${priceRange[1]}</span>
            </div>
          </div>
        </Section>

        {/* Product Type */}
        <Section title="Product Type" name="productType">
          <div className="flex flex-col gap-1 text-sm text-gray-700 mt-1">
            {["Gloves", "Masks", "Sanitizers", "Equipment"].map((type) => (
              <label
                key={type}
                className="flex items-center gap-2 hover:text-blue-600 cursor-pointer"
              >
                <input type="checkbox" className="accent-blue-600" /> {type}
              </label>
            ))}
          </div>
        </Section>

        {/* Brand */}
        <Section title="Brand" name="brand">
          <div className="flex flex-col gap-1 text-sm text-gray-700 mt-1">
            {["Vendor A", "Vendor B", "Vendor C"].map((brand) => (
              <label
                key={brand}
                className="flex items-center gap-2 hover:text-blue-600 cursor-pointer"
              >
                <input type="checkbox" className="accent-blue-600" /> {brand}
              </label>
            ))}
          </div>
        </Section>

        {/* Color */}
        <Section title="Color" name="color">
          <div className="flex flex-wrap gap-3 mt-2">
            {["blue", "green", "white", "gray", "black"].map((color) => (
              <div
                key={color}
                className="w-7 h-7 rounded-full border border-gray-300 hover:scale-110 transition-transform cursor-pointer shadow-sm"
                style={{ backgroundColor: color }}
              ></div>
            ))}
          </div>
        </Section>

        {/* Material */}
        <Section title="Material" name="material">
          <div className="flex flex-col gap-1 text-sm text-gray-700 mt-1">
            {["Cotton", "Latex", "Plastic"].map((material) => (
              <label
                key={material}
                className="flex items-center gap-2 hover:text-blue-600 cursor-pointer"
              >
                <input type="checkbox" className="accent-blue-600" /> {material}
              </label>
            ))}
          </div>
        </Section>

        {/* Size */}
        <Section title="Size" name="size">
          <div className="flex flex-wrap gap-2 mt-2">
            {["S", "M", "L", "XL"].map((size) => (
              <button
                key={size}
                className="border border-gray-300 px-3 py-1 rounded-lg text-sm text-gray-700 hover:bg-blue-50 hover:border-blue-500 transition-colors"
              >
                {size}
              </button>
            ))}
          </div>
        </Section>
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
          <Button variant="default">1</Button>
          <Button variant="ghost">2</Button>
        </div>
      </section>
    </div>
  );
}

// TODO: Make the filters selectable
