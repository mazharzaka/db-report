import {
  type MatrixRowData,
  type MatrixColumn,
  type CalcMode,
  type RideStatusFilter,
  type RestaurantBranchRow,
  type OthColumnDef,
  formatDateAr,
  OTH_SECTOR_COLUMNS,
  CARAVAN_DISPLAY_NAMES,
  VGAMES_DISPLAY_NAMES,
  PAID_RIDES_DISPLAY_NAMES,
  SHOP_BRANCH_CODES_SET,
} from './matrixConstants';

export interface ExportMatrixToExcelParams {
  matrixRows: MatrixRowData[];
  columns: MatrixColumn[];
  sectorType?: number;
  sectorLabel?: string;
  facilityType?: 'all' | 'caravans' | 'shops';
  effectiveRideStatusFilter: RideStatusFilter;
  calcMode: CalcMode;
  startDate?: string;
  endDate?: string;
  effectiveGranularity: 'summary' | 'month' | 'day';
  theme: any;
  gateTotals: any;
  columnTotals: Record<string, number>;
  grandCash: number;
  grandVisa: number;
  grandCoupons: number;
  grandTotal: number;
  grandFood?: number;
  grandBeverage?: number;
  grandOther?: number;
  isRestaurants: boolean;
  restaurantColumns?: RestaurantBranchRow[];
  restaurantData?: {
    summaryBranches: RestaurantBranchRow[];
    monthGroups: {
      monthKey: string;
      monthLabel: string;
      food?: number;
      beverage?: number;
      other?: number;
      total?: number;
      cash?: number;
      visa?: number;
      cl?: number;
      branches: RestaurantBranchRow[];
    }[];
    dayGroups: {
      date: string;
      food?: number;
      beverage?: number;
      other?: number;
      total?: number;
      cash?: number;
      visa?: number;
      cl?: number;
      branches: RestaurantBranchRow[];
    }[];
  } | null;
  othHeaderGroups: {
    parentHeader: string | null;
    colSpan: number;
    subColumns: OthColumnDef[];
  }[];
  isTwoRowHeader: boolean;
}

