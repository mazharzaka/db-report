/**
 * دور الملف: معالج أخطاء مركزي موحد لخادم Express يلتقط الاستثناءات ويسجلها دون إسقاط السيرفر.
 * المدخلات: كائن الخطأ (err) وطلب/استجابة Express (req, res, next).
 * المخرجات: استجابة JSON موحدة ومنظمة تتضمن كود الحالة ورسالة واضحة.
 */

import { env } from "../config/env.js";

export function errorHandler(err, req, res, _next) {
  const statusCode = Number(err?.statusCode) || 500;
  const message =
    err?.message || "حدث خطأ داخلي غير متوقع في خادم التقارير";

  console.error(`[API Error] ${req.method} ${req.originalUrl} -> ${statusCode}:`, err);

  if (res.headersSent) {
    return;
  }

  res.status(statusCode).json({
    status: "error",
    message,
    detail: env.nodeEnv !== "production" ? err?.stack : undefined,
    timestamp: new Date().toISOString(),
  });
}
