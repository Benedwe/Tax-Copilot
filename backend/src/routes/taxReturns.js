import { Router } from "express";
import { z } from "zod";
import {
  findTaxReturnsByUserId,
  findTaxReturnByYear,
  findTaxReturnById,
  createTaxReturn,
  updateTaxReturn,
  createDeduction,
  deleteDeduction,
  findUserById,
} from "../lib/db.js";
import { requireAuth } from "../middleware/auth.js";
import { summarizeReturn } from "../services/taxEngine.js";
import { generateReturnPdf } from "../services/pdfService.js";
import { DEDUCTION_CATEGORIES } from "../config/taxBrackets.js";
import { routeCache, invalidateUserCache } from "../lib/cache.js";

const router = Router();
router.use(requireAuth);

router.get("/deduction-categories", routeCache(3600), (req, res) => {
  res.setHeader("Cache-Control", "public, max-age=3600, stale-while-revalidate=86400");
  res.json({ categories: DEDUCTION_CATEGORIES });
});


router.get("/", routeCache(60), async (req, res) => {
  const taxReturns = await findTaxReturnsByUserId(req.user.id);
  res.json({ taxReturns });
});

router.post("/", async (req, res) => {
  invalidateUserCache(req.user.id);
  const year = Number(req.body.year) || new Date().getFullYear();
  const existing = await findTaxReturnByYear(req.user.id, year);
  if (existing) return res.json({ taxReturn: existing });

  const taxReturn = await createTaxReturn({
    userId: req.user.id,
    year,
    status: "DRAFT",
  });
  res.status(201).json({ taxReturn });
});

router.get("/:id", routeCache(60), async (req, res) => {
  const taxReturn = await findTaxReturnById(req.params.id, req.user.id);
  if (!taxReturn) return res.status(404).json({ error: "Tax return not found." });
  res.json({ taxReturn });
});

const deductionSchema = z.object({
  category: z.string().min(1),
  description: z.string().optional(),
  amount: z.number().nonnegative(),
  sourceDocumentId: z.string().optional(),
});

router.post("/:id/deductions", async (req, res) => {
  invalidateUserCache(req.user.id);
  const taxReturn = await findTaxReturnById(req.params.id, req.user.id);
  if (!taxReturn) return res.status(404).json({ error: "Tax return not found." });

  const parsed = deductionSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.errors[0].message });

  const deduction = await createDeduction({
    taxReturnId: taxReturn.id,
    ...parsed.data,
  });
  res.status(201).json({ deduction });
});

router.delete("/:id/deductions/:deductionId", async (req, res) => {
  invalidateUserCache(req.user.id);
  const taxReturn = await findTaxReturnById(req.params.id, req.user.id);
  if (!taxReturn) return res.status(404).json({ error: "Tax return not found." });
  await deleteDeduction(req.params.deductionId);
  res.status(204).send();
});

const recalcSchema = z.object({
  grossIncome: z.number().nonnegative(),
  taxPaid: z.number().nonnegative().optional().default(0),
  isMonthly: z.boolean().optional().default(false),
});

router.post("/:id/recalculate", async (req, res) => {
  invalidateUserCache(req.user.id);
  const taxReturn = await findTaxReturnById(req.params.id, req.user.id);
  if (!taxReturn) return res.status(404).json({ error: "Tax return not found." });

  const parsed = recalcSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.errors[0].message });

  const summary = summarizeReturn({
    grossIncome: parsed.data.grossIncome,
    deductions: taxReturn.deductions || [],
    taxPaid: parsed.data.taxPaid,
    isMonthly: parsed.data.isMonthly,
  });

  const updated = await updateTaxReturn(taxReturn.id, {
    grossIncome: summary.grossIncome,
    totalDeductions: summary.totalDeductions,
    taxableIncome: summary.taxableIncome,
    taxDue: summary.taxDue,
    taxPaid: summary.taxPaid,
    balance: summary.balance,
    status: "READY_FOR_REVIEW",
  });

  res.json({ taxReturn: updated, summary });
});

router.post("/:id/mark-reviewed", async (req, res) => {
  invalidateUserCache(req.user.id);
  const taxReturn = await findTaxReturnById(req.params.id, req.user.id);
  if (!taxReturn) return res.status(404).json({ error: "Tax return not found." });
  const updated = await updateTaxReturn(taxReturn.id, { status: "REVIEWED" });
  res.json({ taxReturn: updated });
});

router.get("/:id/pdf", async (req, res) => {
  invalidateUserCache(req.user.id);
  const taxReturn = await findTaxReturnById(req.params.id, req.user.id);
  if (!taxReturn) return res.status(404).json({ error: "Tax return not found." });

  const user = await findUserById(req.user.id);

  await updateTaxReturn(taxReturn.id, { status: "GENERATED" });
  generateReturnPdf({ user, taxReturn, deductions: taxReturn.deductions || [], res });
});

export default router;