export async function exportMatrixToExcel({
  matrixRows,
  columns,
  sectorType = 4,
  sectorLabel,
  facilityType = 'all',
  effectiveRideStatusFilter,
  calcMode,
  startDate,
  endDate,
  effectiveGranularity,
  theme,
  gateTotals,
  columnTotals,
  grandCash,
  grandVisa,
  grandCoupons,
  grandTotal,
  grandFood = 0,
  grandBeverage = 0,
  grandOther = 0,
  isRestaurants,
  restaurantColumns,
  restaurantData,
  othHeaderGroups,
  isTwoRowHeader,
}: ExportMatrixToExcelParams): Promise<void> {
  const ExcelJS = (await import('exceljs')).default;

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Dream Park ERP';
  workbook.created = new Date();

  const excelTheme =
    sectorType === 5
      ? {
          tabColor: 'FF064E3B',
          titleColor: 'FF064E3B',
          headerFill: 'FFD1FAE5',
          footerFill: 'FF064E3B',
          footerFont: 'FFFFFFFF',
        }
      : sectorType === 6
        ? {
            tabColor: 'FF1E293B',
            titleColor: 'FF0F172A',
            headerFill: 'FFE2E8F0',
            footerFill: 'FF1E293B',
            footerFont: 'FFFFFFFF',
          }
        : (theme?.excel ?? {
            tabColor: 'FF2563EB',
            titleColor: 'FF1E3A8A',
            headerFill: 'FFE2E8F0',
            footerFill: 'FFDBEAFE',
            footerFont: 'FF1E3A8A',
          });

  const tabColor = excelTheme?.tabColor || 'FF2563EB';
  const titleColor = excelTheme?.titleColor || 'FF1E3A8A';
  const headerFill = excelTheme?.headerFill || 'FFE2E8F0';
  const footerFill = excelTheme?.footerFill || 'FFDBEAFE';
  const footerFont = excelTheme?.footerFont || 'FF1E3A8A';

  // Build Arabic Entity Name
  const secType = sectorType ?? 4;
  let entityName = '';
  if (secType === 4) {
    if (facilityType === 'caravans') {
      entityName = 'الكرفانات';
    } else if (facilityType === 'shops') {
      entityName = 'المحلات';
    } else {
      entityName = 'الكرفانات والمحلات';
    }
  } else if (secType === 5) {
    entityName = 'بوابات التذاكر';
  } else if (secType === 2) {
    const filterWord =
      effectiveRideStatusFilter === 'active'
        ? 'الألعاب النشطة'
        : effectiveRideStatusFilter === 'inactive'
          ? 'الألعاب غير النشطة'
          : 'جميع الألعاب';
    entityName = `${sectorLabel || 'الألعاب الكبرى'} - ${filterWord}`;
  } else if (secType === 6) {
    const filterWord =
      effectiveRideStatusFilter === 'active' ? 'المنافذ النشطة' : 'جميع المنافذ';
    entityName = `${sectorLabel || 'الأمانات والانتظار'} - ${filterWord}`;
  } else {
    entityName = sectorLabel || 'القطاع';
  }

  // Build CalcMode Arabic Label
  let calcModeLabel = '';
  let modeWord = '';
  if (calcMode === 'net') {
    calcModeLabel = 'صافي المبيعات (قبل الضريبة)';
    modeWord = 'صافي';
  } else if (calcMode === 'vat') {
    calcModeLabel = 'ضريبة القيمة المضافة (14%)';
    modeWord = 'ضرائب';
  } else {
    calcModeLabel = 'إجمالي المبيعات (شامل الضريبة)';
    modeWord = 'إجمالي';
  }

  // Build Date / Period Label
  const rawStart = startDate || (matrixRows.length > 0 ? matrixRows[0].date : '');
  const rawEnd = endDate || (matrixRows.length > 0 ? matrixRows[matrixRows.length - 1].date : '');
  const startFmt = formatDateAr(rawStart);
  const endFmt = formatDateAr(rawEnd);

  let datePeriodLabel = '';
  let dateFilePart = '';
  if (startFmt && endFmt) {
    if (rawStart === rawEnd || startFmt === endFmt) {
      datePeriodLabel = `يوم ${startFmt}`;
      dateFilePart = startFmt.replace(/\//g, '-');
    } else {
      datePeriodLabel = `من ${startFmt} إلى ${endFmt}`;
      dateFilePart = `من_${startFmt.replace(/\//g, '-')}_إلى_${endFmt.replace(/\//g, '-')}`;
    }
  } else if (startFmt) {
    datePeriodLabel = `يوم ${startFmt}`;
    dateFilePart = startFmt.replace(/\//g, '-');
  } else {
    dateFilePart = new Date().toISOString().split('T')[0];
  }

  const excelTitle = datePeriodLabel
    ? `${calcModeLabel} - ${entityName} - ${datePeriodLabel}`
    : `${calcModeLabel} - ${entityName}`;

  const rawSheetName = `${modeWord} ${entityName}`.replace(/[\\/?*:[\]]/g, '').trim();
  const sheetName = rawSheetName.slice(0, 31) || 'المبيعات';

  // 1. Flip Excel Export Direction to Left-to-Right (LTR) with frozen header panes
  const worksheet = workbook.addWorksheet(sheetName, {
    views: [{ rightToLeft: false, state: 'frozen', ySplit: isTwoRowHeader ? 4 : 3 }],
  });
  worksheet.properties.tabColor = { argb: tabColor };

  const thinBorder = {
    top: { style: 'thin' as const, color: { argb: 'FF000000' } },
    bottom: { style: 'thin' as const, color: { argb: 'FF000000' } },
    left: { style: 'thin' as const, color: { argb: 'FF000000' } },
    right: { style: 'thin' as const, color: { argb: 'FF000000' } },
  };
  const doubleBottomBorder = {
    top: { style: 'thin' as const, color: { argb: 'FF000000' } },
    bottom: { style: 'double' as const, color: { argb: 'FF000000' } },
    left: { style: 'thin' as const, color: { argb: 'FF000000' } },
    right: { style: 'thin' as const, color: { argb: 'FF000000' } },
  };
  const headerFillPattern = {
    type: 'pattern' as const,
    pattern: 'solid' as const,
    fgColor: { argb: headerFill },
  };
  const centerMiddleAlign = {
    vertical: 'middle' as const,
    horizontal: 'center' as const,
    wrapText: true,
  };
  const headerFontNormal = {
    name: 'Times New Roman',
    size: 13,
    bold: true,
    color: { argb: 'FF0F172A' },
  };
  const headerFontSub = {
    name: 'Times New Roman',
    size: 11,
    bold: true,
    color: { argb: 'FF0F172A' },
  };
  const redHeaderFont = {
    name: 'Times New Roman',
    size: 13,
    bold: true,
    color: { argb: 'FFFF0000' },
  };

  function styleRange(
    ws: any,
    startRow: number,
    startCol: number,
    endRow: number,
    endCol: number,
    style: {
      font?: any;
      fill?: any;
      alignment?: any;
      border?: any;
      numFmt?: string;
    }
  ) {
    for (let r = startRow; r <= endRow; r++) {
      const rowObj = ws.getRow(r);
      for (let c = startCol; c <= endCol; c++) {
        const cell = rowObj.getCell(c);
        if (style.font) cell.font = style.font;
        if (style.fill) cell.fill = style.fill;
        if (style.alignment) cell.alignment = style.alignment;
        if (style.border) cell.border = style.border;
        if (style.numFmt) cell.numFmt = style.numFmt;
      }
    }
  }

  // Helper to get Excel column letter (A, B, ..., Z, AA, AB, ...)
  function getExcelColName(colIdx: number): string {
    let temp = colIdx;
    let letter = '';
    while (temp > 0) {
      const mod = (temp - 1) % 26;
      letter = String.fromCharCode(65 + mod) + letter;
      temp = Math.floor((temp - mod) / 26);
    }
    return letter;
  }

  // 2. Setup Export Columns & Worksheet Data
  if (isRestaurants) {
    const isVat = calcMode === 'vat';
    const activeRestColumns = (restaurantColumns && restaurantColumns.length > 0
      ? restaurantColumns
      : (restaurantData?.summaryBranches || []).filter(
          (b) => b.branchCode !== '14' && !b.displayName.includes('كانتين') && !b.displayName.toLowerCase().includes('canteen')
        )
    ).filter((b) => effectiveRideStatusFilter !== 'active' || Math.abs(b.total) > 0.0001);

    const restCols: { key: string; width: number }[] = [
      { key: 'period', width: 16 },
    ];
    activeRestColumns.forEach((b) => {
      restCols.push({ key: `food_${b.branchCode}`, width: 14 });
      restCols.push({ key: `bev_${b.branchCode}`, width: 14 });
      restCols.push({ key: `oth_${b.branchCode}`, width: 14 });
      restCols.push({ key: `tot_${b.branchCode}`, width: 16 });
    });
    restCols.push({ key: 'grandTotal', width: 18 });
    if (!isVat) {
      restCols.push({ key: 'cash', width: 16 });
      restCols.push({ key: 'visa', width: 16 });
      restCols.push({ key: 'cl', width: 16 });
    }

    worksheet.columns = restCols;
    const totalRestColsCount = restCols.length;

    const row1 = worksheet.addRow([]);
    row1.height = 28;
    const row2 = worksheet.addRow([]);
    row2.height = 24;

    try {
      const logoRes = await fetch('/dreampark-logo.png');
      if (logoRes.ok) {
        const logoBuffer = await logoRes.arrayBuffer();
        const imageId = workbook.addImage({
          buffer: logoBuffer,
          extension: 'png',
        });
        worksheet.addImage(imageId, {
          tl: { col: 0, row: 0 },
          ext: { width: 110, height: 48 },
        });
      }
    } catch (logoErr) {
      console.warn('Could not load logo for Excel export:', logoErr);
    }

    worksheet.mergeCells(1, 2, 2, totalRestColsCount);
    const titleCell = worksheet.getCell(1, 2);
    titleCell.value = excelTitle;
    titleCell.font = { name: 'Times New Roman', size: 15, bold: true, color: { argb: 'FF4C0519' } };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };

    const row3 = worksheet.getRow(3);
    row3.height = 28;
    const row4 = worksheet.getRow(4);
    row4.height = 26;

    // Col 1 (Date / Period) merged 3 to 4
    worksheet.mergeCells(3, 1, 4, 1);
    const col1Label =
      effectiveGranularity === 'summary' ? 'Period' : effectiveGranularity === 'month' ? 'Month' : 'Date';
    worksheet.getCell(3, 1).value = col1Label;
    styleRange(worksheet, 3, 1, 4, 1, {
      font: { name: 'Times New Roman', size: 12, bold: true, color: { argb: 'FFFFFFFF' } },
      fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF881337' } },
      alignment: centerMiddleAlign,
      border: thinBorder,
    });

    // Row 3 Restaurant Headers
    activeRestColumns.forEach((b, rIdx) => {
      const startCol = 2 + rIdx * 4;
      const endCol = startCol + 3;
      worksheet.mergeCells(3, startCol, 3, endCol);
      const cell = worksheet.getCell(3, startCol);
      cell.value = b.displayName || b.name;
      const headerColor = rIdx % 2 === 0 ? 'FFE11D48' : 'FF9F1239'; // Alternating light rose vs deeper rose
      styleRange(worksheet, 3, startCol, 3, endCol, {
        font: { name: 'Times New Roman', size: 12, bold: true, color: { argb: 'FFFFFFFF' } },
        fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: headerColor } },
        alignment: centerMiddleAlign,
        border: thinBorder,
      });

      // Row 4 Sub-headers
      const subs = ['Food', 'Bev', 'Other', 'Total'];
      const subBgColor = rIdx % 2 === 0 ? 'FFFFF1F2' : 'FFFFE4E6';
      subs.forEach((sub, sIdx) => {
        const cIdx = startCol + sIdx;
        worksheet.getCell(4, cIdx).value = sub;
        const isTotCol = sIdx === 3;
        styleRange(worksheet, 4, cIdx, 4, cIdx, {
          font: { name: 'Times New Roman', size: 11, bold: true, color: { argb: isTotCol ? 'FF881337' : 'FF0F172A' } },
          fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: isTotCol ? 'FFFECDD3' : subBgColor } },
          alignment: centerMiddleAlign,
          border: isTotCol
            ? {
                top: { style: 'thin', color: { argb: 'FF000000' } },
                bottom: { style: 'thin', color: { argb: 'FF000000' } },
                left: { style: 'thin', color: { argb: 'FF000000' } },
                right: { style: 'medium', color: { argb: 'FF881337' } },
              }
            : thinBorder,
        });
      });
    });

    // Grand Total Column
    const gtCol = 2 + activeRestColumns.length * 4;
    worksheet.mergeCells(3, gtCol, 4, gtCol);
    worksheet.getCell(3, gtCol).value = 'Grand Total';
    styleRange(worksheet, 3, gtCol, 4, gtCol, {
      font: { name: 'Times New Roman', size: 12, bold: true, color: { argb: 'FFFFFFFF' } },
      fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4C0519' } },
      alignment: centerMiddleAlign,
      border: {
        top: { style: 'thin', color: { argb: 'FF000000' } },
        bottom: { style: 'thin', color: { argb: 'FF000000' } },
        left: { style: 'thin', color: { argb: 'FF000000' } },
        right: { style: 'medium', color: { argb: 'FF881337' } },
      },
    });

    // Payment Methods
    if (!isVat) {
      const payCol = gtCol + 1;
      worksheet.mergeCells(3, payCol, 3, payCol + 2);
      worksheet.getCell(3, payCol).value = 'Payment Methods';
      styleRange(worksheet, 3, payCol, 3, payCol + 2, {
        font: { name: 'Times New Roman', size: 12, bold: true, color: { argb: 'FFFFFFFF' } },
        fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF70102E' } },
        alignment: centerMiddleAlign,
        border: thinBorder,
      });

      const paySubs = [
        { label: 'Cash', color: 'FFD1FAE5', fontColor: 'FF065F46' },
        { label: 'Visa', color: 'FFDBEAFE', fontColor: 'FF1E40AF' },
        { label: 'C.L', color: 'FFFEF3C7', fontColor: 'FF92400E' },
      ];
      paySubs.forEach((ps, sIdx) => {
        const cIdx = payCol + sIdx;
        worksheet.getCell(4, cIdx).value = ps.label;
        styleRange(worksheet, 4, cIdx, 4, cIdx, {
          font: { name: 'Times New Roman', size: 11, bold: true, color: { argb: ps.fontColor } },
          fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: ps.color } },
          alignment: centerMiddleAlign,
          border: thinBorder,
        });
      });
    }

    // Rows Data
    type RestGroupItem = {
      label: string;
      branches: RestaurantBranchRow[];
      total: number;
      cash: number;
      visa: number;
      cl: number;
    };
    let dataGroups: RestGroupItem[] = [];

    if (effectiveGranularity === 'summary') {
      dataGroups = [
        {
          label: 'Total Period',
          branches: restaurantData?.summaryBranches || [],
          total: grandTotal,
          cash: grandCash,
          visa: grandVisa,
          cl: grandCoupons,
        },
      ];
    } else if (effectiveGranularity === 'month') {
      dataGroups = (restaurantData?.monthGroups || []).map((m) => ({
        label: m.monthLabel,
        branches: m.branches,
        total: m.total ?? m.branches.reduce((s, b) => s + b.total, 0),
        cash: m.cash ?? m.branches.reduce((s, b) => s + b.cash, 0),
        visa: m.visa ?? m.branches.reduce((s, b) => s + b.visa, 0),
        cl: m.cl ?? m.branches.reduce((s, b) => s + b.cl, 0),
      }));
    } else {
      dataGroups = (restaurantData?.dayGroups || []).map((d) => ({
        label: d.date,
        branches: d.branches,
        total: d.total ?? d.branches.reduce((s, b) => s + b.total, 0),
        cash: d.cash ?? d.branches.reduce((s, b) => s + b.cash, 0),
        visa: d.visa ?? d.branches.reduce((s, b) => s + b.visa, 0),
        cl: d.cl ?? d.branches.reduce((s, b) => s + b.cl, 0),
      }));
    }

    const startDataRow = 5;
    dataGroups.forEach((item, rIdx) => {
      const curRow = startDataRow + rIdx;
      const branchMap = new Map<string, RestaurantBranchRow>();
      item.branches.forEach((b) => branchMap.set(String(b.branchCode), b));

      const rowVals: any[] = [item.label];
      const totColLetters: string[] = [];

      activeRestColumns.forEach((rCol, colIdx) => {
        const b = branchMap.get(String(rCol.branchCode));
        const food = b ? b.food : 0;
        const bev = b ? b.beverage : 0;
        const oth = b ? b.other : 0;
        const startC = 2 + colIdx * 4;
        const foodLetter = getExcelColName(startC);
        const othLetter = getExcelColName(startC + 2);
        const totLetter = getExcelColName(startC + 3);
        totColLetters.push(totLetter + curRow);

        rowVals.push(food, bev, oth);
        rowVals.push({
          formula: `SUM(${foodLetter}${curRow}:${othLetter}${curRow})`,
          result: b ? b.total : 0,
        });
      });

      // Grand Total formula summing each restaurant's Total column
      const gtFormula = totColLetters.length > 0 ? totColLetters.join('+') : '0';
      rowVals.push({ formula: gtFormula, result: item.total });

      if (!isVat) {
        rowVals.push(item.cash, item.visa, item.cl);
      }

      const row = worksheet.addRow(rowVals);
      row.height = 24;

      // Styling
      const c1 = row.getCell(1);
      c1.alignment = centerMiddleAlign;
      c1.font = { name: 'Times New Roman', size: 11, bold: true, color: { argb: 'FF0F172A' } };
      c1.border = thinBorder;

      activeRestColumns.forEach((_, colIdx) => {
        const startC = 2 + colIdx * 4;
        const subBg = colIdx % 2 === 0 ? 'FFFFF1F2' : 'FFFFE4E6';

        for (let c = startC; c <= startC + 2; c++) {
          const cell = row.getCell(c);
          cell.numFmt = '#,##0.00';
          cell.alignment = { vertical: 'middle', horizontal: 'right' };
          cell.font = { name: 'Times New Roman', size: 11, color: { argb: 'FF0F172A' } };
          cell.border = thinBorder;
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: subBg } };
        }

        // Total Column
        const totCell = row.getCell(startC + 3);
        totCell.numFmt = '#,##0.00';
        totCell.alignment = { vertical: 'middle', horizontal: 'right' };
        totCell.font = { name: 'Times New Roman', size: 11, bold: true, color: { argb: 'FF881337' } };
        totCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEE2E2' } };
        totCell.border = {
          top: { style: 'thin', color: { argb: 'FF000000' } },
          bottom: { style: 'thin', color: { argb: 'FF000000' } },
          left: { style: 'thin', color: { argb: 'FF000000' } },
          right: { style: 'medium', color: { argb: 'FF881337' } },
        };
      });

      // Grand Total Cell
      const gtCell = row.getCell(gtCol);
      gtCell.numFmt = '#,##0.00';
      gtCell.alignment = { vertical: 'middle', horizontal: 'right' };
      gtCell.font = { name: 'Times New Roman', size: 11, bold: true, color: { argb: 'FF4C0519' } };
      gtCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFE4E6' } };
      gtCell.border = {
        top: { style: 'thin', color: { argb: 'FF000000' } },
        bottom: { style: 'thin', color: { argb: 'FF000000' } },
        left: { style: 'thin', color: { argb: 'FF000000' } },
        right: { style: 'medium', color: { argb: 'FF881337' } },
      };

      if (!isVat) {
        const payCol = gtCol + 1;
        const cashCell = row.getCell(payCol);
        cashCell.numFmt = '#,##0.00';
        cashCell.alignment = { vertical: 'middle', horizontal: 'right' };
        cashCell.font = { name: 'Times New Roman', size: 11, bold: true, color: { argb: 'FF065F46' } };
        cashCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFECFDF5' } };
        cashCell.border = thinBorder;

        const visaCell = row.getCell(payCol + 1);
        visaCell.numFmt = '#,##0.00';
        visaCell.alignment = { vertical: 'middle', horizontal: 'right' };
        visaCell.font = { name: 'Times New Roman', size: 11, bold: true, color: { argb: 'FF1E40AF' } };
        visaCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEFF6FF' } };
        visaCell.border = thinBorder;

        const clCell = row.getCell(payCol + 2);
        clCell.numFmt = '#,##0.00';
        clCell.alignment = { vertical: 'middle', horizontal: 'right' };
        clCell.font = { name: 'Times New Roman', size: 11, bold: true, color: { argb: 'FF92400E' } };
        clCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFBEB' } };
        clCell.border = thinBorder;
      }
    });

    // Bottom Totals Row
    const endDataRow = startDataRow + dataGroups.length - 1;
    const totalsRowVals: any[] = ['TOTAL'];
    for (let c = 2; c <= totalRestColsCount; c++) {
      const colLetter = getExcelColName(c);
      if (endDataRow >= startDataRow) {
        totalsRowVals.push({
          formula: `SUM(${colLetter}${startDataRow}:${colLetter}${endDataRow})`,
        });
      } else {
        totalsRowVals.push(0);
      }
    }

    const totalRow = worksheet.addRow(totalsRowVals);
    totalRow.height = 32;

    const restFooterFill = {
      type: 'pattern' as const,
      pattern: 'solid' as const,
      fgColor: { argb: 'FF4C0519' },
    };
    const restFooterFont = {
      name: 'Times New Roman',
      size: 12,
      bold: true,
      color: { argb: 'FFFFFFFF' },
    };

    for (let c = 1; c <= totalRestColsCount; c++) {
      const cell = totalRow.getCell(c);
      cell.font = restFooterFont;
      cell.fill = restFooterFill;
      cell.border = doubleBottomBorder;
      if (c >= 2) {
        cell.numFmt = '#,##0.00';
        cell.alignment = { vertical: 'middle', horizontal: 'right' };
      } else {
        cell.alignment = centerMiddleAlign;
      }
    }

    const blankRow = worksheet.addRow([]);
    blankRow.height = 18;
    const signatureRow = worksheet.addRow(['INCOME AUDITOR']);
    signatureRow.height = 24;
    const sigCell = signatureRow.getCell(1);
    sigCell.font = { name: 'Times New Roman', size: 11, bold: true, color: { argb: 'FF0F172A' } };
    sigCell.alignment = { vertical: 'middle', horizontal: 'center' };
  } else if (sectorType === 5) {
    const gateCols = [
      { key: 'date', width: 14 },
      { key: 'silverRev', width: 14 },
      { key: 'silverSold', width: 10 },
      { key: 'goldenRev', width: 14 },
      { key: 'goldenSold', width: 10 },
      { key: 'comboRev', width: 14 },
      { key: 'comboSold', width: 10 },
      { key: 'familyRev', width: 14 },
      { key: 'familySold', width: 10 },
      { key: 'smRev', width: 14 },
      { key: 'smSold', width: 10 },
      { key: 'smFree', width: 10 },
      { key: 'promoRev', width: 14 },
      { key: 'promoSold', width: 10 },
      { key: 'bgRev', width: 14 },
      { key: 'bgVouchers', width: 10 },
      { key: 'totalRev', width: 16 },
      { key: 'totalSold', width: 12 },
      { key: 'totalFree', width: 12 },
      { key: 'grr', width: 16 },
      { key: 'cash', width: 14 },
      { key: 'visa', width: 14 },
      { key: 'cl', width: 14 },
      { key: 'entGross', width: 14 },
      { key: 'thrGross', width: 14 },
      { key: 'tafGross', width: 14 },
      { key: 'totVat', width: 14 },
      { key: 'netRev', width: 16 },
      { key: 'stdEnt', width: 14 },
      { key: 'stdThr', width: 14 },
      { key: 'stdTaf', width: 14 },
    ];
    worksheet.columns = gateCols;
    const totalGateColsCount = gateCols.length;

    const row1 = worksheet.addRow([]);
    row1.height = 28;
    const row2 = worksheet.addRow([]);
    row2.height = 24;

    try {
      const logoRes = await fetch('/dreampark-logo.png');
      if (logoRes.ok) {
        const logoBuffer = await logoRes.arrayBuffer();
        const imageId = workbook.addImage({
          buffer: logoBuffer,
          extension: 'png',
        });
        worksheet.addImage(imageId, {
          tl: { col: 0, row: 0 },
          ext: { width: 110, height: 48 },
        });
      }
    } catch (logoErr) {
      console.warn('Could not load logo for Excel export:', logoErr);
    }

    worksheet.mergeCells(1, 3, 2, 20);
    const titleCell = worksheet.getCell(1, 3);
    titleCell.value = excelTitle;
    titleCell.font = { name: 'Times New Roman', size: 15, bold: true, color: { argb: 'FF064E3B' } };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };

    const row3 = worksheet.getRow(3);
    row3.height = 28;
    const row4 = worksheet.getRow(4);
    row4.height = 26;

    worksheet.mergeCells(3, 1, 4, 1);
    worksheet.getCell(3, 1).value = 'Date';
    styleRange(worksheet, 3, 1, 4, 1, { font: headerFontNormal, fill: headerFillPattern, alignment: centerMiddleAlign, border: thinBorder });

    const catDefs = [
      { name: 'Silver', span: 2, sub: ['قيمة', 'تذاكر'] },
      { name: 'Golden', span: 2, sub: ['قيمة', 'تذاكر'] },
      { name: 'Silver Combo', span: 2, sub: ['قيمة', 'تذاكر'] },
      { name: 'Family', span: 2, sub: ['قيمة', 'تذاكر'] },
      { name: 'S&M', span: 3, sub: ['قيمة', 'تذاكر', 'مجاني'] },
      { name: 'Promotion', span: 2, sub: ['قيمة', 'تذاكر'] },
      { name: 'B.G', span: 2, sub: ['قيمة', 'دفاتر'] },
    ];
    let currCol = 2;
    catDefs.forEach((cd) => {
      worksheet.mergeCells(3, currCol, 3, currCol + cd.span - 1);
      worksheet.getCell(3, currCol).value = cd.name;
      styleRange(worksheet, 3, currCol, 3, currCol + cd.span - 1, { font: headerFontNormal, fill: headerFillPattern, alignment: centerMiddleAlign, border: thinBorder });
      cd.sub.forEach((sName, sIdx) => {
        const colPos = currCol + sIdx;
        worksheet.getCell(4, colPos).value = sName;
        styleRange(worksheet, 4, colPos, 4, colPos, { font: headerFontSub, fill: headerFillPattern, alignment: centerMiddleAlign, border: thinBorder });
      });
      currCol += cd.span;
    });

    const singles = ['TOTAL REV', 'TOTAL SOLD', 'TOTAL FREE', 'G.R.R'];
    singles.forEach((s) => {
      worksheet.mergeCells(3, currCol, 4, currCol);
      worksheet.getCell(3, currCol).value = s;
      styleRange(worksheet, 3, currCol, 4, currCol, { font: headerFontNormal, fill: headerFillPattern, alignment: centerMiddleAlign, border: thinBorder });
      currCol++;
    });

    worksheet.mergeCells(3, currCol, 3, currCol + 2);
    worksheet.getCell(3, currCol).value = 'طرق السداد (Payments)';
    styleRange(worksheet, 3, currCol, 3, currCol + 2, { font: headerFontNormal, fill: headerFillPattern, alignment: centerMiddleAlign, border: thinBorder });
    ['Cash', 'Visa', 'C/L'].forEach((p, idx) => {
      worksheet.getCell(4, currCol + idx).value = p;
      styleRange(worksheet, 4, currCol + idx, 4, currCol + idx, { font: headerFontSub, fill: headerFillPattern, alignment: centerMiddleAlign, border: thinBorder });
    });
    currCol += 3;

    worksheet.mergeCells(3, currCol, 3, currCol + 4);
    worksheet.getCell(3, currCol).value = 'الضريبة الفعلية (Actual VAT)';
    styleRange(worksheet, 3, currCol, 3, currCol + 4, { font: headerFontNormal, fill: headerFillPattern, alignment: centerMiddleAlign, border: thinBorder });
    ['دخول (14%)', 'ملاهي (5%)', 'طفطف (0%)', 'إجمالي الضريبة', 'صافي الإيراد'].forEach((v, idx) => {
      worksheet.getCell(4, currCol + idx).value = v;
      styleRange(worksheet, 4, currCol + idx, 4, currCol + idx, { font: headerFontSub, fill: headerFillPattern, alignment: centerMiddleAlign, border: thinBorder });
    });
    currCol += 5;

    worksheet.mergeCells(3, currCol, 3, currCol + 2);
    worksheet.getCell(3, currCol).value = 'المعيار المحاسبي (Standard Split)';
    styleRange(worksheet, 3, currCol, 3, currCol + 2, { font: headerFontNormal, fill: headerFillPattern, alignment: centerMiddleAlign, border: thinBorder });
    ['دخول 53.33%', 'ملاهي 26.67%', 'طفطف 20.00%'].forEach((st, idx) => {
      worksheet.getCell(4, currCol + idx).value = st;
      styleRange(worksheet, 4, currCol + idx, 4, currCol + idx, { font: headerFontSub, fill: headerFillPattern, alignment: centerMiddleAlign, border: thinBorder });
    });

    matrixRows.forEach((r: any) => {
      const rowData = [
        r.date,
        r.silverRev || 0, r.silverSold || 0,
        r.goldenRev || 0, r.goldenSold || 0,
        r.silverComboRev || 0, r.silverComboSold || 0,
        r.familyRev || 0, r.familySold || 0,
        r.smRev || 0, r.smSold || 0, r.smFree || 0,
        r.promoRev || 0, r.promoSold || 0,
        r.bgRev || 0, r.bgVouchers || (r.bgRev > 0 ? 1 : 0),
        r.totalTicketRev || 0,
        r.totalTicketSold || 0,
        r.totalFree || 0,
        r.grr || 0,
        r.cash || 0, r.visa || 0, r.cl || 0,
        r.entranceGross || 0, r.theaterGross || 0, r.taftafGross || 0, r.totalVat || 0, r.netRevenue || 0,
        r.stdEntranceGross || 0, r.stdTheaterGross || 0, r.stdTaftafGross || 0
      ];
      const row = worksheet.addRow(rowData);
      row.height = 24;

      const dateCell = row.getCell(1);
      dateCell.alignment = { vertical: 'middle', horizontal: 'center' };
      dateCell.font = { name: 'Times New Roman', size: 11, bold: true, color: { argb: 'FF0F172A' } };
      dateCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };
      dateCell.border = thinBorder;

      const qtyColsSet = new Set([3, 5, 7, 9, 11, 12, 14, 16, 18, 19]);
      for (let c = 2; c <= totalGateColsCount; c++) {
        const cell = row.getCell(c);
        cell.border = thinBorder;
        cell.alignment = { vertical: 'middle', horizontal: 'right' };
        if (qtyColsSet.has(c)) {
          cell.numFmt = '#,##0';
          cell.font = { name: 'Times New Roman', size: 11, color: { argb: 'FF0F172A' } };
        } else {
          cell.numFmt = '#,##0.00';
          cell.font = { name: 'Times New Roman', size: 11, bold: c === 17 || c === 20, color: { argb: 'FF0F172A' } };
        }
        if (c === 17) {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD1FAE5' } };
        }
      }
    });

    const footerVals = [
      'TOTAL',
      gateTotals?.silverRev || 0, gateTotals?.silverSold || 0,
      gateTotals?.goldenRev || 0, gateTotals?.goldenSold || 0,
      gateTotals?.silverComboRev || 0, gateTotals?.silverComboSold || 0,
      gateTotals?.familyRev || 0, gateTotals?.familySold || 0,
      gateTotals?.smRev || 0, gateTotals?.smSold || 0, gateTotals?.smFree || 0,
      gateTotals?.promoRev || 0, gateTotals?.promoSold || 0,
      gateTotals?.bgRev || 0, gateTotals?.bgVouchers || 0,
      gateTotals?.totalTicketRev || 0,
      gateTotals?.totalTicketSold || 0,
      gateTotals?.totalFree || 0,
      gateTotals?.grr || 0,
      gateTotals?.cash || 0, gateTotals?.visa || 0, gateTotals?.cl || 0,
      gateTotals?.entranceGross || 0, gateTotals?.theaterGross || 0, gateTotals?.taftafGross || 0, gateTotals?.totalVat || 0, gateTotals?.netRevenue || 0,
      gateTotals?.stdEntranceGross || 0, gateTotals?.stdTheaterGross || 0, gateTotals?.stdTaftafGross || 0
    ];
    const totalRow = worksheet.addRow(footerVals);
    totalRow.height = 32;

    const footerDateCell = totalRow.getCell(1);
    footerDateCell.alignment = { vertical: 'middle', horizontal: 'center' };
    footerDateCell.font = { name: 'Times New Roman', size: 13, bold: true, color: { argb: 'FFFFFFFF' } };
    footerDateCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF064E3B' } };
    footerDateCell.border = doubleBottomBorder;

    const qtyColsSet = new Set([3, 5, 7, 9, 11, 12, 14, 16, 18, 19]);
    for (let c = 2; c <= totalGateColsCount; c++) {
      const cell = totalRow.getCell(c);
      cell.alignment = { vertical: 'middle', horizontal: 'right' };
      cell.font = { name: 'Times New Roman', size: 12, bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF064E3B' } };
      cell.border = doubleBottomBorder;
      cell.numFmt = qtyColsSet.has(c) ? '#,##0' : '#,##0.00';
    }

    const blankRow = worksheet.addRow([]);
    blankRow.height = 18;
    const signatureRow = worksheet.addRow(['INCOME AUDITOR']);
    signatureRow.height = 24;
    const sigCell = signatureRow.getCell(1);
    sigCell.font = { name: 'Times New Roman', size: 11, bold: true, color: { argb: 'FF0F172A' } };
    sigCell.alignment = { vertical: 'middle', horizontal: 'center' };
  } else if (sectorType === 6) {
    const othExportCols = [
      { key: 'date', width: 16 },
      ...columns.map((c) => ({
        key: c.branchCode,
        width: OTH_SECTOR_COLUMNS.find((col) => col.id === c.branchCode)?.width || 14,
      })),
      { key: 'cash', width: 16 },
      { key: 'cl', width: 16 },
      { key: 'g_deposit', width: 16 },
      { key: 'visa', width: 16 },
      { key: 'total', width: 18 },
    ];
    worksheet.columns = othExportCols;
    const totalOthColsCount = othExportCols.length;

    const row1 = worksheet.addRow([]);
    row1.height = 28;
    const row2 = worksheet.addRow([]);
    row2.height = 24;

    try {
      const logoRes = await fetch('/dreampark-logo.png');
      if (logoRes.ok) {
        const logoBuffer = await logoRes.arrayBuffer();
        const imageId = workbook.addImage({
          buffer: logoBuffer,
          extension: 'png',
        });
        worksheet.addImage(imageId, {
          tl: { col: 0, row: 0 },
          ext: { width: 110, height: 48 },
        });
      }
    } catch (logoErr) {
      console.warn('Could not load logo for Excel export:', logoErr);
    }

    if (totalOthColsCount >= 3) {
      const titleEndCol = Math.min(totalOthColsCount, 12);
      worksheet.mergeCells(1, 3, 2, titleEndCol);
      const titleCell = worksheet.getCell(1, 3);
      titleCell.value = excelTitle;
      titleCell.font = { name: 'Times New Roman', size: 15, bold: true, color: { argb: titleColor } };
      titleCell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    }

    const row3 = worksheet.getRow(3);
    row3.height = 28;
    const row4 = worksheet.getRow(4);
    row4.height = 26;

    worksheet.mergeCells(3, 1, 4, 1);
    worksheet.getCell(3, 1).value = 'Date';
    styleRange(worksheet, 3, 1, 4, 1, {
      font: headerFontNormal,
      fill: headerFillPattern,
      alignment: centerMiddleAlign,
      border: thinBorder,
    });

    let currentXCol = 2;
    othHeaderGroups.forEach((grp) => {
      if (grp.parentHeader) {
        const startCol = currentXCol;
        const endCol = currentXCol + grp.colSpan - 1;
        worksheet.mergeCells(3, startCol, 3, endCol);
        worksheet.getCell(3, startCol).value = grp.parentHeader;
        styleRange(worksheet, 3, startCol, 3, endCol, {
          font: headerFontNormal,
          fill: headerFillPattern,
          alignment: centerMiddleAlign,
          border: thinBorder,
        });

        grp.subColumns.forEach((subCol, sIdx) => {
          const tCol = startCol + sIdx;
          worksheet.getCell(4, tCol).value = subCol.header;
          styleRange(worksheet, 4, tCol, 4, tCol, {
            font: headerFontSub,
            fill: headerFillPattern,
            alignment: centerMiddleAlign,
            border: thinBorder,
          });
        });
        currentXCol += grp.colSpan;
      } else {
        worksheet.mergeCells(3, currentXCol, 4, currentXCol);
        worksheet.getCell(3, currentXCol).value = grp.subColumns[0].header;
        styleRange(worksheet, 3, currentXCol, 4, currentXCol, {
          font: headerFontNormal,
          fill: headerFillPattern,
          alignment: centerMiddleAlign,
          border: thinBorder,
        });
        currentXCol++;
      }
    });

    const summaryHeaders = ['Cash', 'C.L', 'G.Deposit', 'Visa', 'TOTAL'];
    summaryHeaders.forEach((sh, idx) => {
      const sCol = currentXCol + idx;
      worksheet.mergeCells(3, sCol, 4, sCol);
      worksheet.getCell(3, sCol).value = sh;
      styleRange(worksheet, 3, sCol, 4, sCol, {
        font: headerFontNormal,
        fill: headerFillPattern,
        alignment: centerMiddleAlign,
        border: thinBorder,
      });
    });

    matrixRows.forEach((item) => {
      const rowData: (string | number)[] = [
        item.date,
        ...columns.map((c) => item.values[c.branchCode] || 0),
        item.rowCash,
        item.rowCoupons,
        item.values['g_deposit'] || 0,
        item.rowVisa,
        item.rowTotal,
      ];
      const row = worksheet.addRow(rowData);
      row.height = 26.1;

      const dateCell = row.getCell(1);
      dateCell.alignment = { vertical: 'middle', horizontal: 'center' };
      dateCell.font = { name: 'Times New Roman', size: 12, bold: true, color: { argb: 'FF0F172A' } };
      dateCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };
      dateCell.border = thinBorder;

      for (let c = 2; c <= totalOthColsCount; c++) {
        const cell = row.getCell(c);
        cell.numFmt = '#,##0.00';
        cell.alignment = { vertical: 'middle', horizontal: 'right' };
        cell.font = { name: 'Times New Roman', size: 12, bold: c === totalOthColsCount, color: { argb: 'FF0F172A' } };
        cell.border = thinBorder;
        if (c === totalOthColsCount) {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };
        }
      }
    });

    const footerRowVals: (string | number)[] = [
      'TOTAL',
      ...columns.map((c) => columnTotals[c.branchCode] || 0),
      grandCash,
      grandCoupons,
      columnTotals['g_deposit'] || 0,
      grandVisa,
      grandTotal,
    ];
    const totalRow = worksheet.addRow(footerRowVals);
    totalRow.height = 33.95;

    const footerDateCell = totalRow.getCell(1);
    footerDateCell.alignment = { vertical: 'middle', horizontal: 'center' };
    footerDateCell.font = { name: 'Times New Roman', size: 14, bold: true, color: { argb: footerFont } };
    footerDateCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: footerFill } };
    footerDateCell.border = doubleBottomBorder;

    for (let c = 2; c <= totalOthColsCount; c++) {
      const cell = totalRow.getCell(c);
      cell.numFmt = '#,##0.00';
      cell.alignment = { vertical: 'middle', horizontal: 'right' };
      cell.font = { name: 'Times New Roman', size: 14, bold: true, color: { argb: footerFont } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: footerFill } };
      cell.border = doubleBottomBorder;
    }

    const blankRow = worksheet.addRow([]);
    blankRow.height = 18;
    const signatureRow = worksheet.addRow(['INCOME AUDITOR']);
    signatureRow.height = 24;
    const sigCell = signatureRow.getCell(1);
    sigCell.font = { name: 'Times New Roman', size: 11, bold: true, color: { argb: 'FF0F172A' } };
    sigCell.alignment = { vertical: 'middle', horizontal: 'center' };
  } else {
    interface ExportColDef {
      key: string;
      header: string;
      parentHeader?: string;
      width: number;
      isShop?: boolean;
      getValue: (row: MatrixRowData) => number;
      getTotal: () => number;
    }

    const exportColumns: ExportColDef[] = [];

    columns.forEach((col) => {
      const headerName =
        sectorType === 3
          ? (VGAMES_DISPLAY_NAMES[col.branchCode] || col.name)
          : sectorType === 2
            ? (PAID_RIDES_DISPLAY_NAMES[col.branchCode] || col.name)
            : (CARAVAN_DISPLAY_NAMES[col.branchCode] || col.name);

      exportColumns.push({
        key: `col_${col.branchCode}`,
        header: headerName,
        width: 18,
        isShop: sectorType === 4 && SHOP_BRANCH_CODES_SET.has(col.branchCode),
        getValue: (r) => r.values[col.branchCode] || 0,
        getTotal: () => columnTotals[col.branchCode] || 0,
      });
    });

    exportColumns.push({
      key: 'row_total',
      header: 'TOTAL REV',
      width: 20,
      getValue: (r) => r.rowTotal,
      getTotal: () => grandTotal,
    });

    if (calcMode !== 'vat') {
      exportColumns.push(
        {
          key: 'cash',
          header: 'CASH',
          width: 16,
          getValue: (r) => r.rowCash,
          getTotal: () => grandCash,
        },
        {
          key: 'visa',
          header: 'VISA',
          width: 16,
          getValue: (r) => r.rowVisa,
          getTotal: () => grandVisa,
        },
        {
          key: 'coupons',
          header: 'COPON / C.L',
          width: 18,
          getValue: (r) => r.rowCoupons,
          getTotal: () => grandCoupons,
        }
      );
    }

    worksheet.columns = [
      { key: 'date', width: 16 },
      ...exportColumns.map((c) => ({ key: c.key, width: c.width })),
    ];
    const totalColumnsCount = 1 + exportColumns.length;

    const row1 = worksheet.addRow([]);
    row1.height = 28;
    const row2 = worksheet.addRow([]);
    row2.height = 24;

    try {
      const logoRes = await fetch('/dreampark-logo.png');
      if (logoRes.ok) {
        const logoBuffer = await logoRes.arrayBuffer();
        const imageId = workbook.addImage({
          buffer: logoBuffer,
          extension: 'png',
        });
        worksheet.addImage(imageId, {
          tl: { col: 0, row: 0 },
          ext: { width: 110, height: 48 },
        });
      }
    } catch (logoErr) {
      console.warn('Could not load logo for Excel export:', logoErr);
    }

    if (totalColumnsCount >= 3) {
      const titleEndCol = Math.min(totalColumnsCount, 12);
      worksheet.mergeCells(1, 3, 2, titleEndCol);
      const titleCell = worksheet.getCell(1, 3);
      titleCell.value = excelTitle;
      titleCell.font = { name: 'Times New Roman', size: 15, bold: true, color: { argb: titleColor } };
      titleCell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    } else {
      worksheet.mergeCells(1, 1, 2, totalColumnsCount);
      const titleCell = worksheet.getCell(1, 1);
      titleCell.value = excelTitle;
      titleCell.font = { name: 'Times New Roman', size: 15, bold: true, color: { argb: titleColor } };
      titleCell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    }

    if (isTwoRowHeader) {
      const row3 = worksheet.getRow(3);
      row3.height = 28;
      const row4 = worksheet.getRow(4);
      row4.height = 26;

      worksheet.mergeCells(3, 1, 4, 1);
      worksheet.getCell(3, 1).value = 'Date';
      styleRange(worksheet, 3, 1, 4, 1, {
        font: headerFontNormal,
        fill: headerFillPattern,
        alignment: centerMiddleAlign,
        border: thinBorder,
      });

      let currentXCol = 2;
      let idx = 0;
      while (idx < exportColumns.length) {
        const colDef = exportColumns[idx];
        if (colDef.parentHeader) {
          const parentName = colDef.parentHeader;
          let count = 0;
          while (
            idx + count < exportColumns.length &&
            exportColumns[idx + count].parentHeader === parentName
          ) {
            count++;
          }
          const startCol = currentXCol;
          const endCol = currentXCol + count - 1;

          worksheet.mergeCells(3, startCol, 3, endCol);
          worksheet.getCell(3, startCol).value = parentName;
          styleRange(worksheet, 3, startCol, 3, endCol, {
            font: headerFontNormal,
            fill: headerFillPattern,
            alignment: centerMiddleAlign,
            border: thinBorder,
          });

          for (let s = 0; s < count; s++) {
            const targetCol = startCol + s;
            const subDef = exportColumns[idx + s];
            worksheet.getCell(4, targetCol).value = subDef.header;
            styleRange(worksheet, 4, targetCol, 4, targetCol, {
              font: headerFontSub,
              fill: headerFillPattern,
              alignment: centerMiddleAlign,
              border: thinBorder,
            });
          }

          currentXCol += count;
          idx += count;
        } else {
          worksheet.mergeCells(3, currentXCol, 4, currentXCol);
          worksheet.getCell(3, currentXCol).value = colDef.header;
          styleRange(worksheet, 3, currentXCol, 4, currentXCol, {
            font: colDef.isShop ? redHeaderFont : headerFontNormal,
            fill: headerFillPattern,
            alignment: centerMiddleAlign,
            border: thinBorder,
          });

          currentXCol++;
          idx++;
        }
      }
    } else {
      const headerRow = worksheet.getRow(3);
      headerRow.height = 53.25;

      worksheet.getCell(3, 1).value = 'Date';
      styleRange(worksheet, 3, 1, 3, 1, {
        font: headerFontNormal,
        fill: headerFillPattern,
        alignment: centerMiddleAlign,
        border: thinBorder,
      });

      for (let i = 0; i < exportColumns.length; i++) {
        const colDef = exportColumns[i];
        const targetCol = 2 + i;
        worksheet.getCell(3, targetCol).value = colDef.header;
        styleRange(worksheet, 3, targetCol, 3, targetCol, {
          font: colDef.isShop ? redHeaderFont : headerFontNormal,
          fill: headerFillPattern,
          alignment: centerMiddleAlign,
          border: thinBorder,
        });
      }
    }

    matrixRows.forEach((item) => {
      const rowData: (string | number)[] = [item.date];
      for (const colDef of exportColumns) {
        rowData.push(colDef.getValue(item));
      }

      const row = worksheet.addRow(rowData);
      row.height = 26.1;

      const dateCell = row.getCell(1);
      dateCell.alignment = { vertical: 'middle', horizontal: 'center' };
      dateCell.font = { name: 'Times New Roman', size: 12, bold: true, color: { argb: 'FF0F172A' } };
      dateCell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFF8FAFC' },
      };
      dateCell.border = thinBorder;

      for (let colIdx = 2; colIdx <= totalColumnsCount; colIdx++) {
        const cell = row.getCell(colIdx);
        cell.numFmt = '#,##0.00';
        cell.alignment = { vertical: 'middle', horizontal: 'right' };
        cell.font = { name: 'Times New Roman', size: 12, bold: true, color: { argb: 'FF0F172A' } };
        cell.border = thinBorder;

        const colDef = exportColumns[colIdx - 2];
        if (colDef?.key === 'row_total') {
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFF1F5F9' },
          };
        }
      }
    });

    const footerData: (string | number)[] = ['TOTAL'];
    for (const colDef of exportColumns) {
      footerData.push(colDef.getTotal());
    }

    const totalRow = worksheet.addRow(footerData);
    totalRow.height = 33.95;

    const footerDateCell = totalRow.getCell(1);
    footerDateCell.alignment = { vertical: 'middle', horizontal: 'center' };
    footerDateCell.font = { name: 'Times New Roman', size: 14, bold: true, color: { argb: footerFont } };
    footerDateCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: footerFill },
    };
    footerDateCell.border = doubleBottomBorder;

    for (let colIdx = 2; colIdx <= totalColumnsCount; colIdx++) {
      const cell = totalRow.getCell(colIdx);
      cell.numFmt = '#,##0.00';
      cell.alignment = { vertical: 'middle', horizontal: 'right' };
      cell.font = { name: 'Times New Roman', size: 14, bold: true, color: { argb: footerFont } };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: footerFill },
      };
      cell.border = doubleBottomBorder;
    }

    const blankRow = worksheet.addRow([]);
    blankRow.height = 18;

    const signatureRow = worksheet.addRow(['INCOME AUDITOR']);
    signatureRow.height = 24;
    const sigCell = signatureRow.getCell(1);
    sigCell.font = { name: 'Times New Roman', size: 11, bold: true, color: { argb: 'FF0F172A' } };
    sigCell.alignment = { vertical: 'middle', horizontal: 'center' };
  }

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const safeEntityName = (entityName || 'تقرير').replace(/\s+/g, '_').replace(/[/\\:*?"<>|]/g, '');
  const safeDatePart = (dateFilePart || 'بيانات').replace(/[/\\:*?"<>|]/g, '-');
  const fileName = `${modeWord || 'مصفوفة'}_${safeEntityName}_${safeDatePart}.xlsx`;

  let downloaded = false;
  try {
    const fileSaverMod = await import('file-saver');
    const saveAsFn =
      (fileSaverMod as any).saveAs ||
      (fileSaverMod as any).default?.saveAs ||
      (fileSaverMod as any).default;

    if (typeof saveAsFn === 'function') {
      saveAsFn(blob, fileName);
      downloaded = true;
    }
  } catch (saveErr) {
    console.warn('file-saver dynamic import error, using native fallback:', saveErr);
  }

  if (!downloaded && typeof window !== 'undefined') {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    }, 200);
  }
}
