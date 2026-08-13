import test from "node:test";
import assert from "node:assert/strict";

// Utility functions to test URL normalization and environment variable validation logic
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
    }

    if (!parsed.searchParams.has("sslmode")) {
      parsed.searchParams.set("sslmode", "require");
    }

    return parsed.toString();
  } catch {
    return url;
  }
}

function getValidatedDatabaseUrl(env) {
  const rawUrl = (env.DATABASE_URL || env.SUPABASE_DATABASE_URL || "").trim();

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

    if (env.NODE_ENV === "production" && isLocal) {
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

test("normalizeDatabaseUrl appends sslmode=require to connection strings", () => {
  const input = "postgresql://postgres:secret@db.wmdibaxssubvxuvistsr.supabase.co:5432/postgres";
  const output = normalizeDatabaseUrl(input);
  assert.ok(output.includes("sslmode=require"));
});

test("normalizeDatabaseUrl configures pgbouncer and sslmode for Supabase transaction pooler", () => {
  const input = "postgresql://postgres.wmdibaxssubvxuvistsr:secret@aws-0-us-east-1.pooler.supabase.com:6543/postgres";
  const output = normalizeDatabaseUrl(input);
  assert.ok(output.includes("pgbouncer=true"));
  assert.ok(output.includes("connection_limit=1"));
  assert.ok(output.includes("sslmode=require"));
});

test("getValidatedDatabaseUrl throws explicit error when DATABASE_URL is missing", () => {
  assert.throws(
    () => getValidatedDatabaseUrl({}),
    (err) => err.message.includes("[Database Config Error]") && err.message.includes("Missing required database environment variable")
  );
});

test("getValidatedDatabaseUrl throws explicit error in production when pointing to localhost", () => {
  const env = {
    NODE_ENV: "production",
    DATABASE_URL: "postgresql://user:password@localhost:5432/tax_copilot",
  };
  assert.throws(
    () => getValidatedDatabaseUrl(env),
    (err) => err.message.includes("[Database Config Error]") && err.message.includes("Invalid production DATABASE_URL host (localhost)")
  );
});

test("getValidatedDatabaseUrl resolves SUPABASE_DATABASE_URL if DATABASE_URL is unset", () => {
  const env = {
    SUPABASE_DATABASE_URL: "postgresql://postgres:secret@db.wmdibaxssubvxuvistsr.supabase.co:5432/postgres",
  };
  const url = getValidatedDatabaseUrl(env);
  assert.ok(url.includes("sslmode=require"));
});
