import { PrismaClient } from "@prisma/client";

function normalizeDatabaseUrl(rawUrl) {
  const url = String(rawUrl || "").trim();
  if (!url) return url;

  try {
    const parsed = new URL(url);
    const host = parsed.hostname.toLowerCase();
    const port = parsed.port;
    const isSupabasePooler = host.includes("pooler.supabase.com") || port === "6543";

    if (isSupabasePooler) {
      if (!parsed.searchParams.has("pgbouncer")) {
        parsed.searchParams.set("pgbouncer", "true");
      }
      if (!parsed.searchParams.has("connection_limit")) {
        parsed.searchParams.set("connection_limit", "1");
      }
      if (!parsed.searchParams.has("sslmode")) {
        parsed.searchParams.set("sslmode", "require");
      }
      return parsed.toString();
    }

    return url;
  } catch {
    return url;
  }
}

// Reuse a single PrismaClient instance across hot reloads in dev.
const globalForPrisma = globalThis;
const databaseUrl = normalizeDatabaseUrl(process.env.DATABASE_URL);

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: databaseUrl ? { db: { url: databaseUrl } } : undefined,
    log: process.env.NODE_ENV === "development" ? ["query", "info", "warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
