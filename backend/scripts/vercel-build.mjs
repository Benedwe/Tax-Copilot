import { execSync } from "node:child_process";

function run(command) {
  execSync(command, { stdio: "inherit" });
}

run("npx prisma generate");

const dbUrl = process.env.DATABASE_URL?.trim();

if (!dbUrl) {
  console.warn(
    "\n⚠ DATABASE_URL is not set — skipping prisma migrate deploy.\n" +
      "  Add DATABASE_URL in Vercel → Project Settings → Environment Variables,\n" +
      "  then redeploy so migrations can run.\n"
  );
  process.exit(0);
}

if (dbUrl.includes("localhost") || dbUrl.includes("127.0.0.1") || dbUrl.includes("0.0.0.0")) {
  console.warn(
    "\n⚠ DATABASE_URL is set to a local host URL — skipping prisma migrate deploy.\n" +
      "  Vercel build containers cannot connect to a local database running on localhost/127.0.0.1.\n" +
      "  To run migrations automatically on deploy, set DATABASE_URL in Vercel → Project Settings → Environment Variables\n" +
      "  to your production PostgreSQL connection string (e.g. Supabase, Neon, Vercel Postgres).\n"
  );
  process.exit(0);
}

try {
  console.log("Running Prisma migrations...");
  run("npx prisma migrate deploy");
} catch (error) {
  console.warn(
    "\n⚠ Prisma migrate deploy failed during build:\n" +
      "  " + (error.message || error) + "\n" +
      "  Continuing build process. Make sure your production database is accessible from Vercel.\n"
  );
}

