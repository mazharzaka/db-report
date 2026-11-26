/**
 * دور الملف: التحقق من صحة التواريخ (YYYY-MM-DD) وحساب حدود النطاقات الزمنية SARGable بأمان دون إزاحة توقيت.
 * المدخلات: نصوص أو كائنات التواريخ (startDate, endDate).
 * المخرجات: تواريخ منسّقة ومحققة (startDate, endDate, endDateNextDay) ودوال مساعدة لليوم والأمس.
 */

const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

export function getTodayDateString() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function getYesterdayDateString() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function toYmd(value) {
  if (typeof value === "string" && ISO_DATE_REGEX.test(value.trim().slice(0, 10))) {
    return value.trim().slice(0, 10);
  }
  const dt = new Date(value);
  if (Number.isNaN(dt.getTime())) return "";
  const yyyy = dt.getFullYear();
  const mm = String(dt.getMonth() + 1).padStart(2, "0");
  const dd = String(dt.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

/**
 * التحقق من صحة نطاق التواريخ وحساب اليوم التالي (endDateNextDay) لاستخدامه مع (< @endDateNextDay)
 */
export function normalizeDateRange(startDate, endDate) {
  const parseToYmd = (val, fallback) => {
    if (!val) return fallback;
    const str = String(val).trim().slice(0, 10);
    if (ISO_DATE_REGEX.test(str)) {
      const [y, m, d] = str.split("-").map(Number);
      const dt = new Date(Date.UTC(y, m - 1, d));
      if (
        !Number.isNaN(dt.getTime()) &&
        dt.getUTCFullYear() === y &&
        dt.getUTCMonth() === m - 1 &&
        dt.getUTCDate() === d
      ) {
        return str;
      }
    }
    const parsed = new Date(val);
    if (Number.isNaN(parsed.getTime())) {
      const err = new Error(`تاريخ غير صالح (Invalid date): "${val}"`);
      err.statusCode = 400;
      throw err;
    }
    const y = parsed.getUTCFullYear();
    const m = String(parsed.getUTCMonth() + 1).padStart(2, "0");
    const d = String(parsed.getUTCDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  };

  const today = getTodayDateString();
  const sDate = parseToYmd(startDate, "2026-01-01");
  const eDate = parseToYmd(endDate, today);

  const [ey, em, ed] = eDate.split("-").map(Number);
  const nextDt = new Date(Date.UTC(ey, em - 1, ed + 1));
  const endDateNextDay = `${nextDt.getUTCFullYear()}-${String(nextDt.getUTCMonth() + 1).padStart(2, "0")}-${String(nextDt.getUTCDate()).padStart(2, "0")}`;

  return { startDate: sDate, endDate: eDate, endDateNextDay };
}
