import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { requireAuth } from "../middleware/auth.js";
import { summarizeReturn } from "../services/taxEngine.js";
import { generateReturnPdf } from "../services/pdfService.js";
import { DEDUCTION_CATEGORIES } from "../config/taxBrackets.js";

const router = Router();
router.use(requireAuth);

router.get("/deduction-categories", (req, res) => {
  res.json({ categories: DEDUCTION_CATEGORIES });
});

router.get("/", async (req, res) => {
  const taxReturns = await prisma.taxReturn.findMany({
    where: { userId: req.user.id },
    orderBy: { year: "desc" },
  });
  res.json({ taxReturns });
});

router.post("/", async (req, res) => {
  const year = Number(req.body.year) || new Date().getFullYear();
  const existing = await prisma.taxReturn.findFirst({ where: { userId: req.user.id, year } });
  if (existing) return res.json({ taxReturn: existing });

  const taxReturn = await prisma.taxReturn.create({
    data: { userId: req.user.id, year, status: "DRAFT" },
  });
  res.status(201).json({ taxReturn });
});

router.get("/:id", async (req, res) => {
  const taxReturn = await prisma.taxReturn.findFirst({
    where: { id: req.params.id, userId: req.user.id },
    include: { deductions: true, documents: { include: { extractions: true } } },
  });
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
  const taxReturn = await prisma.taxReturn.findFirst({ where: { id: req.params.id, userId: req.user.id } });
  if (!taxReturn) return res.status(404).json({ error: "Tax return not found." });

  const parsed = deductionSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.errors[0].message });

  const deduction = await prisma.deduction.create({
    data: { taxReturnId: taxReturn.id, ...parsed.data },
  });
  res.status(201).json({ deduction });
});

router.delete("/:id/deductions/:deductionId", async (req, res) => {
  const taxReturn = await prisma.taxReturn.findFirst({ where: { id: req.params.id, userId: req.user.id } });
  if (!taxReturn) return res.status(404).json({ error: "Tax return not found." });
  await prisma.deduction.delete({ where: { id: req.params.deductionId } });
  res.status(204).send();
});

// Recalculate the return's totals from its gross income input +
// current deductions, and persist the summary. Called from the Review
// screen whenever the user edits a figure.
const recalcSchema = z.object({
  grossIncome: z.number().nonnegative(),
  taxPaid: z.number().nonnegative().optional().default(0),
  isMonthly: z.boolean().optional().default(false),
});

router.post("/:id/recalculate", async (req, res) => {
  const taxReturn = await prisma.taxReturn.findFirst({
    where: { id: req.params.id, userId: req.user.id },
    include: { deductions: true },
  });
  if (!taxReturn) return res.status(404).json({ error: "Tax return not found." });

  const parsed = recalcSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.errors[0].message });

  const summary = summarizeReturn({
    grossIncome: parsed.data.grossIncome,
    deductions: taxReturn.deductions,
    taxPaid: parsed.data.taxPaid,
    isMonthly: parsed.data.isMonthly,
  });

  const updated = await prisma.taxReturn.update({
    where: { id: taxReturn.id },
    data: {
      grossIncome: summary.grossIncome,
      totalDeductions: summary.totalDeductions,
      taxableIncome: summary.taxableIncome,
      taxDue: summary.taxDue,
      taxPaid: summary.taxPaid,
      balance: summary.balance,
      status: "READY_FOR_REVIEW",
    },
  });

  res.json({ taxReturn: updated, summary });
});

router.post("/:id/mark-reviewed", async (req, res) => {
  const taxReturn = await prisma.taxReturn.findFirst({ where: { id: req.params.id, userId: req.user.id } });
  if (!taxReturn) return res.status(404).json({ error: "Tax return not found." });
  const updated = await prisma.taxReturn.update({ where: { id: taxReturn.id }, data: { status: "REVIEWED" } });
  res.json({ taxReturn: updated });
});

router.get("/:id/pdf", async (req, res) => {
  const taxReturn = await prisma.taxReturn.findFirst({
    where: { id: req.params.id, userId: req.user.id },
    include: { deductions: true },
  });
  if (!taxReturn) return res.status(404).json({ error: "Tax return not found." });

  const user = await prisma.user.findUnique({ where: { id: req.user.id } });

  await prisma.taxReturn.update({ where: { id: taxReturn.id }, data: { status: "GENERATED" } });
  generateReturnPdf({ user, taxReturn, deductions: taxReturn.deductions, res });
});

export default router;
