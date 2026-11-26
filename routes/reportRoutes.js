/**
 * دور الملف: تعريف جميع مسارات واجهة البرمجة (API Routes) وربطها بطبقة الصلاحيات (RBAC) والمتحكمات (Controllers).
 * المدخلات: طلبات HTTP الواردة على مسارات (/api/*).
 * المخرجات: Express Router موحد يحافظ على كافة المسارات الحالية بنسبة 100% دون أي تغيير.
 */

import { Router } from "express";
import { rbacPlaceholder } from "../middlewares/rbacPlaceholder.js";
import { exportCaravanExcel } from "../controllers/exportController.js";
import {
  handleHealthCheck,
  handleSectorBranches,
  handleCaravanReport,
  handleGetGateAdjustments,
  handleSaveGateAdjustments,
  handleDeleteGateAdjustments,
  handleItemsSummary,
  handleItemsPerformance,
  handleExecutiveKpis,
  handlePeriodComparison,
  handleAuditBenchmark,
} from "../controllers/reportController.js";

const router = Router();
const viewerAccess = rbacPlaceholder(["CFO", "Admin", "BranchManager"]);
const adminAccess = rbacPlaceholder(["CFO", "Admin"]);

// 1. فحص حالة السيرفر وقاعدة البيانات
router.get("/api/health", handleHealthCheck);

// 2. قوائم فروع ومنافذ القطاعات
router.get("/api/caravans/branches", viewerAccess, handleSectorBranches);
router.get("/api/sectors/branches", viewerAccess, handleSectorBranches);
router.get("/api/reports/sectors/branches", viewerAccess, handleSectorBranches);

// 3. تقارير القطاعات والكرفانات (GET + POST)
router.get("/api/caravans/report", viewerAccess, handleCaravanReport);
router.post("/api/caravans/report", viewerAccess, handleCaravanReport);
router.get("/api/caravans-2026", viewerAccess, handleCaravanReport);
router.post("/api/caravans-2026", viewerAccess, handleCaravanReport);
router.get("/api/reports/caravans-2026", viewerAccess, handleCaravanReport);
router.get("/api/reports/caravans", viewerAccess, handleCaravanReport);
router.get("/api/sectors/report", viewerAccess, handleCaravanReport);
router.post("/api/sectors/report", viewerAccess, handleCaravanReport);
router.get("/api/reports/sectors", viewerAccess, handleCaravanReport);

// 4. تصدير إكسيل المحاسبي
router.get("/api/caravans/export", viewerAccess, exportCaravanExcel);
router.get("/api/sectors/export", viewerAccess, exportCaravanExcel);

// 5. تسويات مبيعات البوابات والتسويق الخارجية (SectorType = 5)
router.get("/api/gate-adjustments", viewerAccess, handleGetGateAdjustments);
router.post("/api/gate-adjustments", adminAccess, handleSaveGateAdjustments);
router.delete("/api/gate-adjustments/:date", adminAccess, handleDeleteGateAdjustments);

// 6. تحليلات الأصناف والمؤشرات والمقارنات والتدقيق الذهبي
router.get("/api/reports/caravans/items-summary", viewerAccess, handleItemsSummary);
router.get("/api/reports/caravans/items-performance", viewerAccess, handleItemsPerformance);
router.get("/api/reports/caravans/executive-kpis", viewerAccess, handleExecutiveKpis);
router.get("/api/reports/caravans/comparison", viewerAccess, handlePeriodComparison);
router.get(
  ["/api/reports/caravans/audit-benchmark", "/api/caravans/audit-benchmark"],
  viewerAccess,
  handleAuditBenchmark
);

export default router;
