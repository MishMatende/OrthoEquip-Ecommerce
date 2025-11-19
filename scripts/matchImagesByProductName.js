import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config({ path: "../.env" });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Normalize: remove all Unicode whitespace + lowercase
function normalize(str = "") {
  return String(str)
    .replace(/\p{White_Space}+/gu, "")
    .toLowerCase();
}

// Remove extension
function stripExt(filename = "") {
  const i = filename.lastIndexOf(".");
  return i === -1 ? filename : filename.slice(0, i);
}

async function run() {
  // get bucket files
  const { data: files } = await supabase.storage
    .from("product-images")
    .list("", { limit: 3000 });

  // filter out system placeholder
  const bucketFiles = files
    .map((f) => f.name)
    .filter((name) => name !== ".emptyFolderPlaceholder");

  // get products
  const { data: products } = await supabase.from("products").select("id, name");

  // normalize product names
  const normalizedProducts = products.map((p) => ({
    id: p.id,
    raw: p.name,
    norm: normalize(p.name),
  }));

  console.log("\nAssigned images:\n");

  // loop images + match to product.name
  for (const filename of bucketFiles) {
    const nameNoExt = stripExt(filename);
    const normFile = normalize(nameNoExt);

    for (const p of normalizedProducts) {
      if (normFile.startsWith(p.norm)) {
        console.log(`${filename} → ${p.raw}`);
        break;
      }
    }
  }

  console.log("\nDone.\n");
}

run();
