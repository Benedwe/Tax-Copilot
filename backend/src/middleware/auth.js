import jwt from "jsonwebtoken";
import { supabaseAdmin } from "../lib/supabaseClient.js";
import { prisma } from "../lib/prisma.js";

export async function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: "Missing or malformed Authorization header." });
  }

  if (supabaseAdmin) {
    try {
      const { data, error } = await supabaseAdmin.auth.getUser(token);
      if (error || !data?.user) {
        throw error || new Error("Invalid Supabase token.");
      }

      const { user } = data;
      const metadata = user.user_metadata || {};
      const localUser = await prisma.user.upsert({
        where: { id: user.id },
        update: {
          email: user.email,
          name: metadata.name || user.email,
          tin: metadata.tin ?? undefined,
          authProvider: "supabase",
        },
        create: {
          id: user.id,
          email: user.email,
          name: metadata.name || user.email,
          tin: metadata.tin ?? undefined,
          authProvider: "supabase",
        },
      });

      req.user = localUser;
      return next();
    } catch (err) {
      return res.status(401).json({ error: err.message || "Invalid Supabase token." });
    }
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = payload; // { id, email }
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired token." });
  }
}
