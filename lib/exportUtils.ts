import { NextResponse } from 'next/server';
import * as XLSX from 'xlsx';

export type ExportRow = Record<string, string | number | boolean | Date | null | undefined>;

export type ExportFormat = 'csv' | 'xlsx';

function escapeCsvCell(value: unknown): string {
  if (value === null || value === undefined) return '';
  const str = String(value).replace(/"/g, '""');
  if (str.includes(',') || str.includes(';') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str}"`;
  }
  return str;
}

export function generateCsv(rows: ExportRow[], headers: string[], labels?: Record<string, string>): string {
  const headerLine = headers.map(h => labels?.[h] ?? h).join(';');
  const lines = rows.map(row =>
    headers.map(h => escapeCsvCell(row[h])).join(';')
  );
  return [headerLine, ...lines].join('\r\n');
}

export function generateXlsx(rows: ExportRow[], sheetName = 'Export'): Buffer {
  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
}

export function sendExport(
  rows: ExportRow[],
  headers: string[],
  filename: string,
  format: ExportFormat,
  labels?: Record<string, string>
): NextResponse {
  if (format === 'csv') {
    const csv = generateCsv(rows, headers, labels);
    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}.csv"`,
      },
    });
  }

  const xlsx = generateXlsx(rows, filename);
  return new NextResponse(new Uint8Array(xlsx), {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${filename}.xlsx"`,
    },
  });
}

export function formatDateFr(date?: Date | string | null): string {
  if (!date) return '';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString('fr-FR');
}

export function formatMontant(value?: number | null): string {
  if (value === null || value === undefined || isNaN(value)) return '0';
  return value.toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}
