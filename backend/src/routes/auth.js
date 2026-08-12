import { Router } from "express";
import { z } from "zod";
import {
  findUserByEmailStrict,
  findUserByIdStrict,
  createUserStrict,
  updateUserStrict,
} from "../lib/db.js";

import { requireAuth } from "../middleware/auth.js";
import { createAuthService, isDatabaseConnectivityError } from "../services/authService.js";

const router = Router();

const authService = createAuthService({
  findUserByEmail: findUserByEmailStrict,
  findUserById: findUserByIdStrict,
  createUser: createUserStrict,
  updateUser: updateUserStrict,
});

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
  try {
    const result = await authService.register(parsed.data);
    setAuthCookie(res, result.token);
    return res.status(201).json(result);
  } catch (err) {
    return sendAuthError(res, err, "Unable to create the account right now.");
  }
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
  try {
    const result = await authService.login(parsed.data);
    setAuthCookie(res, result.token);
    return res.json(result);
  } catch (err) {
    return sendAuthError(res, err, "Invalid email or password.");
  }
});

router.post("/logout", (req, res) => {
  clearAuthCookie(res);
  return res.json({ message: "Successfully logged out." });
});

// Fetch current user details & TIN validation status
router.get("/me", requireAuth, async (req, res) => {
  try {
    const result = await authService.me(req.user.id);
    return res.json(result);
  } catch (err) {
    return sendAuthError(res, err, "Unable to load the current user.");
  }
});

// Update/Add compulsory TRA TIN for current user
router.put("/tin", requireAuth, async (req, res) => {
  const { tin } = req.body || {};
  try {
    const result = await authService.updateTin(req.user.id, tin);
    return res.json(result);
  } catch (err) {
    return sendAuthError(
      res,
      err,
      "TIN must be a valid 9-digit TRA Taxpayer Identification Number (e.g. 123-456-789 or 123456789)."
    );
  }
});

// Google login stub: the frontend can use Supabase Auth client-side
// and send the verified access token here once Supabase is configured.
router.post("/google", async (req, res) => {
  return res.status(501).json({
    error: "Google sign-in not yet configured. Add Supabase auth handling here if you want a backend callback route.",
  });
});

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

function sendAuthError(res, err, fallbackMessage) {
  const status = err?.status || (isDatabaseConnectivityError(err) ? 503 : 500);
  const message = err?.message || fallbackMessage;
  return res.status(status).json({ error: message });
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
