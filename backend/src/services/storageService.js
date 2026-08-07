import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UPLOAD_DIR = path.join(__dirname, "..", "..", "uploads");

if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;
const SUPABASE_BUCKET = process.env.SUPABASE_STORAGE_BUCKET;
const supabase = SUPABASE_URL && SUPABASE_KEY ? createClient(SUPABASE_URL, SUPABASE_KEY) : null;

/**
 * Persists an uploaded file and returns a URL/path to store on the
 * Document record. STORAGE_DRIVER=local keeps everything on disk next
 * to the server (fine for a demo/single-instance deploy). Set it to
 * "supabase" and fill in the SUPABASE_* env vars to switch to cloud
 * storage without touching any calling code.
 */
export async function saveFile({ buffer, originalName, mimeType }) {
  if (process.env.STORAGE_DRIVER === "supabase") {
    if (!supabase || !SUPABASE_BUCKET) {
      throw new Error(
        "SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_KEY), and SUPABASE_STORAGE_BUCKET must be set when STORAGE_DRIVER=supabase."
      );
    }

    const safeName = `${Date.now()}-${originalName.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
    const storagePath = `uploads/${safeName}`;

    const { error: uploadError } = await supabase.storage
      .from(SUPABASE_BUCKET)
      .upload(storagePath, buffer, {
        cacheControl: "3600",
        contentType: mimeType || "application/octet-stream",
        upsert: false,
      });

    if (uploadError) {
      throw new Error(`Supabase storage upload failed: ${uploadError.message}`);
    }

    const { data: publicUrlData, error: publicUrlError } = supabase.storage
      .from(SUPABASE_BUCKET)
      .getPublicUrl(storagePath);

    if (publicUrlError) {
      throw new Error(`Unable to get Supabase public URL: ${publicUrlError.message}`);
    }

    return publicUrlData.publicUrl;
  }

  const safeName = `${Date.now()}-${originalName.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
  const fullPath = path.join(UPLOAD_DIR, safeName);
  fs.writeFileSync(fullPath, buffer);
  return `/uploads/${safeName}`;
}
