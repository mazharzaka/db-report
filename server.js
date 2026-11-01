/**
 * @file server.js
 * @description Decoupled Express Backend Microservice for Dream Park & Zoo Financial Reporting.
 * Listens on Port 5000 as a standalone Windows Service or behind IIS Reverse Proxy.
 */

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { getPool } from './config/db.js';
import { CaravanReportService } from './services/caravanReportService.js';
import { CaravanItemService } from './services/caravanItemService.js';
import { exportCaravanExcel } from './controllers/exportController.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// خدمة الملفات السكونية (دعم تشغيل Express منفرداً أو في بيئات الاختبار)
app.use(express.static(path.join(__dirname, 'public')));

// 1. Healthcheck & DB Diagnostics
app.get('/api/health', async (req, res) => {
    try {
        const pool = await getPool();
        const testRes = await pool.request().query('SELECT @@VERSION AS [version], GETDATE() AS [serverTime];');
        res.json({
            status: 'ok',
            service: 'Dream Park Caravan Revenues Reporting Service',
            serverTime: testRes.recordset[0]?.serverTime,
            uptimeSeconds: Math.floor(process.uptime()),
            timestamp: new Date().toISOString()
        });
    } catch (err) {
        res.status(503).json({
            status: 'error',
            service: 'Dream Park Caravan Revenues Reporting Service',
            databaseConnected: false,
            error: err.message
        });
    }
});

// 2. Metadata Endpoint: استرجاع جميع منافذ الكرفانات (Type = 4)
app.get('/api/caravans/branches', async (req, res) => {
    try {
        const branches = await CaravanReportService.getCaravanBranches();
        res.json({
            status: 'success',
            count: branches.length,
            branches: branches.map(b => ({
                Code: b.Code,
                Name: b.Name
            }))
        });
    } catch (err) {
        console.error('[API Error] /api/caravans/branches:', err);
        res.status(500).json({ status: 'error', message: err.message });
    }
});

// 3. Controller Handler للتقرير التحليلي للكرفانات
async function handleCaravanReport(req, res) {
    try {
        const queryParams = { ...req.query, ...req.body };
        const { startDate, endDate, granularity, sort } = queryParams;

        let branches = [];
        if (queryParams.branches) {
            if (Array.isArray(queryParams.branches)) {
                branches = queryParams.branches.flatMap(b => String(b).split(','));
            } else {
                branches = String(queryParams.branches).split(',');
            }
        }
        branches = branches.map(b => b.trim()).filter(Boolean);

        const report = await CaravanReportService.getReportData({
            startDate: startDate ? String(startDate).trim() : '2026-01-01',
            endDate: endDate ? String(endDate).trim() : new Date().toISOString().split('T')[0],
            branches,
            granularity: (granularity || 'summary').toLowerCase(),
            sortBy: (sort || 'total_desc').toLowerCase()
        });

        res.json({
            status: 'success',
            ...report
        });
    } catch (err) {
        console.error('[API Error] handleCaravanReport:', err);
        res.status(500).json({
            status: 'error',
            message: err.message,
            timestamp: new Date().toISOString()
        });
    }
}

// مسارات استعلام تقرير الكرفانات
app.get('/api/caravans/report', handleCaravanReport);
app.post('/api/caravans/report', handleCaravanReport);
app.get('/api/caravans-2026', handleCaravanReport);
app.post('/api/caravans-2026', handleCaravanReport);
app.get('/api/reports/caravans-2026', handleCaravanReport);
app.get('/api/reports/caravans', handleCaravanReport);

// 4. مسار تصدير إكسيل المحاسبي المعتمد (ExcelJS RTL)
app.get('/api/caravans/export', exportCaravanExcel);

// 5. التحليلات التشغيلية على مستوى الأصناف (Pos_item_post)
// params: startDate, endDate, branchCode (واحد أو عدة أكواد مفصولة بفاصلة), metricType = revenue | quantity, mode = best | slow
app.get('/api/reports/caravans/items-summary', async (req, res) => {
    try {
        const { startDate, endDate, branchCode, metricType, mode } = req.query;
        const branchCodes = branchCode
            ? String(branchCode).split(',').map(b => b.trim()).filter(Boolean)
            : [];

        const data = await CaravanItemService.getItemsSummary({
            startDate: startDate ? String(startDate).trim() : '',
            endDate: endDate ? String(endDate).trim() : '',
            branchCodes,
            metricType: metricType ? String(metricType).toLowerCase() : 'revenue',
            mode: mode ? String(mode).toLowerCase() : 'best'
        });
        res.json({ status: 'success', ...data });
    } catch (err) {
        console.error('[API Error] items-summary:', err);
        res.status(err.statusCode || 500).json({
            status: 'error',
            message: err.message,
            timestamp: new Date().toISOString()
        });
    }
});

