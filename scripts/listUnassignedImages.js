import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config({ path: "../.env" });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

function normalize(str = "") {
  return String(str)
    .replace(/\p{White_Space}+/gu, "")
    .toLowerCase();
}

function stripExt(filename = "") {
  const i = filename.lastIndexOf(".");
  return i === -1 ? filename : filename.slice(0, i);
}

function fileFromUrl(url) {
  if (!url) return null;
  return decodeURIComponent(url.split("/").pop());
}

async function run() {
  // bucket files
  const { data: files } = await supabase.storage
    .from("product-images")
    .list("", { limit: 3000 });

  const bucket = files
    .map((f) => f.name)
    .filter((n) => n !== ".emptyFolderPlaceholder");

  // get products
  const { data: products } = await supabase
    .from("products")
    .select("id, name, image_url");

  // normalized product names
  const normalized = products.map((p) => ({
    id: p.id,
    rawName: p.name,
    normName: normalize(p.name),
    mainImage: fileFromUrl(p.image_url),
  }));

  const referenced = new Set(
    products.map((p) => fileFromUrl(p.image_url)).filter(Boolean)
  );

  const assigned = new Set();
  const unassigned = [];

  for (const filename of bucket) {
    const nameNoExt = normalize(stripExt(filename));

    let isAssigned = false;

    // 1) is referenced in DB?
    if (referenced.has(filename)) {
      assigned.add(filename);
      continue;
    }

    // 2) does filename match product name?
    for (const p of normalized) {
      if (nameNoExt.startsWith(p.normName)) {
        assigned.add(filename);
        isAssigned = true;
        break;
      }
    }

    if (!isAssigned) unassigned.push(filename);
  }

  console.log("\nUNASSIGNED FILES:\n");
  unassigned.forEach((u) => console.log(u));

  console.log(`\nTOTAL UNASSIGNED: ${unassigned.length}`);
}

run();
