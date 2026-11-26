/**
 * دور الملف: طبقة وسيطة لضغط استجابات JSON الكبيرة باستخدام zlib gzip المدمج في Node.js لتقليل حجم الشبكة.
 * المدخلات: طلب واستجابة Express (req, res, next).
 * المخرجات: ضغط تلقائي للاستجابات النصية/JSON التي تتجاوز 1KB عند دعم العميل لـ gzip.
 */

import zlib from "zlib";

export function compressionMiddleware() {
  return (req, res, next) => {
    const acceptEncoding = String(req.headers["accept-encoding"] || "");
    if (!acceptEncoding.includes("gzip")) {
      return next();
    }

    const originalJson = res.json.bind(res);
    res.json = (body) => {
      try {
        const jsonStr = JSON.stringify(body);
        if (jsonStr.length < 1024) {
          return originalJson(body);
        }
        zlib.gzip(Buffer.from(jsonStr, "utf8"), (err, compressed) => {
          if (err || res.headersSent) {
            return originalJson(body);
          }
          res.setHeader("Content-Type", "application/json; charset=utf-8");
          res.setHeader("Content-Encoding", "gzip");
          res.setHeader("Vary", "Accept-Encoding");
          res.send(compressed);
        });
        return res;
      } catch (_) {
        return originalJson(body);
      }
    };
    next();
  };
}
