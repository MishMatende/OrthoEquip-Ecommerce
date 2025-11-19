import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config({ path: "../.env" }); // adjust if needed

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function listProductsWithoutImages() {
  const { data, error } = await supabase
    .from("products")
    .select("id, product_code, name, image_url")
    .or("image_url.is.null,image_url.eq.''");

  if (error) {
    console.error("Error fetching products:", error);
    return;
  }

  if (data.length === 0) {
    console.log("All products have images 🎉");
    return;
  }

  console.log(`Found ${data.length} products without image_url:\n`);

  data.forEach((p) => {
    console.log(`Code: ${p.product_code} | Name: ${p.name || "(no name)"}`);
  });

  console.log("\n===============================");
  console.log(`TOTAL PRODUCTS WITHOUT IMAGES: ${data.length}`);
  console.log("===============================\n");
}

listProductsWithoutImages();
