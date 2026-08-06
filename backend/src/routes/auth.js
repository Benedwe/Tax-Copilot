import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";

const router = Router();

const registerSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8),
  tin: z.string().trim().min(1).max(64).optional(),
});

router.post("/register", async (req, res) => {
  const body = {
    ...req.body,
    tin: typeof req.body?.tin === "string" ? req.body.tin.trim() || undefined : undefined,
  };

  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.errors[0].message });
  }
  const { name, email, password, tin } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return res.status(409).json({ error: "An account with that email already exists." });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { name, email, passwordHash, authProvider: "password", tin },
  });

  return res.status(201).json({ token: signToken(user), user: publicUser(user) });
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

router.post("/login", async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.errors[0].message });
  }
  const { email, password } = parsed.data;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.passwordHash) {
    return res.status(401).json({ error: "Invalid email or password." });
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    return res.status(401).json({ error: "Invalid email or password." });
  }

  return res.json({ token: signToken(user), user: publicUser(user) });
});

// Google login stub: the frontend will use Firebase Auth client-side
// and send the verified ID token here once Firebase credentials are
// configured. For now this documents the contract.
router.post("/google", async (req, res) => {
  return res.status(501).json({
    error: "Google sign-in not yet configured. Add Firebase Admin credentials in auth.js to verify the ID token and upsert the user.",
  });
});

function signToken(user) {
  return jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
}

function publicUser(user) {
  const { passwordHash, ...rest } = user;
  return rest;
}

export default router;
