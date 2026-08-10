import jwt from "jsonwebtoken";
import { supabaseAdmin } from "../lib/supabaseClient.js";
import { findUserById, findUserByEmail, createUser, updateUser } from "../lib/db.js";

export function parseCookies(req) {
  if (req.cookies) return req.cookies;
  const list = {};
  const rc = req.headers.cookie;
  if (rc) {
    rc.split(";").forEach((cookie) => {
      const parts = cookie.split("=");
      const key = parts.shift()?.trim();
      if (key) {
        list[key] = decodeURIComponent(parts.join("=").trim());
      }
    });
  }
  return list;
}

export async function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const cookies = parseCookies(req);
  const token = (header.startsWith("Bearer ") ? header.slice(7) : null) || cookies.tax_copilot_token;

  if (!token) {
    return res.status(401).json({ error: "Missing or malformed authorization token." });
  }

  if (supabaseAdmin) {
    try {
      const { data, error } = await supabaseAdmin.auth.getUser(token);
      if (!error && data?.user) {
        const { user } = data;
        const metadata = user.user_metadata || {};

        let localUser = await findUserById(user.id);
        if (!localUser && user.email) {
          localUser = await findUserByEmail(user.email);
        }

        if (localUser) {
          localUser = await updateUser(localUser.id, {
            email: user.email,
            name: metadata.name || localUser.name || user.email,
            tin: metadata.tin ?? localUser.tin ?? undefined,
            authProvider: "supabase",
          });
        } else {
          localUser = await createUser({
            email: user.email,
            name: metadata.name || user.email,
            tin: metadata.tin ?? undefined,
            authProvider: "supabase",
          });
        }

        req.user = localUser;
        return next();
      }
    } catch (err) {
      // Fallback to local JWT verification below if Supabase token check errors
    }
  }

  try {
    const jwtSecret = process.env.JWT_SECRET || "tax-copilot-dev-secret-key-2026";
    const payload = jwt.verify(token, jwtSecret);
    req.user = payload; // { id, email }
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired token." });
  }
}


