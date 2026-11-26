'use client';

import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Edit2, Save, FileText, CheckCircle2, AlertCircle } from 'lucide-react';

interface GateAdjustment {
  date: string;
  smExternalRevenue: number;
  smExternalSold: number;
  smFree: number;
  promoAdjustmentRev: number;
  promoAdjustmentSold: number;
  bgAdjustmentRev: number;
  notes: string;
  updatedAt?: string;
}

interface GateAdjustmentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  currentDate?: string;
}

export function GateAdjustmentsModal({
  isOpen,
  onClose,
  onSaved,
  currentDate = new Date().toISOString().split('T')[0],
}: GateAdjustmentsModalProps) {
  const [adjustments, setAdjustments] = useState<Record<string, GateAdjustment>>({});
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form state
  const [selectedDate, setSelectedDate] = useState<string>(currentDate);
  const [smRev, setSmRev] = useState<number>(0);
  const [smSold, setSmSold] = useState<number>(0);
  const [smFree, setSmFree] = useState<number>(0);
  const [promoRev, setPromoRev] = useState<number>(0);
  const [promoSold, setPromoSold] = useState<number>(0);
  const [bgRev, setBgRev] = useState<number>(0);
  const [notes, setNotes] = useState<string>('');

  const fetchAdjustments = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/gate-adjustments');
      const json = await res.json();
      if (json.status === 'success' && json.data) {
        setAdjustments(json.data);
      }
    } catch (err) {
      console.error('Failed to load adjustments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchAdjustments();
      setSelectedDate(currentDate || new Date().toISOString().split('T')[0]);
    }
  }, [isOpen, currentDate]);

  useEffect(() => {
    if (adjustments[selectedDate]) {
      const adj = adjustments[selectedDate];
      setSmRev(adj.smExternalRevenue || 0);
      setSmSold(adj.smExternalSold || 0);
      setSmFree(adj.smFree || 0);
      setPromoRev(adj.promoAdjustmentRev || 0);
      setPromoSold(adj.promoAdjustmentSold || 0);
      setBgRev(adj.bgAdjustmentRev || 0);
      setNotes(adj.notes || '');
    } else {
      setSmRev(0);
      setSmSold(0);
      setSmFree(0);
      setPromoRev(0);
      setPromoSold(0);
      setBgRev(0);
      setNotes('');
    }
  }, [selectedDate, adjustments]);

  if (!isOpen) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDate) return;

    try {
      setLoading(true);
      const payload = {
        date: selectedDate,
        smExternalRevenue: Number(smRev) || 0,
        smExternalSold: Number(smSold) || 0,
        smFree: Number(smFree) || 0,
        promoAdjustmentRev: Number(promoRev) || 0,
        promoAdjustmentSold: Number(promoSold) || 0,
        bgAdjustmentRev: Number(bgRev) || 0,
        notes: notes.trim(),
      };

      const res = await fetch('/api/gate-adjustments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (json.status === 'success') {
        setStatusMsg({ type: 'success', text: `تم حفظ تسوية تاريخ ${selectedDate} بنجاح` });
        await fetchAdjustments();
        onSaved();
        setTimeout(() => setStatusMsg(null), 3000);
      } else {
        setStatusMsg({ type: 'error', text: json.message || 'فشل في حفظ التسوية' });
      }
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err.message || 'حدث خطأ أثناء الحفظ' });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (dateToDelete: string) => {
    if (!confirm(`هل أنت متأكد من حذف تسوية تاريخ ${dateToDelete}؟`)) return;

    try {
      setLoading(true);
      const res = await fetch(`/api/gate-adjustments/${dateToDelete}`, {
        method: 'DELETE',
      });
      const json = await res.json();
      if (json.status === 'success') {
        setStatusMsg({ type: 'success', text: `تم حذف تسوية تاريخ ${dateToDelete}` });
        await fetchAdjustments();
        onSaved();
        setTimeout(() => setStatusMsg(null), 3000);
      }
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err.message || 'فشل في حذف التسوية' });
    } finally {
      setLoading(false);
    }
  };

  const adjList = Object.values(adjustments).sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[90vh] flex flex-col rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-2xl overflow-hidden text-right" dir="rtl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-800/50">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                تسويات أوامر المبيعات والتسويق الخارجية (البوابات)
              </h2>
              <p className="text-xs text-slate-500 dark:text-zinc-400">
                إدراج مبيعات المجموعات وعقود الشركات وتذاكر المشرفين الصادرة بأوامر إدارية خارج نظام الـ POS
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status Message */}
        {statusMsg && (
          <div className={`mx-6 mt-4 p-3 rounded-lg flex items-center gap-2 text-sm font-semibold ${statusMsg.type === 'success' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'}`}>
            {statusMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            <span>{statusMsg.text}</span>
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Form */}
          <form onSubmit={handleSave} className="p-5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-800/30 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-zinc-800">
              <span className="font-bold text-sm text-slate-800 dark:text-zinc-200 flex items-center gap-1.5">
                <Plus className="w-4 h-4 text-cyan-500" />
                <span>إضافة / تعديل تسوية يومية</span>
              </span>
              <div className="flex items-center gap-2">
                <label className="text-xs font-semibold text-slate-600 dark:text-zinc-400">تاريخ اليوم:</label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="px-3 py-1.5 text-xs font-mono font-bold rounded-lg border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-cyan-500"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* S&M External Rev */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1">
                  مبيعات S&M خارجية (جنيه):
                </label>
                <input
                  type="number"
                  step="any"
                  value={smRev}
                  onChange={(e) => setSmRev(Number(e.target.value))}
                  placeholder="مثال: 76540"
                  className="w-full px-3 py-2 text-sm font-mono font-bold rounded-lg border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-cyan-500"
                />
                <span className="text-[11px] text-slate-400">تضاف لإيراد S&M والآجل C/L</span>
              </div>

              {/* S&M External Sold */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1">
                  تذاكر S&M خارجية مباعة (عدد):
                </label>
                <input
                  type="number"
                  value={smSold}
                  onChange={(e) => setSmSold(Number(e.target.value))}
                  placeholder="مثال: 356"
                  className="w-full px-3 py-2 text-sm font-mono font-bold rounded-lg border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-cyan-500"
                />
                <span className="text-[11px] text-slate-400">تضاف لعدد تذاكر S&M</span>
              </div>

              {/* S&M Free */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1">
                  تذاكر مشرفين مجانية (Free):
                </label>
                <input
                  type="number"
                  value={smFree}
                  onChange={(e) => setSmFree(Number(e.target.value))}
                  placeholder="مثال: 156"
                  className="w-full px-3 py-2 text-sm font-mono font-bold rounded-lg border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-cyan-500"
                />
                <span className="text-[11px] text-slate-400">عمود مجاني المشرفين والسائقين</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Promo Rev Adj */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1">
                  تسوية إيراد Promotion (جنيه):
                </label>
                <input
                  type="number"
                  step="any"
                  value={promoRev}
                  onChange={(e) => setPromoRev(Number(e.target.value))}
                  placeholder="0.00"
                  className="w-full px-3 py-2 text-sm font-mono rounded-lg border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-cyan-500"
                />
              </div>

              {/* Promo Sold Adj */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1">
                  تسوية تذاكر Promotion (عدد):
                </label>
                <input
                  type="number"
                  value={promoSold}
                  onChange={(e) => setPromoSold(Number(e.target.value))}
                  placeholder="0"
                  className="w-full px-3 py-2 text-sm font-mono rounded-lg border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-cyan-500"
                />
              </div>

              {/* Staff BG Adj */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1">
                  تسوية تذاكر عاملين B.G (جنيه):
                </label>
                <input
                  type="number"
                  step="any"
                  value={bgRev}
                  onChange={(e) => setBgRev(Number(e.target.value))}
                  placeholder="0.00"
                  className="w-full px-3 py-2 text-sm font-mono rounded-lg border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-cyan-500"
                />
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1">
                البيان / ملاحظات التسوية والمستندات:
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="أوامر دخول تسويقية معتمدة وتذاكر مشرفين لرحلات المدارس والشركات"
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-cyan-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold text-white bg-cyan-600 hover:bg-cyan-500 transition shadow-sm active:scale-95 disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>حفظ التسوية</span>
              </button>
            </div>
          </form>

          {/* Existing Adjustments Table */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-slate-800 dark:text-zinc-200">
              التسويات المحفوظة حالياً في النظام ({adjList.length}):
            </h3>

            {adjList.length === 0 ? (
              <div className="p-8 text-center border border-dashed border-slate-300 dark:border-zinc-700 rounded-xl text-slate-500 text-xs">
                لا توجد تسويات خارجية مسجلة حالياً
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-zinc-800">
                <table className="w-full text-xs text-right">
                  <thead className="bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 font-bold border-b border-slate-200 dark:border-zinc-700">
                    <tr>
                      <th className="p-2.5">التاريخ</th>
                      <th className="p-2.5">إيراد S&M</th>
                      <th className="p-2.5">تذاكر S&M</th>
                      <th className="p-2.5">مجاني</th>
                      <th className="p-2.5">البيان والملاحظات</th>
                      <th className="p-2.5 text-center">إجراءات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-zinc-800 font-mono">
                    {adjList.map((adj) => (
                      <tr key={adj.date} className="hover:bg-slate-50 dark:hover:bg-zinc-800/40">
                        <td className="p-2.5 font-bold text-slate-900 dark:text-white">{adj.date}</td>
                        <td className="p-2.5 text-cyan-600 dark:text-cyan-400 font-bold">
                          {Number(adj.smExternalRevenue || 0).toLocaleString()} ج.م
                        </td>
                        <td className="p-2.5 font-bold">{adj.smExternalSold || 0}</td>
                        <td className="p-2.5 text-emerald-600 font-bold">{adj.smFree || 0}</td>
                        <td className="p-2.5 font-sans text-slate-600 dark:text-zinc-400 truncate max-w-[200px]" title={adj.notes}>
                          {adj.notes || '—'}
                        </td>
                        <td className="p-2.5 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => setSelectedDate(adj.date)}
                              className="p-1 text-slate-400 hover:text-cyan-500 hover:bg-slate-100 dark:hover:bg-zinc-700 rounded transition"
                              title="تعديل"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(adj.date)}
                              className="p-1 text-slate-400 hover:text-rose-500 hover:bg-slate-100 dark:hover:bg-zinc-700 rounded transition"
                              title="حذف"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end px-6 py-3.5 border-t border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-800/30">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold rounded-lg border border-slate-300 dark:border-zinc-700 text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 transition"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
}
