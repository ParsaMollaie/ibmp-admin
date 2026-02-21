import { saveAs } from 'file-saver';
import * as XLSX from 'xlsx';

export interface ExportColumn {
  title: string;
  dataIndex: string | string[];
  render?: (value: any, record: any) => string;
}

export interface FetchParams {
  page: number;
  page_size: number;
  [key: string]: any;
}

export interface FetchResponse {
  success: boolean;
  data?: {
    list: any[];
    pagination: {
      total: number;
    };
  };
}

/**
 * Get nested value from object using dot notation or array path
 * Example: getValue(obj, ['province', 'name']) or getValue(obj, 'province.name')
 */
const getValue = (obj: any, path: string | string[]): any => {
  if (!obj) return '';

  const keys = Array.isArray(path) ? path : path.split('.');
  let value = obj;

  for (const key of keys) {
    if (value === null || value === undefined) return '';
    value = value[key];
  }

  return value ?? '';
};

/**
 * Export data to Excel file with Persian headers
 * @param data - Array of data objects to export
 * @param columns - Column definitions with Persian titles
 * @param filename - Base filename (without extension)
 */
export function exportToExcel(
  data: any[],
  columns: ExportColumn[],
  filename: string,
): void {
  // Transform data to rows with Persian headers
  const rows = data.map((record) => {
    const row: Record<string, any> = {};

    columns.forEach((col) => {
      const value = getValue(record, col.dataIndex);
      // Use custom render if provided, otherwise use raw value
      row[col.title] = col.render ? col.render(value, record) : value;
    });

    return row;
  });

  // Create worksheet from data
  const worksheet = XLSX.utils.json_to_sheet(rows);

  // Set RTL direction for Persian text
  worksheet['!cols'] = columns.map(() => ({ wch: 20 })); // Default column width

  // Create workbook
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');

  // Generate filename with timestamp
  const timestamp = new Date().toISOString().slice(0, 10);
  const fullFilename = `${filename}_${timestamp}.xlsx`;

  // Trigger download using file-saver
  const wbout = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([wbout], { type: 'application/octet-stream' });
  saveAs(blob, fullFilename);
}

/**
 * Parse an Excel file and return a workbook object
 * @param file - File object from upload input
 * @returns XLSX WorkBook
 */
export function parseExcelFile(file: File): Promise<XLSX.WorkBook> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        resolve(workbook);
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Convert a specific sheet from a workbook to a JSON array
 * @param workbook - XLSX WorkBook
 * @param sheetIndex - Index of the sheet to convert (0-based)
 * @returns Array of objects with keys from sheet headers
 */
export function sheetToJson<T = Record<string, any>>(
  workbook: XLSX.WorkBook,
  sheetIndex: number,
): T[] {
  const sheetName = workbook.SheetNames[sheetIndex];
  if (!sheetName) return [];
  const worksheet = workbook.Sheets[sheetName];
  return XLSX.utils.sheet_to_json<T>(worksheet);
}

/**
 * Fetch all data in batches and export to Excel
 * @param fetchFn - Function to fetch data from API
 * @param filterParams - Current filter parameters
 * @param columns - Export column definitions
 * @param filename - Base filename
 * @param batchSize - Number of records per batch (default 500)
 * @param onProgress - Optional callback for progress updates
 */
export async function exportAllToExcel(
  fetchFn: (params: FetchParams) => Promise<FetchResponse>,
  filterParams: Record<string, any>,
  columns: ExportColumn[],
  filename: string,
  batchSize: number = 500,
  onProgress?: (loaded: number, total: number) => void,
): Promise<{ success: boolean; count: number }> {
  const allData: any[] = [];
  let page = 1;
  let total = 0;
  let hasMore = true;

  // Fetch data in batches
  while (hasMore) {
    const response = await fetchFn({
      ...filterParams,
      page,
      page_size: batchSize,
    });

    if (!response.success || !response.data?.list) {
      if (allData.length === 0) {
        return { success: false, count: 0 };
      }
      break;
    }

    const { list, pagination } = response.data;
    total = pagination.total;
    allData.push(...list);

    // Update progress
    if (onProgress) {
      onProgress(allData.length, total);
    }

    // Check if we have more data
    hasMore = allData.length < total && list.length === batchSize;
    page++;
  }

  if (allData.length === 0) {
    return { success: false, count: 0 };
  }

  // Export to Excel
  exportToExcel(allData, columns, filename);
  return { success: true, count: allData.length };
}
