/**
 * دور الملف: جسر توافق خلفي يعيد تصدير مجمع الاتصال المشترك (Singleton Pool) للوحدات القائمة.
 * المدخلات: يستورد الاتصال والإعدادات مباشرة من (db/sqlPool.js).
 * المخرجات: تصدير (getPool, sql, dbConfig, createRequest, bindIntList) بدون كسر أي استيراد قائم.
 */

export { getPool, sql, dbConfig, createRequest, bindIntList } from "../db/sqlPool.js";
