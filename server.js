/**
 * دور الملف: نقطة التشغيل الرئيسية لخادم Express (أقل من 100 سطر) تربط الإعدادات والضغط والمسارات ومعالج الأخطاء.
 * المدخلات: إعدادات البيئة (config/env.js)، الراوتس (routes/reportRoutes.js)، والـ Middlewares.
 * المخرجات: خادم HTTP/IIS Named Pipe جاهز لاستقبال الطلبات مع تهيئة اتصال SQL Server عند البدء.
 */

import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { env } from "./config/env.js";
import { getPool } from "./db/sqlPool.js";
import { compressionMiddleware } from "./middlewares/compression.js";
import { errorHandler } from "./middlewares/errorHandler.js";
import reportRoutes from "./routes/reportRoutes.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// 1. Core Middlewares (CORS, Gzip Compression, Body Parsers, Static Assets)
app.use(cors());
app.use(compressionMiddleware());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

// 2. Modular API Routes
app.use(reportRoutes);

// 3. Static SPA Fallbacks
app.get("/", (_req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.get("/login", (_req, res) => {
  res.sendFile(path.join(__dirname, "public", "login", "index.html"));
});

app.get(["/reports/*", "/reports", "/reports/caravans"], (_req, res) => {
  res.redirect("/");
});

// 4. Centralized Error Handler
app.use(errorHandler);

// 5. Start Server (Supports Standalone TCP & Windows IIS / iisnode Named Pipe)
const PORT = env.port;
const isNamedPipe =
  typeof PORT === "string" &&
  (PORT.startsWith("\\\\.\\pipe\\") || Number.isNaN(Number(PORT)));

async function onServerListening(modeLabel) {
  console.log(`\n🚀 Dream Park Financial Reporting Service (${modeLabel})`);
  console.log(`📍 Listening on: ${PORT}`);
  try {
    await getPool();
  } catch (err) {
    console.warn(`[Startup Warning] Initial DB connection check: ${err.message}`);
  }
}

if (isNamedPipe) {
  app.listen(PORT, () => onServerListening("IIS Named Pipe Mode"));
} else {
  const numericPort = parseInt(PORT, 10);
  app.listen(numericPort, "0.0.0.0", () => onServerListening(`TCP Port ${numericPort}`));
}
