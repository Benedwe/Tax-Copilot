import { PrismaClient } from "@prisma/client";

function normalizeDatabaseUrl(rawUrl) {
  const url = String(rawUrl || "").trim();
  if (!url) return url;

  try {
    const parsed = new URL(url);
    const host = parsed.hostname.toLowerCase();
    const port = parsed.port;
    const isSupabasePooler = host.includes("pooler.supabase.com") || port === "6543";
    const isSupabase = isSupabasePooler || host.includes("supabase.co") || host.includes("supabase.com");

    if (isSupabasePooler) {
      if (!parsed.searchParams.has("pgbouncer")) {
        parsed.searchParams.set("pgbouncer", "true");
      }
      if (!parsed.searchParams.has("connection_limit")) {
        parsed.searchParams.set("connection_limit", "1");
      }
    }

    // Supabase and remote PostgreSQL require encrypted connections
    if (!parsed.searchParams.has("sslmode")) {
      parsed.searchParams.set("sslmode", "require");
    }

    return parsed.toString();
  } catch {
    return url;
  }
}

function getValidatedDatabaseUrl() {
  const rawUrl = (process.env.DATABASE_URL || process.env.SUPABASE_DATABASE_URL || "").trim();

  if (!rawUrl) {
    throw new Error(
      "[Database Config Error] Missing required database environment variable. " +
        "Please set DATABASE_URL (or SUPABASE_DATABASE_URL) in your environment settings or hosting provider dashboard."
    );
  }

  try {
    const parsed = new URL(rawUrl);
    const host = parsed.hostname.toLowerCase();
    const isLocal = ["localhost", "127.0.0.1", "0.0.0.0", "::1"].includes(host);

    if (process.env.NODE_ENV === "production" && isLocal) {
      throw new Error(
        `[Database Config Error] Invalid production DATABASE_URL host (${host}). ` +
          "Production environments cannot connect to a local PostgreSQL instance. " +
          "Please update DATABASE_URL in your hosting provider dashboard to your Supabase connection string."
      );
    }
  } catch (err) {
    if (err.message.includes("[Database Config Error]")) {
      throw err;
    }
  }

  return normalizeDatabaseUrl(rawUrl);
}

// Reuse a single PrismaClient instance across hot reloads in dev.
const globalForPrisma = globalThis;
const databaseUrl = getValidatedDatabaseUrl();

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: { db: { url: databaseUrl } },
    log: process.env.NODE_ENV === "development" ? ["query", "info", "warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

