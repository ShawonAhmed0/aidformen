import "server-only";

import ExcelJS from "exceljs";

/**
 * Excel helpers for the admin exports. Cells are written as typed values, not
 * formulas, so text a visitor typed can never run as one in Excel.
 */

type Cell = string | number | null | undefined;

export function newWorkbook() {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Aid For Men Foundation";
  workbook.created = new Date();
  return workbook;
}

/**
 * One sheet: a bold header row that stays put while scrolling, a filter on
 * every column, and widths that fit Bengali (wider per character than Latin).
 */
export function addSheet(
  workbook: ExcelJS.Workbook,
  name: string,
  headers: string[],
  rows: Cell[][],
  widths: number[] = []
) {
  // Excel caps sheet names at 31 characters and forbids a few symbols.
  const sheet = workbook.addWorksheet(name.replace(/[\\/?*[\]:]/g, " ").slice(0, 31), {
    views: [{ state: "frozen", ySplit: 1 }],
  });
  sheet.columns = headers.map((header, i) => ({
    header,
    width: widths[i] ?? Math.min(60, Math.max(12, header.length + 4)),
  }));
  for (const row of rows) sheet.addRow(row.map((value) => (value == null ? "" : value)));

  const head = sheet.getRow(1);
  head.font = { bold: true, color: { argb: "FF00394C" } };
  head.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFEAF8FF" } };
  head.alignment = { vertical: "middle" };
  head.height = 22;
  sheet.eachRow((row, index) => {
    if (index > 1) row.alignment = { vertical: "top", wrapText: true };
  });
  if (rows.length) {
    sheet.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: headers.length } };
  }
  return sheet;
}

export async function xlsxResponse(workbook: ExcelJS.Workbook, fileName: string) {
  const buffer = await workbook.xlsx.writeBuffer();
  return new Response(buffer as ArrayBuffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${fileName}"`,
      "Cache-Control": "no-store",
    },
  });
}
