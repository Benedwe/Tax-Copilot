import { Router } from "express";
import { z } from "zod";
import { summarizeReturn } from "../services/taxEngine.js";

const router = Router();

const schema = z.object({
  grossIncome: z.number().nonnegative(),
  deductions: z
    .array(z.object({ category: z.string(), amount: z.number().nonnegative() }))
    .optional()
    .default([]),
  taxPaid: z.number().nonnegative().optional().default(0),
  isMonthly: z.boolean().optional().default(true),
});

// Quick what-if calculator — no auth, no persistence. Powers the
// "Tax Calculator" screen so users can play with numbers before ever
// creating an account.
router.post("/", (req, res) => {
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.errors[0].message });
  }
  const summary = summarizeReturn(parsed.data);
  res.json({ summary });
});

export default router;
