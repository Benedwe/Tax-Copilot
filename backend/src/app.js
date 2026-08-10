import "express-async-errors";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import path from "path";
import { fileURLToPath } from "url";
import rateLimit from "express-rate-limit";

import { prisma } from "./lib/prisma.js";
import authRoutes from "./routes/auth.js";
import documentRoutes from "./routes/documents.js";
import taxReturnRoutes from "./routes/taxReturns.js";
import calculatorRoutes from "./routes/calculator.js";

import cookieParser from "cookie-parser";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

app.set("trust proxy", 1);
app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(
  cors({
    origin: (origin, callback) => {
      const allowedOrigins = process.env.FRONTEND_ORIGIN?.split(",") || ["http://localhost:3000", "http://localhost:3001"];
      if (!origin || allowedOrigins.includes(origin) || allowedOrigins.includes("*")) {
        callback(null, true);
      } else {
        callback(null, true);
      }
    },
    credentials: true,
  })
);

app.use(cookieParser());

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  message: { error: "Too many requests from this IP, please try again later." },
});
app.use(globalLimiter);

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  message: { error: "Too many authentication attempts, please try again in 15 minutes." },
});
app.use("/api/auth/login", authLimiter);
app.use("/api/auth/register", authLimiter);

app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));
app.use(express.json({ limit: "5mb" }));


app.use("/uploads", express.static(path.join(__dirname, "..", "uploads"), { maxAge: "1d" }));


app.get("/health", async (req, res) => {
  let dbStatus = "ok";
  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch (err) {
    dbStatus = `unreachable: ${err.message}`;
  }
  res.json({
    status: dbStatus === "ok" ? "ok" : "degraded",
    database: dbStatus,
    time: new Date().toISOString(),
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/documents", documentRoutes);
app.use("/api/tax-returns", taxReturnRoutes);
app.use("/api/calculator", calculatorRoutes);

app.use((req, res) => res.status(404).json({ error: "Not found." }));

// Global error handler
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error("API Error Handler caught error:", err);

  const msg = err.message || "";
  if (
    err.code === "P1001" ||
    err.code === "P1002" ||
    msg.includes("Can't reach database server") ||
    msg.includes("ECONNREFUSED")
  ) {
    return res.status(500).json({
      error: "Database connection failed. Please ensure the PostgreSQL database service is running and DATABASE_URL is reachable.",
    });
  }

  res.status(err.status || 500).json({ error: err.message || "Internal server error." });
});

export default app;
