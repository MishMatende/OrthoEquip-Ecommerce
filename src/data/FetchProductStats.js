import { supabase } from "../supabaseClient";

export async function fetchProductStats() {
  // Call the SQL function
  const { data, error } = await supabase.rpc("get_product_stats");

  if (error) {
    console.error("Error fetching product stats:", error);
    return { most_sold: [], trending: [] };
  }
  return data;
}
