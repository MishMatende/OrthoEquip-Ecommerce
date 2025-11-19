import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config({ path: "../.env" }); // Load variables from .env

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

function normalizeRemoveWhitespace(str = "") {
  // Remove ALL Unicode whitespace characters
  return str.replace(/\p{White_Space}+/gu, "").toLowerCase();
}

function stripExtension(filename = "") {
  const i = filename.lastIndexOf(".");
  return i === -1 ? filename : filename.slice(0, i);
}

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
    const rawCode = product.product_code;
    if (!rawCode) continue;

    const normalizedCode = normalizeRemoveWhitespace(String(rawCode));

    const matchingFiles = files.filter((f) => {
      const nameNoExt = stripExtension(f.name);
      const normalizedFileName = normalizeRemoveWhitespace(nameNoExt);
      return normalizedFileName.startsWith(normalizedCode);
    });

    if (matchingFiles.length === 0) {
      console.log(
        `No image found for product id=${product.id} code="${product.product_code}"`
      );
      continue;
    }

    console.log(
      `Found ${matchingFiles.length} image(s) for product id=${product.id}:`,
      matchingFiles.map((f) => f.name)
    );

    for (const file of matchingFiles) {
      const {
        data: { publicUrl },
      } = supabase.storage.from("product-images").getPublicUrl(file.name);

      // ---- SKIP DUPLICATES ----
      const { data: existing, error: existingError } = await supabase
        .from("product_images")
        .select("id")
        .eq("product_id", product.id)
        .eq("image_url", publicUrl)
        .maybeSingle();

      if (existingError) {
        console.error("Error checking duplicates:", existingError);
        continue;
      }

      if (!existing) {
        const { error: insertError } = await supabase
          .from("product_images")
          .insert({
            product_id: product.id,
            image_url: publicUrl,
          });

        if (insertError) {
          console.error(
            "Error inserting product_image for",
            product.id,
            insertError
          );
        }
      }
      // -------------------------

      // update main image ONLY for the first matching image
      if (matchingFiles.indexOf(file) === 0) {
        const { error: updateError } = await supabase
          .from("products")
          .update({ image_url: publicUrl })
          .eq("id", product.id);

        if (updateError) {
          console.error(
            "Error updating product main image for",
            product.id,
            updateError
          );
        }
      }
    }
  }

  console.log("All product images linked successfully!");
}

linkProductImages().catch((err) => {
  console.error("Unhandled error:", err);
});
