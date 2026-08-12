import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { findUserByEmail, findUserById, createUser, updateUser } from "../lib/db.js";

import { requireAuth } from "../middleware/auth.js";

const router = Router();

export function formatTin(rawTin) {
  const digits = String(rawTin || "").replace(/\D/g, "");
  if (digits.length !== 9) return null;
  return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6, 9)}`;
}

const registerSchema = z.object({
  name: z.string().trim().min(1, "Full name is required"),
  email: z.preprocess(
    (val) => (typeof val === "string" ? val.trim().toLowerCase() : val),
    z.string().email("Valid email address is required")
  ),
  password: z.string().min(8, "Password must be at least 8 characters"),
  tin: z
    .string()
    .trim()
    .min(1, "TRA Taxpayer Identification Number (TIN) is compulsory")
    .refine((val) => {
      const clean = val.replace(/[\s-]/g, "");
      return /^\d{9}$/.test(clean);
    }, "TIN must be a valid 9-digit TRA Taxpayer Identification Number (e.g. 123-456-789 or 123456789)"),
});

router.post("/register", async (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.errors[0].message });
  }
  const { name, email, password, tin } = parsed.data;
  const cleanEmail = email;
  const formattedTin = formatTin(tin);

  const existing = await findUserByEmail(cleanEmail);
  if (existing) {
    return res.status(409).json({ error: "An account with that email already exists." });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await createUser({
    name: name.trim(),
    email: cleanEmail,
    passwordHash,
    authProvider: "password",
    tin: formattedTin,
  });

  const token = signToken(user);
  setAuthCookie(res, token);
  return res.status(201).json({ token, user: publicUser(user) });
});

const loginSchema = z.object({
  email: z.preprocess(
    (val) => (typeof val === "string" ? val.trim().toLowerCase() : val),
    z.string().email("Valid email address is required")
  ),
  password: z.string().min(1),
});

router.post("/login", async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.errors[0].message });
  }
  const { email, password } = parsed.data;
  const cleanEmail = email.toLowerCase().trim();

  const user = await findUserByEmail(cleanEmail);
  if (!user || !user.passwordHash) {
    return res.status(401).json({ error: "Invalid email or password." });
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    return res.status(401).json({ error: "Invalid email or password." });
  }

  const token = signToken(user);
  setAuthCookie(res, token);
  return res.json({ token, user: publicUser(user) });
});

router.post("/logout", (req, res) => {
  clearAuthCookie(res);
  return res.json({ message: "Successfully logged out." });
});

// Fetch current user details & TIN validation status
router.get("/me", requireAuth, async (req, res) => {
  const user = await findUserById(req.user.id);
  if (!user) return res.status(404).json({ error: "User not found." });

  return res.json({
    user: publicUser(user),
    hasValidTin: Boolean(user.tin && formatTin(user.tin)),
  });
});

// Update/Add compulsory TRA TIN for current user
router.put("/tin", requireAuth, async (req, res) => {
  const { tin } = req.body || {};
  const formatted = formatTin(tin);
  if (!formatted) {
    return res.status(400).json({
      error: "TIN must be a valid 9-digit TRA Taxpayer Identification Number (e.g. 123-456-789 or 123456789).",
    });
  }

  const updatedUser = await updateUser(req.user.id, { tin: formatted });

  return res.json({
    user: publicUser(updatedUser),
    hasValidTin: true,
  });
});

// Google login stub: the frontend can use Supabase Auth client-side
// and send the verified access token here once Supabase is configured.
router.post("/google", async (req, res) => {
  return res.status(501).json({
    error: "Google sign-in not yet configured. Add Supabase auth handling here if you want a backend callback route.",
  });
});

function signToken(user) {
  const jwtSecret = process.env.JWT_SECRET || "tax-copilot-dev-secret-key-2026";
  return jwt.sign({ id: user.id, email: user.email }, jwtSecret, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
}

function publicUser(user) {
  const { passwordHash, ...rest } = user;
  return rest;
}

function setAuthCookie(res, token) {
  const isProd = process.env.NODE_ENV === "production";
  const maxAge = 7 * 24 * 60 * 60 * 1000;
  const sameSite = isProd ? "none" : "lax";
  if (typeof res.cookie === "function") {
    res.cookie("tax_copilot_token", token, {
      httpOnly: true,
      secure: isProd,
      sameSite,
      maxAge,
      path: "/",
    });
  } else {
    const expires = new Date(Date.now() + maxAge).toUTCString();
    res.setHeader(
      "Set-Cookie",
      `tax_copilot_token=${token}; Path=/; Expires=${expires}; HttpOnly; SameSite=${isProd ? "None" : "Lax"}${isProd ? "; Secure" : ""}`
    );
  }
}

function clearAuthCookie(res) {
  const isProd = process.env.NODE_ENV === "production";
  if (typeof res.clearCookie === "function") {
    res.clearCookie("tax_copilot_token", { path: "/", secure: isProd, sameSite: isProd ? "none" : "lax" });
  } else {
    res.setHeader(
      "Set-Cookie",
      `tax_copilot_token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; SameSite=${isProd ? "None" : "Lax"}${isProd ? "; Secure" : ""}`
    );
  }
}

export default router;


