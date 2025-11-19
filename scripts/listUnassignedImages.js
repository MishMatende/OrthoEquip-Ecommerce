import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config({ path: "../.env" }); // adjust if your script is elsewhere

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function listUnassignedImages() {
  console.log("Scanning for unassigned images...\n");

  // 1. Get all images in the bucket
  const { data: files, error: filesError } = await supabase.storage
    .from("product-images")
    .list("", { limit: 2000 });

  if (filesError) {
    console.error("Error listing files:", filesError);
    return;
  }

  // Extract the filenames
  const bucketImageNames = files.map((f) => f.name);

  // 2. Get all image URLs from products table
  const { data: products, error: productsError } = await supabase
    .from("products")
    .select("image_url");

  if (productsError) {
    console.error("Error fetching products:", productsError);
    return;
  }

  // Extract all filenames referenced in product.image_url
  const productImageNames = products
    .map((p) => p.image_url)
    .filter(Boolean)
    .map((url) => url.split("/").pop()); // keep only filename

  // 3. Get all image URLs from product_images table
  const { data: productImages, error: productImagesError } = await supabase
    .from("product_images")
    .select("image_url");

  if (productImagesError) {
    console.error("Error fetching product_images:", productImagesError);
    return;
  }

  const tableImageNames = productImages
    .map((p) => p.image_url)
    .filter(Boolean)
    .map((url) => url.split("/").pop());

  // Combine all used images
  const usedImages = new Set([...productImageNames, ...tableImageNames]);

  // 4. Find images NOT in usedImages
  const unassignedImages = bucketImageNames.filter(
    (file) => !usedImages.has(file)
  );

  if (unassignedImages.length === 0) {
    console.log("All images are assigned to products 🎉");
    return;
  }

  console.log("Unassigned images:\n");
  unassignedImages.forEach((img) => console.log(img));

  console.log("\n===============================");
  console.log(`TOTAL UNASSIGNED IMAGES: ${unassignedImages.length}`);
  console.log("===============================\n");
}

listUnassignedImages();