// 5b. مسار تحليل أداء ومبيعات الأصناف التفصيلي مع البحث الحي وترقيم الصفحات ومقارنة الفترات
// GET /api/reports/caravans/items-performance
app.get('/api/reports/caravans/items-performance', async (req, res) => {
    try {
        const {
            startDate,
            endDate,
            prevStartDate,
            prevEndDate,
            branchCode,
            branches,
            search,
            page,
            limit,
            sortBy,
            sortOrder,
        } = req.query;

        const rawBranches = branchCode || branches;
        const branchCodes = rawBranches
            ? String(rawBranches).split(',').map((b) => b.trim()).filter(Boolean)
            : [];

        const data = await CaravanItemService.getItemsPerformance({
            startDate: String(startDate || '2026-01-01').trim(),
            endDate: String(endDate || new Date().toISOString().split('T')[0]).trim(),
            prevStartDate: prevStartDate ? String(prevStartDate).trim() : undefined,
            prevEndDate: prevEndDate ? String(prevEndDate).trim() : undefined,
            branchCodes,
            search: search ? String(search).trim() : '',
            page: parseInt(page, 10) || 1,
            limit: parseInt(limit, 10) || 20,
            sortBy: sortBy ? String(sortBy).trim() : 'revenue',
            sortOrder: sortOrder ? String(sortOrder).trim() : 'desc',
        });

        res.json(data);
    } catch (err) {
        console.error('[API Error] items-performance:', err);
        res.status(err.statusCode || 500).json({
            status: 'error',
            message: err.message,
            timestamp: new Date().toISOString(),
        });
    }
});

// 6. مسار المؤشرات المالية والتنفيذية السريعة (Single-Trip Parallel Conditional Aggregation)
app.get('/api/reports/caravans/executive-kpis', async (req, res) => {
    try {
        const { startDate, endDate, prevStartDate, prevEndDate, branchCode } = req.query;
        const branchCodes = branchCode
            ? String(branchCode).split(',').map((b) => b.trim()).filter(Boolean)
            : [];

        const data = await CaravanItemService.getExecutiveKpis({
            startDate: String(startDate || '').trim(),
            endDate: String(endDate || '').trim(),
            prevStartDate: prevStartDate ? String(prevStartDate).trim() : undefined,
            prevEndDate: prevEndDate ? String(prevEndDate).trim() : undefined,
            branchCodes,
        });

        res.json(data);
    } catch (err) {
        console.error('[API Error] executive-kpis:', err);
        res.status(err.statusCode || 500).json({
            status: 'error',
            message: err.message,
            timestamp: new Date().toISOString(),
        });
    }
});

// 7. مسار مقارنة الفترات الزمنية (Period-over-Period Comparison)
app.get('/api/reports/caravans/comparison', async (req, res) => {
    try {
        const { periodAStart, periodAEnd, periodBStart, periodBEnd, branchCode } = req.query;
        const branchCodes = branchCode
            ? String(branchCode).split(',').map((b) => b.trim()).filter(Boolean)
            : [];

        const comparison = await CaravanItemService.getPeriodComparison({
            periodA: { startDate: String(periodAStart || '').trim(), endDate: String(periodAEnd || '').trim() },
            periodB: { startDate: String(periodBStart || '').trim(), endDate: String(periodBEnd || '').trim() },
            branchCodes,
        });

        res.json({ status: 'success', ...comparison });
    } catch (err) {
        console.error('[API Error] comparison:', err);
        res.status(err.statusCode || 500).json({
            status: 'error',
            message: err.message,
            timestamp: new Date().toISOString(),
        });
    }
});

// 8. مسار فحص وتدقيق المعيار المالي الذهبي (Golden Benchmark Audit & Reconciliation)
app.get(['/api/reports/caravans/audit-benchmark', '/api/caravans/audit-benchmark'], async (req, res) => {
    try {
        const audit = await CaravanItemService.getGoldenBenchmarkAudit();
        res.json(audit);
    } catch (err) {
        console.error('[API Error] audit-benchmark:', err);
        res.status(500).json({
            status: 'error',
            message: err.message,
            timestamp: new Date().toISOString(),
        });
    }
});

// Fallback to index.html for Root and Next.js static pages
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/reports/caravans', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'reports', 'caravans', 'index.html'));
});

