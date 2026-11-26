/**
 * دور الملف: إدارة مجمع اتصال واحد مشترك (Singleton sql.ConnectionPool) مع إعادة الاتصال التلقائي وبناء بارامترات SQL الآمنة.
 * المدخلات: إعدادات الاتصال (dbConfig) وطلبات إنشاء الاستعلامات وقوائم الأكواد الرقمية.
 * المخرجات: دوال (getPool, createRequest, bindIntList) وكائن (sql) للاستخدام المشترك دون إغلاق الـ Pool.
 */

import sql from "mssql";
import { dbConfig, env } from "../config/env.js";

let poolInstance = null;
let connectingPromise = null;

/**
 * استرجاع مجمع الاتصال النشط أو إنشاؤه تلقائياً (Singleton) مع حماية ضد تعدد الاتصالات المتزامنة
 * @returns {Promise<sql.ConnectionPool>}
 */
export async function getPool() {
  if (poolInstance && poolInstance.connected) {
    return poolInstance;
  }

  if (connectingPromise) {
    return connectingPromise;
  }

  connectingPromise = (async () => {
    try {
      if (poolInstance && !poolInstance.connected) {
        console.warn("[SQL Pool] الاتصال مفصول، جاري إعادة تهيئة المجمع...");
        try {
          await poolInstance.close();
        } catch (_) {}
        poolInstance = null;
      }

      const targetLabel = `${dbConfig.server}\\${dbConfig.options.instanceName}`;
      console.log(
        `[Database] Connecting to SQL Server 2014: ${targetLabel} [Database: ${dbConfig.database}]...`
      );
      const newPool = await sql.connect(dbConfig);

      newPool.on("error", (err) => {
        console.error("[SQL Pool Error] خطأ غير متوقع في مجمع الاتصال:", err.message);
        poolInstance = null;
      });

      poolInstance = newPool;
      console.log("[Database] ✅ تم الاتصال بـ SQL Server 2014 بنجاح.");
      return poolInstance;
    } catch (err) {
      poolInstance = null;
      console.error("[Database] ❌ فشل الاتصال بقاعدة البيانات:", err.message);
      throw new Error(
        `تعذر الاتصال بـ MS SQL Server (${dbConfig.server}\\${dbConfig.options.instanceName}): ${err.message}`
      );
    } finally {
      connectingPromise = null;
    }
  })();

  return connectingPromise;
}

/**
 * إنشاء طلب SQL مضبوط المهلة الزمنية (60000ms افتراضياً) لتجنب انقطاع تقارير السنة الكاملة
 */
export function createRequest(pool, timeoutMs = env.requestTimeoutMs) {
  const req = pool.request();
  req.timeout = timeoutMs;
  return req;
}

/**
 * تمرير قائمة أكواد رقمية عبر sql.Int Parameterized Inputs لمنع SQL Injection
 */
export function bindIntList(req, prefix, codes) {
  const cleanCodes = Array.isArray(codes)
    ? codes.map((c) => Number(c)).filter((n) => Number.isInteger(n))
    : [];
  const finalCodes = cleanCodes.length > 0 ? cleanCodes : [-1];
  return finalCodes
    .map((code, idx) => {
      const paramName = `${prefix}_${idx}`;
      req.input(paramName, sql.Int, code);
      return `@${paramName}`;
    })
    .join(", ");
}

export { sql, dbConfig };
