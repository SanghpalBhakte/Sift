import { CsvColumnMapping, NormalizedTransaction } from '../types';
import { normalizeMerchantDescriptor } from './merchantMatcher';

/**
 * Robust, client-side CSV parser supporting quoted cells, commas, tabs, and semicolons.
 */
export function parseRawCsv(csvText: string): { headers: string[]; rows: Record<string, string>[] } {
  // Strip BOM if present
  const cleanText = csvText.replace(/^\uFEFF/, '').trim();
  if (!cleanText) return { headers: [], rows: [] };

  // Detect delimiter (comma, semicolon, tab)
  const firstLine = cleanText.split(/\r\n|\n/)[0];
  const commaCount = (firstLine.match(/,/g) || []).length;
  const semiCount = (firstLine.match(/;/g) || []).length;
  const tabCount = (firstLine.match(/\t/g) || []).length;

  let delimiter = ',';
  if (semiCount > commaCount && semiCount > tabCount) delimiter = ';';
  if (tabCount > commaCount && tabCount > semiCount) delimiter = '\t';

  const lines = parseCsvLines(cleanText, delimiter);
  if (lines.length === 0) return { headers: [], rows: [] };

  const rawHeaders = lines[0].map((h) => h.trim());
  // Ensure non-empty headers
  const headers = rawHeaders.map((h, i) => (h ? h : `Column_${i + 1}`));

  const rows: Record<string, string>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const rowValues = lines[i];
    // Skip empty lines
    if (rowValues.length === 0 || (rowValues.length === 1 && !rowValues[0].trim())) {
      continue;
    }

    const rowObj: Record<string, string> = {};
    headers.forEach((header, index) => {
      rowObj[header] = (rowValues[index] || '').trim();
    });
    rows.push(rowObj);
  }

  return { headers, rows };
}

/**
 * Character-by-character parser handling quoted cells and escape sequences
 */
function parseCsvLines(text: string, delimiter: string): string[][] {
  const result: string[][] = [];
  let currentLine: string[] = [];
  let currentCell = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        currentCell += '"';
        i++; // skip escaped quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === delimiter && !inQuotes) {
      currentLine.push(currentCell);
      currentCell = '';
    } else if ((char === '\r' || char === '\n') && !inQuotes) {
      if (char === '\r' && nextChar === '\n') {
        i++; // skip \n in CRLF
      }
      currentLine.push(currentCell);
      if (currentLine.length > 0 && currentLine.some((c) => c.trim().length > 0)) {
        result.push(currentLine);
      }
      currentLine = [];
      currentCell = '';
    } else {
      currentCell += char;
    }
  }

  if (currentCell.length > 0 || currentLine.length > 0) {
    currentLine.push(currentCell);
    result.push(currentLine);
  }

  return result;
}

/**
 * Auto-detects matching columns based on common bank statement header keywords
 */
export function autoDetectColumnMapping(headers: string[]): CsvColumnMapping {
  const normalized = headers.map((h) => h.toLowerCase().replace(/[^a-z0-9]/g, ''));

  const findHeader = (keywords: string[]): string => {
    for (let i = 0; i < headers.length; i++) {
      const hNorm = normalized[i];
      const hOrig = headers[i].toLowerCase();
      if (keywords.some((kw) => hNorm.includes(kw) || hOrig.includes(kw))) {
        return headers[i];
      }
    }
    return '';
  };

  const dateColumn = findHeader([
    'date',
    'transactiondate',
    'posteddate',
    'bookingdate',
    'transdate',
    'effective',
    'time',
  ]) || headers[0] || '';

  const descriptionColumn = findHeader([
    'description',
    'merchant',
    'payee',
    'narrative',
    'details',
    'memo',
    'name',
    'particulars',
    'transactiondetails',
  ]) || (headers.length > 1 ? headers[1] : headers[0] || '');

  const amountColumn = findHeader([
    'amount',
    'debit',
    'spent',
    'charge',
    'value',
    'total',
    'transamount',
  ]) || (headers.length > 2 ? headers[2] : headers[headers.length - 1] || '');

  const debitColumn = findHeader(['debit', 'withdrawal', 'dr', 'moneyout']);
  const creditColumn = findHeader(['credit', 'deposit', 'cr', 'moneyin']);

  return {
    dateColumn,
    descriptionColumn,
    amountColumn,
    debitColumn: debitColumn || undefined,
    creditColumn: creditColumn || undefined,
  };
}

