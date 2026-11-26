import fs from 'fs';
import path from 'path';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const ADJUSTMENTS_FILE = path.join(DATA_DIR, 'gate_adjustments.json');

/**
 * Service to manage offline/external gate marketing sales adjustments.
 * Stored in a local JSON file with atomic writes.
 */
export class GateAdjustmentsService {
  static ensureFile() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      if (!fs.existsSync(ADJUSTMENTS_FILE)) {
        // Seed initial adjustment for 2026-11-01
        const initial = {
          "2026-11-01": {
            date: "2026-11-01",
            smExternalRevenue: 76540,
            smExternalSold: 356,
            smFree: 156,
            promoAdjustmentRev: 0,
            promoAdjustmentSold: 0,
            bgAdjustmentRev: 0,
            notes: "أوامر دخول تسويقية وتذاكر مشرفين"
          }
        };
        fs.writeFileSync(ADJUSTMENTS_FILE, JSON.stringify(initial, null, 2), 'utf8');
      }
    } catch (err) {
      console.error('[GateAdjustmentsService] Error ensuring adjustments file:', err);
    }
  }

  static readAll() {
    this.ensureFile();
    try {
      const data = fs.readFileSync(ADJUSTMENTS_FILE, 'utf8');
      return JSON.parse(data || '{}');
    } catch (err) {
      console.error('[GateAdjustmentsService] Error reading adjustments:', err);
      return {};
    }
  }

  static writeAll(data) {
    this.ensureFile();
    const tempFile = `${ADJUSTMENTS_FILE}.tmp.${Date.now()}`;
    try {
      fs.writeFileSync(tempFile, JSON.stringify(data, null, 2), 'utf8');
      fs.renameSync(tempFile, ADJUSTMENTS_FILE);
      return true;
    } catch (err) {
      console.error('[GateAdjustmentsService] Error atomic-writing adjustments:', err);
      if (fs.existsSync(tempFile)) {
        try { fs.unlinkSync(tempFile); } catch (_) {}
      }
      return false;
    }
  }

  static getAdjustments(startDate, endDate) {
    const all = this.readAll();
    if (!startDate && !endDate) return all;

    const filtered = {};
    for (const [date, item] of Object.entries(all)) {
      if (startDate && date < startDate) continue;
      if (endDate && date > endDate) continue;
      filtered[date] = item;
    }
    return filtered;
  }

  static getAdjustmentForDate(date) {
    const all = this.readAll();
    return all[date] || null;
  }

  static saveAdjustment(date, adjustmentData) {
    if (!date) throw new Error('Date is required');
    const all = this.readAll();
    all[date] = {
      date,
      smExternalRevenue: Number(adjustmentData.smExternalRevenue) || 0,
      smExternalSold: Number(adjustmentData.smExternalSold) || 0,
      smFree: Number(adjustmentData.smFree) || 0,
      promoAdjustmentRev: Number(adjustmentData.promoAdjustmentRev) || 0,
      promoAdjustmentSold: Number(adjustmentData.promoAdjustmentSold) || 0,
      bgAdjustmentRev: Number(adjustmentData.bgAdjustmentRev) || 0,
      notes: String(adjustmentData.notes || '').trim(),
      updatedAt: new Date().toISOString()
    };
    return this.writeAll(all);
  }

  static deleteAdjustment(date) {
    if (!date) return false;
    const all = this.readAll();
    if (all[date]) {
      delete all[date];
      return this.writeAll(all);
    }
    return true;
  }
}
