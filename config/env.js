/**
 * دور الملف: إدارة مركزية لمتغيرات البيئة، منفذ التشغيل (دعم IIS / iisnode)، وإعدادات SQL Server.
 * المدخلات: متغيرات البيئة من ملف (.env) وبيئة النظام (process.env).
 * المخرجات: كائنات إعدادات موحدة (env, dbConfig) تُستخدم في طبقة قاعدة البيانات والسيرفر.
 */

import dotenv from "dotenv";
dotenv.config();

const rawServer = process.env.DB_SERVER || "DP-DATABASESRV2\\SQL2014";
let serverHost = rawServer;
let instanceName = process.env.DB_INSTANCE || "SQL2014";

if (rawServer.includes("\\")) {
  const parts = rawServer.split("\\");
  serverHost = parts[0];
  instanceName = parts[1] || instanceName;
}

const requestTimeoutMs = Number(process.env.DB_REQUEST_TIMEOUT) || 60000;

export const env = {
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || "development",
  cacheTtlMs: Number(process.env.REPORT_CACHE_TTL_MS) || 5 * 60 * 1000, // 5 دقائق افتراضياً
  liveCacheTtlMs: Number(process.env.LIVE_CACHE_TTL_MS) || 45 * 1000, // 45 ثانية لبيانات اليوم
  cacheMaxEntries: Number(process.env.REPORT_CACHE_MAX_ENTRIES) || 60,
  requestTimeoutMs,
};

export const dbConfig = {
  user: process.env.DB_USER || "next",
  password: process.env.DB_PASSWORD || "1981",
  server: serverHost,
  database: process.env.DB_NAME || "dbDream_Park_Resturant",
  port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : undefined,
  requestTimeout: requestTimeoutMs,
  connectionTimeout: 20000,
  pool: {
    max: 25,
    min: 2,
    idleTimeoutMillis: 30000,
    acquireTimeoutMillis: 20000,
  },
  options: {
    encrypt: process.env.DB_ENCRYPT === "true",
    trustServerCertificate: process.env.DB_TRUST_SERVER_CERTIFICATE !== "false",
    instanceName,
    enableArithAbort: true,
    rowCollectionOnDone: false,
    requestTimeout: requestTimeoutMs,
  },
};