/**
 * Normalizes raw transaction rows into unified format
 */
export function normalizeTransactions(
  rows: Record<string, string>[],
  mapping: CsvColumnMapping
): NormalizedTransaction[] {
  const normalizedList: NormalizedTransaction[] = [];

  rows.forEach((row, index) => {
    const rawDate = row[mapping.dateColumn] || '';
    const rawDescription = row[mapping.descriptionColumn] || '';

    let amount = 0;

    if (mapping.debitColumn && row[mapping.debitColumn]) {
      amount = parseAmountNumber(row[mapping.debitColumn]);
    } else if (mapping.amountColumn && row[mapping.amountColumn]) {
      amount = parseAmountNumber(row[mapping.amountColumn]);
    }

    // Skip credits or $0 transfers
    if (amount <= 0 || isNaN(amount)) return;

    const parsedDate = parseDateString(rawDate);
    if (!parsedDate) return;

    const cleanMerchant = cleanMerchantDescription(rawDescription);
    if (!cleanMerchant) return;

    normalizedList.push({
      id: `tx-${index}-${Date.now()}`,
      date: parsedDate,
      rawDescription,
      cleanMerchant,
      amount: Math.round(amount * 100) / 100,
    });
  });

  return normalizedList.sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );
}

/**
 * Parses numeric amount strings (handles $14.99, -14.99, 14,99 EUR, (14.99))
 */
function parseAmountNumber(amountStr: string): number {
  if (!amountStr) return 0;

  let str = amountStr.trim();
  const isParentheses = str.startsWith('(') && str.endsWith(')');
  str = str.replace(/[()]/g, '');

  // Remove currency symbols & letters
  str = str.replace(/[^0-9.,\-+]/g, '');

  // Handle European comma decimal (e.g., 14,99 or 1.250,50)
  if (str.includes(',') && !str.includes('.')) {
    str = str.replace(',', '.');
  } else if (str.includes(',') && str.includes('.')) {
    if (str.lastIndexOf(',') > str.lastIndexOf('.')) {
      str = str.replace(/\./g, '').replace(',', '.');
    } else {
      str = str.replace(/,/g, '');
    }
  }

  const num = parseFloat(str);
  if (isNaN(num)) return 0;

  // We consider debit expense amounts as positive numbers
  return Math.abs(num);
}

/**
 * Standardize dates into YYYY-MM-DD
 */
function parseDateString(dateStr: string): string | null {
  if (!dateStr) return null;
  const clean = dateStr.trim();

  // If already ISO YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}/.test(clean)) {
    return clean.slice(0, 10);
  }

  // Handle MM/DD/YYYY or DD/MM/YYYY
  const slashParts = clean.split(/[/.-]/);
  if (slashParts.length >= 3) {
    let [p1, p2, p3] = slashParts;
    if (p3.length === 2) p3 = `20${p3}`;

    const n1 = parseInt(p1, 10);
    const n2 = parseInt(p2, 10);
    const n3 = parseInt(p3, 10);

    if (n3 > 1900 && n1 <= 12 && n2 <= 31) {
      // MM/DD/YYYY
      const m = String(n1).padStart(2, '0');
      const d = String(n2).padStart(2, '0');
      return `${n3}-${m}-${d}`;
    } else if (n3 > 1900 && n1 <= 31 && n2 <= 12) {
      // DD/MM/YYYY
      const d = String(n1).padStart(2, '0');
      const m = String(n2).padStart(2, '0');
      return `${n3}-${m}-${d}`;
    }
  }

  const parsed = new Date(clean);
  if (!isNaN(parsed.getTime())) {
    return parsed.toISOString().slice(0, 10);
  }

  return null;
}

/**
 * Cleans noisy bank statement merchant strings via centralized merchantMatcher
 */
export function cleanMerchantDescription(rawDesc: string): string {
  if (!rawDesc) return '';
  const result = normalizeMerchantDescriptor(rawDesc);
  return result.canonical || result.normalized || rawDesc.trim();
}
