// src/hooks/useProduct.js
import { useQuery } from "@tanstack/react-query";
import { supabase } from "../../src/supabaseClient"; // keep the path you're using in other files

const isUuid = (v) =>
  typeof v === "string" &&
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    v
  );

export function useProduct(id) {
  return useQuery({
    queryKey: ["product", id],
    queryFn: async () => {
      if (!id) throw new Error("No product id provided");

      const cols =
        "id, product_code, name, price, image_url, description, brand, category, stock, created_at, updated_at";

      // 1) If id looks like a uuid, try id first
      if (isUuid(id)) {
        const { data: byId, error: errById } = await supabase
          .from("products")
          .select(cols)
          .eq("id", id)
          .maybeSingle();
        if (errById) throw errById;
        if (byId) {
          const { data: imgs, error: imgErr } = await supabase.rpc(
            "get_product_images",
            { pid: byId.id }
          );
          const images = imgErr
            ? []
            : (imgs || []).map((r) => r.image_url).filter(Boolean);
          return { product: byId, images };
        }
      }

      // 2) Try product_code
      const { data: byCode, error: codeErr } = await supabase
        .from("products")
        .select(cols)
        .eq("product_code", id)
        .maybeSingle();
      if (codeErr) throw codeErr;
      if (byCode) {
        const { data: imgs, error: imgErr } = await supabase.rpc(
          "get_product_images",
          { pid: byCode.id }
        );
        const images = imgErr
          ? []
          : (imgs || []).map((r) => r.image_url).filter(Boolean);
        return { product: byCode, images };
      }

      // 3) Fallback OR query
      const { data: fallback, error: fallbackErr } = await supabase
        .from("products")
        .select(cols)
        .or(`id.eq.${id},product_code.eq.${id}`)
        .maybeSingle();
      if (fallbackErr) throw fallbackErr;

      const { data: imgs, error: imgErr } = fallback?.id
        ? await supabase.rpc("get_product_images", { pid: fallback.id })
        : { data: null, error: null };
      const images = imgErr
        ? []
        : (imgs || []).map((r) => r.image_url).filter(Boolean);
      return { product: fallback, images };
    },
    enabled: Boolean(id),
    staleTime: 1000 * 60 * 5,
    retry: 1,
  });
}
