// src/hooks/useProducts.js
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../../src/supabaseClient";

export function useProducts({
  perPage = 1000,
  page = 1,
  category,
  search,
  sort,
} = {}) {
  const queryClient = useQueryClient();

  const key = ["products", { perPage, page, category, search, sort }];

  const fetchProducts = async () => {
    const from = (page - 1) * perPage;
    let q = supabase
      .from("products")
      // 🧹 Removed slug — only request existing columns
      .select("id, name, price, image_url, category, brand, stock, created_at")
      .range(from, from + perPage - 1)
      .order("created_at", { ascending: false });

    if (category) q = q.eq("category", category);
    if (search) q = q.ilike("name", `%${search}%`);
    if (sort === "price_asc") q = q.order("price", { ascending: true });
    if (sort === "price_desc") q = q.order("price", { ascending: false });

    const { data, error } = await q;
    if (error) throw error;
    return data || [];
  };

  const query = useQuery({
    queryKey: key,
    queryFn: fetchProducts,
    staleTime: 60 * 1000,
    keepPreviousData: true,
  });

  // Prefetch product details by id
  const prefetchProductById = async (id) => {
    if (!id) return;

    await queryClient.prefetchQuery({
      queryKey: ["product", id],
      queryFn: async () => {
        const { data, error } = await supabase
          .from("products")
          // 🧹 Removed slug — only request existing columns
          .select(
            "id, name, price, image_url, description, brand, stock, created_at"
          )
          .eq("id", id)
          .single();

        if (error) throw error;
        return data;
      },
      staleTime: 1000 * 60 * 5,
    });
  };

  return {
    ...query,
    prefetchProductById,
  };
}
