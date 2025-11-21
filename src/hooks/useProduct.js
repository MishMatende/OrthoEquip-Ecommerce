// src/hooks/useProduct.js
import { useQuery } from "@tanstack/react-query";
import { supabase } from "../../src/supabaseClient"; // adjust path if needed

export function useProduct(id) {
  return useQuery({
    queryKey: ["product", id],
    queryFn: async () => {
      if (!id) throw new Error("No product id provided");

      // fetch product (explicit columns)
      const { data: product, error: productError } = await supabase
        .from("products")
        .select(
          "id, name, price, image_url, description, brand, category, stock, created_at"
        )
        .eq("id", id)
        .single();

      if (productError) throw productError;

      // fetch images (RPC) but don't fail the whole query if RPC fails
      const { data: imageData, error: imageError } = await supabase.rpc(
        "get_product_images",
        { pid: id }
      );
      if (imageError) {
        console.error("get_product_images RPC error", imageError);
      }

      return {
        product,
        images: (imageData || []).map((r) => r.image_url).filter(Boolean),
      };
    },
    staleTime: 1000 * 60 * 5, // 5m
    retry: 1,
  });
}
