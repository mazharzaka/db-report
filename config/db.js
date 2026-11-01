/**
 * @file config/db.js
 * @description Resilient Microsoft SQL Server 2014 Connection Pool Provider for Dream Park.
 * Supports Named Instance ('DP-DATABASESRV2\\SQL2014'), automatic reconnection, and connection pooling.
 */

import sql from 'mssql';
import dotenv from 'dotenv';
dotenv.config();

// تحليل عنوان الخاسم واسم الـ Named Instance
const rawServer = process.env.DB_SERVER || 'DP-DATABASESRV2\\SQL2014';
let serverHost = rawServer;
let instanceName = process.env.DB_INSTANCE || 'SQL2014';

if (rawServer.includes('\\')) {
    const parts = rawServer.split('\\');
    serverHost = parts[0];
    instanceName = parts[1] || instanceName;
}

export const dbConfig = {
    user: process.env.DB_USER || 'next',
    password: process.env.DB_PASSWORD || '1981',
    server: serverHost,
    database: process.env.DB_NAME || 'dbDream_Park_Resturant',
    port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : undefined,
    requestTimeout: 60000,
    connectionTimeout: 20000,
    pool: {
        max: 25,
        min: 2,
        idleTimeoutMillis: 30000,
        acquireTimeoutMillis: 20000
    },
    options: {
        encrypt: process.env.DB_ENCRYPT === 'true', // يجب أن تكون false لـ SQL Server 2014 بدون SSL
        trustServerCertificate: process.env.DB_TRUST_SERVER_CERTIFICATE !== 'false',
        instanceName: instanceName,
        enableArithAbort: true,
        rowCollectionOnDone: false
    }
};

let pool = null;

/**
 * الحصول على مجمع الاتصال النشط أو إعادة إنشائه تلقائياً في حال انقطاع الشبكة
 * @returns {Promise<sql.ConnectionPool>}
 */
export async function getPool() {
    if (pool && pool.connected) {
        return pool;
    }

    try {
        if (pool && !pool.connected) {
            console.warn('[Database Pool] الاتصال مفصول، جاري إغلاق المجمع القديم...');
            try {
                await pool.close();
            } catch (_) {}
            pool = null;
        }

        console.log(`[Database] Connecting to SQL Server 2014: ${serverHost}\\${instanceName} [Database: ${dbConfig.database}]...`);
        pool = await sql.connect(dbConfig);

        pool.on('error', (err) => {
            console.error('[Database Pool Error] خطأ غير متوقع في مجمع SQL:', err.message);
            pool = null;
        });

        console.log('[Database] ✅ تم الاتصال بـ SQL Server 2014 بنجاح.');
        return pool;
    } catch (err) {
        console.error('[Database] ❌ فشل الاتصال بقاعدة البيانات:', err.message);
        pool = null;
        throw new Error(`تعذر الاتصال بـ MS SQL Server (${serverHost}\\${instanceName}): ${err.message}`);
    }
}

export { sql };

