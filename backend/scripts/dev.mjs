import net from "node:net";
import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const backendRoot = path.resolve(__dirname, "..");
const databaseUrl = process.env.DATABASE_URL || "";
const dbTarget = parseDatabaseUrl(databaseUrl);

async function main() {
  if (dbTarget && isLocalDatabase(dbTarget)) {
    const reachable = await canConnect(dbTarget.host, dbTarget.port, 1500);
    if (!reachable) {
      await runCommand("docker", ["compose", "up", "-d", "db"], { cwd: backendRoot });
      await waitForPort(dbTarget.host, dbTarget.port, 30000);
    }

    await runCommand("npx", ["prisma", "migrate", "deploy"], { cwd: backendRoot });
  }

  await runCommand(path.join(backendRoot, "node_modules", ".bin", "nodemon"), ["src/index.js"], {
    cwd: backendRoot,
    inheritSignals: true,
  });
}

function parseDatabaseUrl(rawUrl) {
  if (!rawUrl) return null;

  try {
    const parsed = new URL(rawUrl);
    return {
      host: parsed.hostname,
      port: parsed.port ? Number(parsed.port) : 5432,
    };
  } catch {
    return null;
  }
}

function isLocalDatabase(target) {
  return ["localhost", "127.0.0.1", "::1"].includes(target.host);
}

function canConnect(host, port, timeoutMs) {
  return new Promise((resolve) => {
    const socket = net.createConnection({ host, port });
    const done = (result) => {
      socket.removeAllListeners();
      socket.destroy();
      resolve(result);
    };

    socket.setTimeout(timeoutMs);
    socket.on("connect", () => done(true));
    socket.on("timeout", () => done(false));
    socket.on("error", () => done(false));
  });
}

async function waitForPort(host, port, timeoutMs) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (await canConnect(host, port, 1000)) {
      return;
    }
    await delay(1000);
  }

  throw new Error(
    `Unable to reach PostgreSQL at ${host}:${port}. Start the database container with \`docker compose up -d db\` and try again.`
  );
}

function runCommand(command, args, { cwd, inheritSignals = false } = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd,
      stdio: "inherit",
      shell: false,
      env: process.env,
    });

    const onSignal = (signal) => child.kill(signal);
    if (inheritSignals) {
      process.once("SIGINT", onSignal);
      process.once("SIGTERM", onSignal);
    }

    child.on("error", (error) => {
      if (inheritSignals) {
        process.removeListener("SIGINT", onSignal);
        process.removeListener("SIGTERM", onSignal);
      }
      reject(error);
    });

    child.on("exit", (code) => {
      if (inheritSignals) {
        process.removeListener("SIGINT", onSignal);
        process.removeListener("SIGTERM", onSignal);
      }
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`${command} exited with code ${code}`));
      }
    });
  });
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
