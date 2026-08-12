import { prisma } from "./prisma.js";

// In-memory fallback state for non-auth entities only.
const memoryStore = {
  users: new Map(),
  documents: new Map(),
  extractions: new Map(),
  taxReturns: new Map(),
  deductions: new Map(),
};

function generateId() {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

// --- USER OPERATIONS ---
export async function findUserByEmail(rawEmail) {
  const email = String(rawEmail || "").toLowerCase().trim();
  if (!email) return null;
  return prisma.user.findUnique({ where: { email } });
}

export async function findUserByEmailStrict(rawEmail) {
  const email = String(rawEmail || "").toLowerCase().trim();
  if (!email) return null;
  return prisma.user.findUnique({ where: { email } });
}

export async function findUserById(id) {
  if (!id) return null;
  return prisma.user.findUnique({ where: { id } });
}

export async function findUserByIdStrict(id) {
  if (!id) return null;
  return prisma.user.findUnique({ where: { id } });
}

export async function createUser(data) {
  return prisma.user.create({ data });
}

export async function createUserStrict(data) {
  return prisma.user.create({ data });
}

export async function updateUser(id, data) {
  return prisma.user.update({ where: { id }, data });
}

export async function updateUserStrict(id, data) {
  return prisma.user.update({ where: { id }, data });
}

// --- TAX RETURN OPERATIONS ---
export async function findTaxReturnsByUserId(userId) {
  try {
    return await prisma.taxReturn.findMany({
      where: { userId },
      orderBy: { year: "desc" },
    });
  } catch (err) {
    const returns = [];
    for (const tr of memoryStore.taxReturns.values()) {
      if (tr.userId === userId) returns.push(tr);
    }
    return returns.sort((a, b) => b.year - a.year);
  }
}

export async function findTaxReturnByYear(userId, year) {
  try {
    return await prisma.taxReturn.findFirst({ where: { userId, year } });
  } catch (err) {
    for (const tr of memoryStore.taxReturns.values()) {
      if (tr.userId === userId && tr.year === year) return tr;
    }
    return null;
  }
}

export async function findTaxReturnById(id, userId) {
  try {
    return await prisma.taxReturn.findFirst({
      where: { id, userId },
      include: { deductions: true, documents: { include: { extractions: true } } },
    });
  } catch (err) {
    const tr = memoryStore.taxReturns.get(id);
    if (!tr || tr.userId !== userId) return null;
    const deductions = Array.from(memoryStore.deductions.values()).filter((d) => d.taxReturnId === id);
    const documents = Array.from(memoryStore.documents.values())
      .filter((doc) => doc.taxReturnId === id)
      .map((doc) => ({
        ...doc,
        extractions: Array.from(memoryStore.extractions.values()).filter((ex) => ex.documentId === doc.id),
      }));
    return { ...tr, deductions, documents };
  }
}

export async function createTaxReturn(data) {
  try {
    return await prisma.taxReturn.create({ data });
  } catch (err) {
    const tr = {
      id: generateId(),
      userId: data.userId,
      year: data.year,
      status: data.status || "DRAFT",
      grossIncome: 0,
      taxableIncome: 0,
      totalDeductions: 0,
      taxDue: 0,
      taxPaid: 0,
      balance: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    memoryStore.taxReturns.set(tr.id, tr);
    return tr;
  }
}

export async function updateTaxReturn(id, data) {
  try {
    return await prisma.taxReturn.update({ where: { id }, data });
  } catch (err) {
    const tr = memoryStore.taxReturns.get(id);
    if (tr) {
      Object.assign(tr, data, { updatedAt: new Date() });
      return tr;
    }
    return null;
  }
}

export async function createDeduction(data) {
  try {
    return await prisma.deduction.create({ data });
  } catch (err) {
    const deduction = {
      id: generateId(),
      taxReturnId: data.taxReturnId,
      category: data.category,
      description: data.description || null,
      amount: data.amount,
      sourceDocumentId: data.sourceDocumentId || null,
      createdAt: new Date(),
    };
    memoryStore.deductions.set(deduction.id, deduction);
    return deduction;
  }
}

export async function deleteDeduction(id) {
  try {
    return await prisma.deduction.delete({ where: { id } });
  } catch (err) {
    memoryStore.deductions.delete(id);
  }
}

// --- DOCUMENT OPERATIONS ---
export async function findDocuments(userId, taxReturnId) {
  try {
    return await prisma.document.findMany({
      where: { userId, ...(taxReturnId ? { taxReturnId } : {}) },
      include: { extractions: true },
      orderBy: { createdAt: "desc" },
    });
  } catch (err) {
    const docs = [];
    for (const d of memoryStore.documents.values()) {
      if (d.userId === userId && (!taxReturnId || d.taxReturnId === taxReturnId)) {
        const extractions = Array.from(memoryStore.extractions.values()).filter((e) => e.documentId === d.id);
        docs.push({ ...d, extractions });
      }
    }
    return docs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }
}

export async function findDocumentById(id, userId) {
  try {
    return await prisma.document.findFirst({ where: { id, userId } });
  } catch (err) {
    const doc = memoryStore.documents.get(id);
    if (!doc || doc.userId !== userId) return null;
    return doc;
  }
}

export async function createDocument(data) {
  try {
    return await prisma.document.create({ data });
  } catch (err) {
    const doc = {
      id: generateId(),
      userId: data.userId,
      fileName: data.fileName,
      type: data.type,
      storageUrl: data.storageUrl,
      mimeType: data.mimeType,
      sizeBytes: data.sizeBytes,
      status: data.status || "UPLOADED",
      taxReturnId: data.taxReturnId || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    memoryStore.documents.set(doc.id, doc);
    return doc;
  }
}

export async function updateDocument(id, data) {
  try {
    return await prisma.document.update({ where: { id }, data, include: { extractions: true } });
  } catch (err) {
    const doc = memoryStore.documents.get(id);
    if (doc) {
      Object.assign(doc, data, { updatedAt: new Date() });
      const extractions = Array.from(memoryStore.extractions.values()).filter((e) => e.documentId === id);
      return { ...doc, extractions };
    }
    return null;
  }
}

export async function deleteDocument(id) {
  try {
    return await prisma.document.delete({ where: { id } });
  } catch (err) {
    memoryStore.documents.delete(id);
    for (const [key, ex] of memoryStore.extractions.entries()) {
      if (ex.documentId === id) memoryStore.extractions.delete(key);
    }
  }
}

export async function replaceExtractions(documentId, extractions) {
  try {
    await prisma.aiExtraction.deleteMany({ where: { documentId } });
    await prisma.aiExtraction.createMany({
      data: extractions.map((f) => ({ documentId, field: f.field, value: String(f.value ?? ""), confidence: f.confidence ?? 1.0 })),
    });
  } catch (err) {
    for (const [key, ex] of memoryStore.extractions.entries()) {
      if (ex.documentId === documentId) memoryStore.extractions.delete(key);
    }
    for (const f of extractions) {
      const ex = {
        id: generateId(),
        documentId,
        field: f.field,
        value: String(f.value ?? ""),
        confidence: f.confidence ?? 1.0,
        createdAt: new Date(),
      };
      memoryStore.extractions.set(ex.id, ex);
    }
  }
}
