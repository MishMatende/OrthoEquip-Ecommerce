import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config(); // Load variables from .env

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function linkProductImages() {
  console.log("Linking product images...");

  // 1. Get all products
  const { data: products, error: productsError } = await supabase
    .from("products")
    .select("id, product_code");

  if (productsError) {
    console.error("Error fetching products:", productsError);
    return;
  }

  // 2. Get all files from bucket
  const { data: files, error: filesError } = await supabase.storage
    .from("product-images")
    .list("", { limit: 1000 });

  if (filesError) {
    console.error("Error listing files:", filesError);
    return;
  }

  // 3. Link images to products
  for (const product of products) {
    const code = product.product_code?.trim();
    if (!code) continue;

    const matchingFiles = files.filter((f) =>
      f.name.toLowerCase().startsWith(code.toLowerCase())
    );

    for (const file of matchingFiles) {
      const {
        data: { publicUrl },
      } = supabase.storage.from("product-images").getPublicUrl(file.name);

      // insert into product_images
      await supabase.from("product_images").insert({
        product_id: product.id,
        image_url: publicUrl,
      });

      // update products table (first image as main image)
      if (matchingFiles.indexOf(file) === 0) {
        await supabase
          .from("products")
          .update({ image_url: publicUrl })
          .eq("id", product.id);
      }
    }
  }

  console.log("All product images linked successfully!");
}

linkProductImages();
