import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UPLOAD_DIR = path.join(__dirname, "..", "..", "uploads");

if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

/**
 * Persists an uploaded file and returns a URL/path to store on the
 * Document record. STORAGE_DRIVER=local keeps everything on disk next
 * to the server (fine for a demo/single-instance deploy). Set it to
 * "firebase" and fill in the Firebase env vars to switch to Cloud
 * Storage without touching any calling code.
 */
export async function saveFile({ buffer, originalName }) {
  if (process.env.STORAGE_DRIVER === "firebase") {
    // TODO: initialize firebase-admin with FIREBASE_* env vars and
    // upload `buffer` to FIREBASE_STORAGE_BUCKET, returning the public
    // or signed URL instead of the local path below.
    throw new Error("Firebase storage driver not yet configured — add credentials in storageService.js");
  }

  const safeName = `${Date.now()}-${originalName.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
  const fullPath = path.join(UPLOAD_DIR, safeName);
  fs.writeFileSync(fullPath, buffer);
  return `/uploads/${safeName}`;
}
