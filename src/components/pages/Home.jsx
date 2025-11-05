import React, { useEffect, useState } from "react";
import ProductShowCase from "../ProductShowCase";
import Card from "../Card";
import MaskThermometer from "../../assets/MaskThermometer.webp";
import { Check, Loader2 } from "lucide-react";
import { fetchProductStats } from "../../data/FetchProductStats";
import { useNavigate } from "react-router-dom";

export default function Home() {
  // Logic for featured Products
  // const { data: topProducts } = await supabase
  // .from("products")
  // .select("*")
  // .order("sales_count", { ascending: false })
  // .limit(5);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const [stats, setStats] = useState({ most_sold: [], trending: [] });

  useEffect(() => {
    async function loadStats() {
      setLoading(true); // make sure it starts in loading mode
      try {
        const data = await fetchProductStats();
        setStats(data);
      } catch (error) {
        console.error("Error fetching product stats:", error);
      } finally {
        setLoading(false); // only stop loading *after* data is fetched
      }
    }

    loadStats();
  }, []);

  return (
    <>
      <section className="px-4 sm:px-6 lg:px-8 xl:px-[15%] text-center mb-10">
        {/* //TODO: Create ProductShowcase Graphics */}
        {/* <ProductShowCase /> */}

        <h1 className="text-2xl sm:text-3xl font-semibold text-black py-8">
          Featured Products
        </h1>

        {loading ? (
          <div className="flex items-center justify-center py-10 text-gray-500">
            <Loader2 className="w-6 h-6 animate-spin mr-2" />
            <span>Loading products...</span>
          </div>
        ) : (
          <div
            className="
            grid gap-6
            grid-cols-2 sm:grid-cols-3 md:grid-cols-3
            place-items-stretch
          "
          >
            {stats.trending.map((product) => (
              <div
                key={product.id}
                onClick={() => navigate(`/shop/${product.id}`)}
                className="cursor-pointer flex flex-col"
              >
                <Card product={product} />
              </div>
            ))}
          </div>
        )}
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

      <section className="mx-[0%] lg:mx-[2%] xl:mx-[20%] text-center mb-10">
        {/* Best Selling Product */}
        <h1 className="text-2xl sm:text-3xl font-semibold text-black py-8">
          Best Selling
        </h1>
        {loading ? (
          <div className="flex items-center justify-center py-10 text-gray-500">
            <Loader2 className="w-6 h-6 animate-spin mr-2" />
            <span>Loading products...</span>
          </div>
        ) : (
          <div
            className="
            grid gap-6
            grid-cols-2 sm:grid-cols-3 md:grid-cols-3
            place-items-stretch
          "
          >
            {stats.most_sold.map((product) => (
              <div
                key={product.id}
                onClick={() => navigate(`/shop/${product.id}`)}
                className="cursor-pointer flex flex-col"
              >
                <Card product={product} />
              </div>
            ))}
          </div>
        )}
      </section>
    </>
  );
}

// Return JSON
// {
//   "most_sold": [
//     { "id": "...", "name": "Wheelchair", "total_sold": 45 },
//     { "id": "...", "name": "Stethoscope", "total_sold": 30 }
//   ],
//   "trending": [
//     { "id": "...", "name": "Crutches", "total_sold_recently": 12 },
//     { "id": "...", "name": "Surgical Mask", "total_sold_recently": 10 }
//   ]
// }
