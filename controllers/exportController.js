/**
 * @file controllers/exportController.js
 * @description Enterprise Financial Arabic RTL Excel Exporter for Dream Park.
 * Employs ExcelJS to generate accounting-compliant spreadsheets with formulas,
 * number formatting (#,,##0.00), custom palette styling, and RTL layout.
 */

import ExcelJS from 'exceljs';
import { CaravanReportService } from '../services/caravanReportService.js';

export async function exportCaravanExcel(req, res) {
    try {
        const { startDate, endDate, branches, granularity } = req.query;
        const branchList = branches ? String(branches).split(',').filter(Boolean) : [];

        const report = await CaravanReportService.getReportData({
            startDate: startDate || '2026-01-01',
            endDate: endDate || new Date().toISOString().split('T')[0],
            branches: branchList,
            granularity: granularity || 'summary'
        });

        const workbook = new ExcelJS.Workbook();
        workbook.creator = 'منظومة دريم بارك المالية والمحاسبية';
        workbook.lastModifiedBy = 'Dream Park Reporting Service';
        workbook.created = new Date();
        workbook.modified = new Date();

        // إعداد ورقة العمل مع إجبار العرض من اليمين إلى اليسار
        const worksheet = workbook.addWorksheet('إيرادات الكرفانات والمنافذ', {
            views: [{ rightToLeft: true, showGridLines: true }],
            pageSetup: {
                paperSize: 9, // A4
                orientation: 'landscape',
                fitToPage: true,
                fitToWidth: 1,
                fitToHeight: 0
            }
        });

        const isTimeAggregated = granularity === 'month' || granularity === 'day';

        // 1. ترويسة التقرير المؤسسية (Corporate Header Block)
        worksheet.mergeCells('A1:H1');
        const titleCell = worksheet.getCell('A1');
        titleCell.value = 'دريم بارك & زوو — تقرير الإيرادات والتحليلات المالية للمنافذ والكرفانات';
        titleCell.font = { name: 'Arial', size: 16, bold: true, color: { argb: 'FFFFFFFF' } };
        titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F172A' } }; // Midnight Navy
        titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
        worksheet.getRow(1).height = 42;

        // السطر الفرعي (بيانات الفترة ونوع التقرير وتاريخ الاستخراج)
        worksheet.mergeCells('A2:H2');
        const subtitleCell = worksheet.getCell('A2');
        const reportTypeLabel = granularity === 'month' ? 'شهري' : granularity === 'day' ? 'يومي تفصيلي' : 'إجمالي تراكمي للمنافذ';
        subtitleCell.value = `الفترة من: ${report.filters.startDate}  إلى: ${report.filters.endDate}  |  نوع التقرير: ${reportTypeLabel}  |  تاريخ وساعة الاستخراج: ${new Date().toLocaleString('ar-EG')}`;
        subtitleCell.font = { name: 'Arial', size: 10, italic: true, color: { argb: 'FF475569' } };
        subtitleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };
        subtitleCell.alignment = { vertical: 'middle', horizontal: 'center' };
        worksheet.getRow(2).height = 24;

        worksheet.addRow([]); // فاصل بصري
        worksheet.getRow(3).height = 10;

        // 2. ترويسة أعمدة الجدول (Table Columns Header)
        const headers = isTimeAggregated
            ? ['كود المنفذ', 'اسم المنفذ / الكرفان', 'الفترة', 'عدد الطلبات (Cover)', 'المحصل نقداً (Cash)', 'الفيزا (Visa)', 'الآجل (C/L)', 'الإجمالي المحقق (Total)', 'المرتجعات (Voids)', 'فارق التسوية (Variance)']
            : ['كود المنفذ', 'اسم المنفذ / الكرفان', 'عدد الطلبات (Cover)', 'المحصل نقداً (Cash)', 'الفيزا (Visa)', 'الآجل (C/L)', 'الإجمالي المحقق (Total)', 'متوسط الفاتورة (Avg Ticket)', 'المرتجعات (Voids)', 'فارق التسوية (Variance)'];

        const headerRow = worksheet.addRow(headers);
        headerRow.height = 30;
        headerRow.eachCell((cell) => {
            cell.font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F766E' } }; // Corporate Emerald Teal
            cell.alignment = { vertical: 'middle', horizontal: 'center' };
            cell.border = {
                top: { style: 'thin', color: { argb: 'FFCBD5E1' } },
                bottom: { style: 'medium', color: { argb: 'FF042F2E' } },
                left: { style: 'thin', color: { argb: 'FFCBD5E1' } },
                right: { style: 'thin', color: { argb: 'FFCBD5E1' } }
            };
        });

        // 3. كتابة بيانات الصفوف (Data Rows)
        const startRowIndex = 5;
        report.records.forEach((item, index) => {
            const rowValues = isTimeAggregated
                ? [item.branchCode, item.name, item.period, item.cover, item.cash, item.visa, item.creditLine, item.total, item.totalVoids || 0, item.variance || 0]
                : [item.branchCode, item.name, item.cover, item.cash, item.visa, item.creditLine, item.total, item.avgTicket, item.totalVoids || 0, item.variance || 0];

            const row = worksheet.addRow(rowValues);
            row.height = 22;

            const isEven = index % 2 === 0;
            const zebraBg = isEven ? 'FFFFFFFF' : 'FFF8FAFC';

            row.eachCell((cell, colIndex) => {
                cell.font = { name: 'Arial', size: 10, color: { argb: 'FF1E293B' } };
                cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: zebraBg } };
                cell.border = {
                    bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
                    left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
                    right: { style: 'thin', color: { argb: 'FFE2E8F0' } }
                };

                // محاذاة وتنسيق الخلايا
                if (colIndex === 1) {
                    // كود المنفذ
                    cell.alignment = { horizontal: 'center', vertical: 'middle' };
                } else if (colIndex === 2) {
                    // اسم المنفذ
                    cell.alignment = { horizontal: 'right', vertical: 'middle' };
                } else if (colIndex === 3 && isTimeAggregated) {
                    // فترة التاريخ
                    cell.alignment = { horizontal: 'center', vertical: 'middle' };
                } else if ((colIndex === 3 && !isTimeAggregated) || (colIndex === 4 && isTimeAggregated)) {
                    // عدد الطلبات Cover
                    cell.alignment = { horizontal: 'right', vertical: 'middle' };
                    cell.numFmt = '#,##0';
                } else {
                    // القيم المالية المحاسبية
                    cell.alignment = { horizontal: 'right', vertical: 'middle' };
                    cell.numFmt = '#,##0.00';
                }
            });
        });

        const endRowIndex = startRowIndex + report.records.length - 1;

        // 4. سطر الإجماليات مع المعادلات المحاسبية المعتمدة (Dynamic Accounting Formulas)
        if (report.records.length > 0) {
            const summaryRowValues = isTimeAggregated
                ? [
                    'الإجمالي العام المحقق',
                    '',
                    '',
                    { formula: `SUM(D${startRowIndex}:D${endRowIndex})` },
                    { formula: `SUM(E${startRowIndex}:E${endRowIndex})` },
                    { formula: `SUM(F${startRowIndex}:F${endRowIndex})` },
                    { formula: `SUM(G${startRowIndex}:G${endRowIndex})` },
                    { formula: `SUM(H${startRowIndex}:H${endRowIndex})` },
                    { formula: `SUM(I${startRowIndex}:I${endRowIndex})` },
                    { formula: `SUM(J${startRowIndex}:J${endRowIndex})` }
                ]
                : [
                    'الإجمالي العام المحقق',
                    '',
                    { formula: `SUM(C${startRowIndex}:C${endRowIndex})` },
                    { formula: `SUM(D${startRowIndex}:D${endRowIndex})` },
                    { formula: `SUM(E${startRowIndex}:E${endRowIndex})` },
                    { formula: `SUM(F${startRowIndex}:F${endRowIndex})` },
                    { formula: `SUM(G${startRowIndex}:G${endRowIndex})` },
                    { formula: `IF(C${endRowIndex + 1}>0, G${endRowIndex + 1}/C${endRowIndex + 1}, 0)` },
                    { formula: `SUM(I${startRowIndex}:I${endRowIndex})` },
                    { formula: `SUM(J${startRowIndex}:J${endRowIndex})` }
                ];

            const summaryRow = worksheet.addRow(summaryRowValues);
            summaryRow.height = 28;

            const summaryRowNumber = endRowIndex + 1;
            if (isTimeAggregated) {
                worksheet.mergeCells(`A${summaryRowNumber}:C${summaryRowNumber}`);
            } else {
                worksheet.mergeCells(`A${summaryRowNumber}:B${summaryRowNumber}`);
            }

            summaryRow.eachCell((cell, colIndex) => {
                cell.font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FF0F172A' } };
                cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE2E8F0' } };
                cell.border = {
                    top: { style: 'medium', color: { argb: 'FF0F766E' } },
                    bottom: { style: 'double', color: { argb: 'FF0F172A' } },
                    left: { style: 'thin', color: { argb: 'FFCBD5E1' } },
                    right: { style: 'thin', color: { argb: 'FFCBD5E1' } }
                };

                const numericBoundary = isTimeAggregated ? 3 : 2;
                if (colIndex > numericBoundary) {
                    const isCover = colIndex === (isTimeAggregated ? 4 : 3);
                    cell.numFmt = isCover ? '#,##0' : '#,##0.00';
                    cell.alignment = { horizontal: 'right', vertical: 'middle' };
                } else {
                    cell.alignment = { horizontal: 'center', vertical: 'middle' };
                }
            });
        }

        // 5. ضبط عروض الأعمدة بدقة
        worksheet.columns = [
            { width: 14 }, // كود
            { width: 34 }, // اسم المنفذ
            { width: isTimeAggregated ? 16 : 18 }, // فترة أو Cover
            { width: 20 }, // Cover أو Cash
            { width: 20 }, // Cash أو Visa
            { width: 20 }, // Visa أو C/L
            { width: 24 }, // Total أو C/L
            { width: 22 }, // AvgTicket أو Total
            { width: 20 }, // Voids
            { width: 20 }  // Variance
        ];

        // 6. إرسال تدفق الملف إلى المتصفح مباشرة
        const safeStartDate = report.filters.startDate.replace(/[^0-9-]/g, '');
        const safeEndDate = report.filters.endDate.replace(/[^0-9-]/g, '');
        const filename = `DreamPark_Caravan_Revenues_${safeStartDate}_to_${safeEndDate}.xlsx`;

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`);

        await workbook.xlsx.write(res);
        res.end();
    } catch (err) {
        console.error('[Excel Export Controller Error]:', err);
        res.status(500).json({ status: 'error', message: `فشل استخراج ملف إكسيل: ${err.message}` });
    }
}

