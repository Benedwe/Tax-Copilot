import { Router } from "express";
import multer from "multer";
import { prisma } from "../lib/prisma.js";
import { requireAuth } from "../middleware/auth.js";
import { saveFile } from "../services/storageService.js";
import { runOcr } from "../services/ocrService.js";
import { extractFields } from "../services/aiExtractionService.js";

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 15 * 1024 * 1024 } });

const ALLOWED_MIME = ["application/pdf", "image/jpeg", "image/png"];

router.use(requireAuth);

// List the current user's documents (optionally filtered by taxReturnId)
router.get("/", async (req, res) => {
  const documents = await prisma.document.findMany({
    where: { userId: req.user.id, ...(req.query.taxReturnId ? { taxReturnId: req.query.taxReturnId } : {}) },
    include: { extractions: true },
    orderBy: { createdAt: "desc" },
  });
  res.json({ documents });
});

// Upload a document
router.post("/", upload.single("file"), async (req, res) => {
  const { type, taxReturnId } = req.body;
  if (!req.file) return res.status(400).json({ error: "No file provided (field name must be 'file')." });
  if (!ALLOWED_MIME.includes(req.file.mimetype)) {
    return res.status(400).json({ error: "Only PDF, JPG, and PNG files are supported." });
  }
  if (!type) return res.status(400).json({ error: "Document 'type' is required." });

  const storageUrl = await saveFile({
    buffer: req.file.buffer,
    originalName: req.file.originalname,
    mimeType: req.file.mimetype,
  });

  const document = await prisma.document.create({
    data: {
      userId: req.user.id,
      fileName: req.file.originalname,
      type,
      storageUrl,
      mimeType: req.file.mimetype,
      sizeBytes: req.file.size,
      status: "UPLOADED",
      ...(taxReturnId ? { taxReturnId } : {}),
    },
  });

  res.status(201).json({ document });
});

// Run OCR + AI field extraction on a document
router.post("/:id/process", async (req, res) => {
  const document = await prisma.document.findFirst({ where: { id: req.params.id, userId: req.user.id } });
  if (!document) return res.status(404).json({ error: "Document not found." });

  await prisma.document.update({ where: { id: document.id }, data: { status: "PROCESSING" } });

  try {
    const { rawText } = await runOcr({
      filePath: document.storageUrl,
      mimeType: document.mimeType,
      documentType: document.type,
    });

    const fields = await extractFields({ rawText, documentType: document.type });

    await prisma.aiExtraction.deleteMany({ where: { documentId: document.id } });
    await prisma.aiExtraction.createMany({
      data: fields.map((f) => ({ documentId: document.id, field: f.field, value: f.value, confidence: f.confidence })),
    });

    const lowConfidence = fields.some((f) => f.confidence < 0.6);
    const updated = await prisma.document.update({
      where: { id: document.id },
      data: { status: lowConfidence || fields.length === 0 ? "NEEDS_REVIEW" : "EXTRACTED" },
      include: { extractions: true },
    });

    res.json({ document: updated });
  } catch (err) {
    await prisma.document.update({ where: { id: document.id }, data: { status: "FAILED" } });
    res.status(500).json({ error: "Extraction failed.", detail: err.message });
  }
});

// User confirms extracted fields are correct
router.post("/:id/verify", async (req, res) => {
  const document = await prisma.document.findFirst({ where: { id: req.params.id, userId: req.user.id } });
  if (!document) return res.status(404).json({ error: "Document not found." });

  const updated = await prisma.document.update({ where: { id: document.id }, data: { status: "VERIFIED" } });
  res.json({ document: updated });
});

// Update extracted fields manually (side-by-side verification and correction)
router.put("/:id/extractions", async (req, res) => {
  const document = await prisma.document.findFirst({ where: { id: req.params.id, userId: req.user.id } });
  if (!document) return res.status(404).json({ error: "Document not found." });

  const { extractions } = req.body;
  if (!Array.isArray(extractions)) {
    return res.status(400).json({ error: "extractions must be an array of { field, value }." });
  }

  await prisma.aiExtraction.deleteMany({ where: { documentId: document.id } });
  await prisma.aiExtraction.createMany({
    data: extractions.map((f) => ({
      documentId: document.id,
      field: f.field,
      value: String(f.value ?? ""),
      confidence: 1.0, // User manually reviewed and verified
    })),
  });

  const updated = await prisma.document.update({
    where: { id: document.id },
    data: { status: "VERIFIED" },
    include: { extractions: true },
  });

  res.json({ document: updated });
});

router.delete("/:id", async (req, res) => {
  const document = await prisma.document.findFirst({ where: { id: req.params.id, userId: req.user.id } });
  if (!document) return res.status(404).json({ error: "Document not found." });
  await prisma.document.delete({ where: { id: document.id } });
  res.status(204).send();
});

export default router;
