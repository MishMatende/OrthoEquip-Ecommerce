// src/hooks/useProductStats.js
import { useQuery } from "@tanstack/react-query";
import { fetchProductStats } from "../data/FetchProductStats";

/**
 * useProductStats
 * Caches/persists homepage product stats (most_sold, trending).
 * Wraps your existing fetchProductStats function so you get React Query benefits.
 */
export function useProductStats() {
  return useQuery({
    queryKey: ["product-stats"],
    queryFn: async () => {
      // fetchProductStats should return { most_sold: [], trending: [] }
      const data = await fetchProductStats();
      return data || { most_sold: [], trending: [] };
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    cacheTime: 1000 * 60 * 60 * 6, // 6 hours
    retry: 1,
  });
}
