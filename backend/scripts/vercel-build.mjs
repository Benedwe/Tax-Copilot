import { execSync } from "node:child_process";

function run(command) {
  execSync(command, { stdio: "inherit" });
}

run("npx prisma generate");

if (!process.env.DATABASE_URL?.trim()) {
  console.warn(
    "\n⚠ DATABASE_URL is not set — skipping prisma migrate deploy.\n" +
      "  Add DATABASE_URL in Vercel → Project Settings → Environment Variables,\n" +
      "  then redeploy so migrations can run.\n"
  );
  process.exit(0);
}

run("npx prisma migrate deploy");