// Global Error Handler
app.use((err, req, res, next) => {
    console.error('[Server Unhandled Error]:', err);
    res.status(500).json({
        status: 'error',
        message: 'حدث خطأ داخلي في خادم التقارير',
        detail: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// Start Server (Supports both Standalone TCP socket and IIS Named Pipe)
const isNamedPipe = typeof PORT === 'string' && (PORT.startsWith('\\\\.\\pipe\\') || isNaN(Number(PORT)));

if (isNamedPipe) {
    app.listen(PORT, async () => {
        console.log(`\n===============================================================`);
        console.log(`🚀 Dream Park Reporting Service (IIS Named Pipe Mode)`);
        console.log(`📍 Named Pipe:      ${PORT}`);
        console.log(`⚡ API Endpoint:    /api/caravans/report`);
        console.log(`===============================================================\n`);
        try {
            await getPool();
            // تشغيل فحص المطابقة المالي الذهبي عند بدء التشغيل
            const audit = await CaravanItemService.getGoldenBenchmarkAudit().catch(() => null);
            if (audit) {
                console.log(`🎯 [Golden Financial Benchmark] Range: 2026-01-01 to 2026-10-25`);
                console.log(`   - Checks:         ${audit.actual.totalChecks} [${audit.checks.totalInvoices} ✅]`);
                console.log(`   - Caravans Tax:   ${audit.actual.caravansSpecificTax.toLocaleString('en-US', { minimumFractionDigits: 2 })} EGP [${audit.checks.caravansSpecific} ✅]`);
                console.log(`   - Net / Subtotal: ${audit.actual.netSubtotal.toLocaleString('en-US', { minimumFractionDigits: 2 })} EGP [${audit.checks.netSubtotal} ✅]`);
                console.log(`   - Taxes & Serv.:  ${audit.actual.taxesServices.toLocaleString('en-US', { minimumFractionDigits: 2 })} EGP [${audit.checks.taxesServices} ✅]`);
                console.log(`   - Grand Total:    ${audit.actual.grandTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })} EGP [${audit.checks.grandTotal} ✅]`);
                console.log(`   ⚡ Status:        ${audit.passed ? 'ALL BENCHMARK METRICS PASS 100%' : 'DISCREPANCY DETECTED'}\n`);
            }
        } catch (err) {
            console.warn(`[Startup Warning] Initial database connection check: ${err.message}`);
        }
    });
} else {
    const numericPort = parseInt(PORT, 10);
    app.listen(numericPort, '0.0.0.0', async () => {
        console.log(`\n===============================================================`);
        console.log(`🚀 Dream Park Financial Reporting Microservice`);
        console.log(`📍 Service Port:    ${numericPort}`);
        console.log(`📍 Network Address: http://0.0.0.0:${numericPort}`);
        console.log(`⚡ API Health:      http://127.0.0.1:${numericPort}/api/health`);
        console.log(`⚡ Caravan Report:  http://127.0.0.1:${numericPort}/api/caravans/report`);
        console.log(`⚡ Excel Export:    http://127.0.0.1:${numericPort}/api/caravans/export`);
        console.log(`===============================================================\n`);
        try {
            await getPool();
            // تشغيل فحص المطابقة المالي الذهبي عند بدء التشغيل
            const audit = await CaravanItemService.getGoldenBenchmarkAudit().catch(() => null);
            if (audit) {
                console.log(`🎯 [Golden Financial Benchmark] Range: 2026-01-01 to 2026-10-25`);
                console.log(`   - Checks:         ${audit.actual.totalChecks} [${audit.checks.totalInvoices} ✅]`);
                console.log(`   - Caravans Tax:   ${audit.actual.caravansSpecificTax.toLocaleString('en-US', { minimumFractionDigits: 2 })} EGP [${audit.checks.caravansSpecific} ✅]`);
                console.log(`   - Net / Subtotal: ${audit.actual.netSubtotal.toLocaleString('en-US', { minimumFractionDigits: 2 })} EGP [${audit.checks.netSubtotal} ✅]`);
                console.log(`   - Taxes & Serv.:  ${audit.actual.taxesServices.toLocaleString('en-US', { minimumFractionDigits: 2 })} EGP [${audit.checks.taxesServices} ✅]`);
                console.log(`   - Grand Total:    ${audit.actual.grandTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })} EGP [${audit.checks.grandTotal} ✅]`);
                console.log(`   ⚡ Status:        ${audit.passed ? 'ALL BENCHMARK METRICS PASS 100%' : 'DISCREPANCY DETECTED'}\n`);
            }
        } catch (err) {
            console.warn(`[Startup Warning] Initial database connection check: ${err.message}`);
        }
    });
}
