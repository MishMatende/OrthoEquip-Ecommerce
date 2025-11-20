// src/pages/Shop.jsx
import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "../../supabaseClient"; // keep your existing client
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
import { ChevronDown, ChevronUp, Loader2 } from "lucide-react";

import { useProducts } from "../../hooks/useProducts"; // new hook (note path)

export default function Shop() {
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const initialCategory = queryParams.get("category");

  const [currentPage, setCurrentPage] = useState(1);
  const productsPerPage = 12;
  const [selectedCategories, setSelectedCategories] = useState(
    initialCategory ? [initialCategory] : []
  );
  const [selectedBrands, setSelectedBrands] = useState([]);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  // local UI filters
  const [priceRange, setPriceRange] = useState([0, 100000]);
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

  const toggle = (key) => setOpen((prev) => ({ ...prev, [key]: !prev[key] }));

  // ---------- useProducts hook ----------
  // set perPage high so we fetch full catalog once and then do client-side filtering
  const {
    data: products = [],
    isLoading,
    isFetching,
    error,
    prefetchProductById,
  } = useProducts({ perPage: 1000 });

  // derived filtered/sorted/paginated data (mostly unchanged)
  const filteredProducts = products.filter((p) => {
    const inRange = p.price >= priceRange[0] && p.price <= priceRange[1];
    const stockFilter = (inStock && p.stock > 0) || (outStock && p.stock <= 0);

    const categoryFilter =
      selectedCategories.length === 0 ||
      selectedCategories.some(
        (c) => c.toLowerCase() === (p.category || "").toLowerCase()
      );

    const brandFilter =
      selectedBrands.length === 0 ||
      selectedBrands.some(
        (b) => b.toLowerCase() === (p.brand || "").toLowerCase()
      );

    return inRange && stockFilter && categoryFilter && brandFilter;
  });

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    if (sort === "A-Z") return a.name.localeCompare(b.name);
    if (sort === "Z-A") return b.name.localeCompare(a.name);
    if (sort === "Low-High") return a.price - b.price;
    if (sort === "High-Low") return b.price - a.price;
    return 0;
  });

  const indexOfLastProduct = currentPage * productsPerPage;
  const indexOfFirstProduct = indexOfLastProduct - productsPerPage;
  const currentProducts = sortedProducts.slice(
    indexOfFirstProduct,
    indexOfLastProduct
  );

  const totalPages = Math.ceil(sortedProducts.length / productsPerPage);

  // ---------- fetch categories & brands (optimized: select only fields) ----------
  useEffect(() => {
    let mounted = true;
    async function fetchFilters() {
      // categories
      const { data: categoryData, error: categoryError } = await supabase
        .from("products")
        .select("category");

      if (!categoryError && mounted) {
        const uniqueCategories = [
          ...new Set(categoryData.map((item) => item.category).filter(Boolean)),
        ];
        setCategories(uniqueCategories);
      }

      // brands
      const { data: brandData, error: brandError } = await supabase
        .from("products")
        .select("brand");

      if (!brandError && mounted) {
        const uniqueBrands = [
          ...new Set(brandData.map((item) => item.brand).filter(Boolean)),
        ];
        setBrands(uniqueBrands);
      }
    }

    fetchFilters();
    return () => (mounted = false);
  }, []);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [currentPage]);

  useEffect(() => {
    if (initialCategory) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [initialCategory]);

  // ---------- UI pieces ----------
  const Section = ({ title, name, children }) => (
    <div className="border-b border-gray-100 pb-4">
      <button
        onClick={() => toggle(name)}
        className="w-full flex justify-between items-center mb-2 text-gray-800 font-semibold text-lg hover:text-[#4eb0e3] transition"
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

  // ---------- Render ----------
  if (error) {
    return (
      <div className="text-red-600">
        Failed to load products: {error.message}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mt-8 mx-[4%] md:mx-[6%] lg:mx-[12%] pb-10">
      {/* Sidebar (unchanged) */}
      <aside className="hidden md:block col-span-3 bg-white p-5 rounded-2xl shadow-sm border border-gray-100 space-y-6">
        <Section title="Availability" name="availability">
          <div className="flex flex-col gap-2 text-gray-700">
            <label className="flex items-center gap-2 hover:text-[#4eb0e3] cursor-pointer">
              <Checkbox checked={inStock} onCheckedChange={setInStock} />
              <span>In Stock</span>
            </label>
            <label className="flex items-center gap-2 hover:text-[#4eb0e3] cursor-pointer">
              <Checkbox checked={outStock} onCheckedChange={setOutStock} />
              <span>Out of Stock</span>
            </label>
          </div>
        </Section>

        <Section title="Price" name="price">
          <div className="px-2 mt-2">
            <Slider
              min={0}
              max={100000}
              step={100}
              value={priceRange}
              onValueChange={setPriceRange}
              className="w-full"
            />
            <div className="flex justify-between text-sm text-gray-600 mt-2">
              <span>KES {priceRange[0]}</span>
              <span>KES {priceRange[1]}</span>
            </div>
          </div>
        </Section>

        <Section title="Category" name="category">
          <div className="flex flex-col gap-1 text-sm text-gray-700 mt-1">
            {categories.length > 0 ? (
              categories.map((category) => {
                const isChecked = selectedCategories.includes(category);
                return (
                  <label
                    key={category}
                    className="flex items-center gap-2 hover:text-[#4eb0e3] cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      className="accent-[#4eb0e3]"
                      checked={isChecked}
                      onChange={() =>
                        setSelectedCategories((prev) =>
                          isChecked
                            ? prev.filter((c) => c !== category)
                            : [...prev, category]
                        )
                      }
                    />
                    {category}
                  </label>
                );
              })
            ) : (
              <p className="text-gray-400 text-sm">No categories found</p>
            )}
          </div>
        </Section>

        <Section title="Brand" name="brand">
          <div className="flex flex-col gap-1 text-sm text-gray-700 mt-1">
            {brands.length > 0 ? (
              brands.map((brand) => {
                const isChecked = selectedBrands.includes(brand);
                return (
                  <label
                    key={brand}
                    className="flex items-center gap-2 hover:text-[#4eb0e3] cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      className="accent-[#4eb0e3]"
                      checked={isChecked}
                      onChange={() =>
                        setSelectedBrands((prev) =>
                          isChecked
                            ? prev.filter((b) => b !== brand)
                            : [...prev, brand]
                        )
                      }
                    />
                    {brand}
                  </label>
                );
              })
            ) : (
              <p className="text-gray-400 text-sm">No brands found</p>
            )}
          </div>
        </Section>
      </aside>

      {/* Product Section */}
      <section className="col-span-12 md:col-span-9">
        {/* Mobile filters drawer (unchanged) */}
        {open.mobileFilters && (
          <div
            className="fixed inset-0 bg-black bg-opacity-40 z-50 flex justify-end md:hidden animate-fade-in"
            onClick={(e) => {
              if (e.target === e.currentTarget)
                setOpen((prev) => ({ ...prev, mobileFilters: false }));
            }}
          >
            <div className="w-3/4 bg-white h-full p-6 overflow-y-auto shadow-lg transform transition-transform duration-300 translate-x-0">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">Filters</h2>
                <Button
                  variant="ghost"
                  onClick={() =>
                    setOpen((prev) => ({ ...prev, mobileFilters: false }))
                  }
                >
                  ✕
                </Button>
              </div>

              <Section title="Availability" name="availability">
                <div className="flex flex-col gap-2 text-gray-700">
                  <label className="flex items-center gap-2 hover:text-[#4eb0e3] cursor-pointer">
                    <Checkbox checked={inStock} onCheckedChange={setInStock} />
                    <span>In Stock</span>
                  </label>
                  <label className="flex items-center gap-2 hover:text-[#4eb0e3] cursor-pointer">
                    <Checkbox
                      checked={outStock}
                      onCheckedChange={setOutStock}
                    />
                    <span>Out of Stock</span>
                  </label>
                </div>
              </Section>

              <Section title="Price" name="price">
                <div className="px-2 mt-2">
                  <Slider
                    min={0}
                    max={100000}
                    step={100}
                    value={priceRange}
                    onValueChange={setPriceRange}
                    className="w-full"
                  />
                  <div className="flex justify-between text-sm text-gray-600 mt-2">
                    <span>KES {priceRange[0]}</span>
                    <span>KES {priceRange[1]}</span>
                  </div>
                </div>
              </Section>

              <Section title="Category" name="category">
                <div className="flex flex-col gap-1 text-sm text-gray-700 mt-1">
                  {categories.map((category) => {
                    const isChecked = selectedCategories.includes(category);
                    return (
                      <label
                        key={category}
                        className="flex items-center gap-2 hover:text-[#4eb0e3] cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          className="accent-[#4eb0e3]"
                          checked={isChecked}
                          onChange={() =>
                            setSelectedCategories((prev) =>
                              isChecked
                                ? prev.filter((c) => c !== category)
                                : [...prev, category]
                            )
                          }
                        />
                        {category}
                      </label>
                    );
                  })}
                </div>
              </Section>

              <Section title="Brand" name="brand">
                <div className="flex flex-col gap-1 text-sm text-gray-700 mt-1">
                  {brands.map((brand) => {
                    const isChecked = selectedBrands.includes(brand);
                    return (
                      <label
                        key={brand}
                        className="flex items-center gap-2 hover:text-[#4eb0e3] cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          className="accent-[#4eb0e3]"
                          checked={isChecked}
                          onChange={() =>
                            setSelectedBrands((prev) =>
                              isChecked
                                ? prev.filter((b) => b !== brand)
                                : [...prev, brand]
                            )
                          }
                        />
                        {brand}
                      </label>
                    );
                  })}
                </div>
              </Section>
            </div>
          </div>
        )}

        {/* Sorting & Count */}
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-3">
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

            <Button
              onClick={() =>
                setOpen((prev) => ({ ...prev, mobileFilters: true }))
              }
              className="bg-[#4eb0e3] text-white rounded-lg md:hidden"
            >
              Filters
            </Button>
          </div>

          <p className="hidden md:block text-sm text-gray-500">
            Showing {sortedProducts.length}{" "}
            {sortedProducts.length === 1 ? "product" : "products"}{" "}
            {sortedProducts.length !== products.length && (
              <>out of {products.length} total</>
            )}
          </p>
        </div>

        {/* Product Grid */}
        {isLoading ? (
          <div className="grid gap-6 grid-cols-2 sm:grid-cols-3 md:grid-cols-3 xl:grid-cols-4 place-items-stretch">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="animate-pulse p-4 border rounded">
                <div className="bg-gray-300 h-44 w-full mb-2" />
                <div className="h-4 bg-gray-300 mb-2 w-3/4" />
                <div className="h-4 bg-gray-300 w-1/4" />
              </div>
            ))}
          </div>
        ) : (
          <div
            className="
              grid gap-6
              grid-cols-2 sm:grid-cols-3 md:grid-cols-3 xl:grid-cols-4
              place-items-stretch
            "
          >
            {currentProducts.map((product) => (
              <div
                key={product.id}
                onClick={() => navigate(`/shop/${product.id}`)}
                className="cursor-pointer flex flex-col"
                onMouseEnter={() => prefetchProductById(product.id)}
                onFocus={() => prefetchProductById(product.id)}
              >
                <Card product={product} />
              </div>
            ))}
          </div>
        )}

        {/* subtle non-blocking fetching indicator */}
        {isFetching && products.length > 0 && (
          <div className="mt-2 text-xs text-gray-500">Refreshing products…</div>
        )}

        {/* Pagination (unchanged) */}
        {totalPages > 1 && (
          <div className="flex flex-wrap justify-center mt-8 gap-2 items-center px-2">
            <Button
              variant="ghost"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            >
              Prev
            </Button>

            {(() => {
              const pageButtons = [];
              const pagesPerGroup = 5;
              const currentGroup = Math.floor(
                (currentPage - 1) / pagesPerGroup
              );
              const startPage = currentGroup * pagesPerGroup + 1;
              const endPage = Math.min(
                startPage + pagesPerGroup - 1,
                totalPages
              );

              if (currentGroup > 0) {
                pageButtons.push(
                  <Button
                    key="prevEllipsis"
                    variant="ghost"
                    onClick={() =>
                      setCurrentPage(
                        startPage - pagesPerGroup > 0
                          ? startPage - pagesPerGroup
                          : 1
                      )
                    }
                  >
                    ...
                  </Button>
                );
              }

              for (let page = startPage; page <= endPage; page++) {
                pageButtons.push(
                  <Button
                    key={page}
                    variant={page === currentPage ? "default" : "ghost"}
                    onClick={() => setCurrentPage(page)}
                  >
                    {page}
                  </Button>
                );
              }

              if (endPage < totalPages) {
                pageButtons.push(
                  <Button
                    key="nextEllipsis"
                    variant="ghost"
                    onClick={() =>
                      setCurrentPage(
                        endPage + 1 <= totalPages ? endPage + 1 : totalPages
                      )
                    }
                  >
                    ...
                  </Button>
                );
              }

              return pageButtons;
            })()}

            <Button
              variant="ghost"
              disabled={currentPage === totalPages}
              onClick={() =>
                setCurrentPage((prev) => Math.min(prev + 1, totalPages))
              }
            >
              Next
            </Button>

            <Button
              variant="ghost"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(totalPages)}
            >
              Last
            </Button>
          </div>
        )}
      </section>
    </div>
  );
}
