/**
 * دور الملف: طبقة وسيطة مهيأة لنظام الصلاحيات والأدوار (RBAC) دون التأثير على المسارات الحالية.
 * المدخلات: قائمة الأدوار المسموح لها (allowedRoles) وطلب Express (req, res, next).
 * المخرجات: تمرير الطلب حالياً (Pass-through) مع إرفاق req.userContext جاهزاً للربط مع JWT/Session مستقبلاً.
 */

/**
 * Placeholder جاهز لتفعيل التحقق من الأدوار مستقبلاً:
 * - CFO: وصول كامل لجميع القطاعات والتقارير المالية.
 * - Admin: وصول كامل + إدارة التسويات الخارجية (Gate Adjustments).
 * - BranchManager: تصفية تلقائية حسب قائمة الفروع المصرح بها (req.userContext.allowedBranches).
 *
 * @param {string[]} [allowedRoles=[]]
 */
export function rbacPlaceholder(allowedRoles = []) {
  return (req, _res, next) => {
    // TODO (RBAC Future Phase): استخراج التوكن/الجلسة والتحقق من الدور مقابل allowedRoles
    req.userContext = {
      authenticated: false,
      role: "PASS_THROUGH",
      requiredRoles: allowedRoles,
      branchScope: "ALL",
    };
    next();
  };
}
