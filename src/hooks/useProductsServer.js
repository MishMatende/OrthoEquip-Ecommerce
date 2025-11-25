// src/hooks/useProductsServer.js
import { useQuery } from "@tanstack/react-query";
import { supabase } from "../../src/supabaseClient";

export function useProductsServer({
  page = 1,
  perPage = 10,
  search,
  category,
  sortField = "created_at",
  sortAsc = false,
} = {}) {
  const key = [
    "products-server",
    {
      page,
      perPage,
      search: search ?? "",
      category: category ?? "",
      sortField,
      sortAsc,
    },
  ];

  const fetchFn = async () => {
    const from = (page - 1) * perPage;
    const to = from + perPage - 1;

    // Build base query
    let q = supabase
      .from("products")
      // request specific columns and ask for exact count
      .select(
        "id, product_code, name, price, image_url, category, brand, stock, sales_count, created_at",
        { count: "exact" }
      )
      .range(from, to);

    // Filters
    if (category && category !== "All Categories") {
      q = q.eq("category", category);
    }

    if (search && search.trim().length > 0) {
      // search in name or product_code (case-insensitive)
      q = q.or(`name.ilike.%${search}%,product_code.ilike.%${search}%`);
    }

    // Sorting
    if (sortField) {
      q = q.order(sortField, { ascending: Boolean(sortAsc) });
    } else {
      q = q.order("created_at", { ascending: false });
    }

    const { data, error, count } = await q;
    if (error) throw error;

    return {
      data: data || [],
      total: typeof count === "number" ? count : (data || []).length,
    };
  };

  return useQuery({
    queryKey: key,
    queryFn: fetchFn,
    keepPreviousData: true,
    staleTime: 1000 * 60, // 1 minute
    cacheTime: 1000 * 60 * 30, // 30 minutes
    retry: 1,
  });
}
