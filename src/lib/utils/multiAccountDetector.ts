export interface AccountGroup {
  id: string;
  accountKey: string;
  label: string;
  rowCount: number;
  sampleRows: Record<string, string>[];
  inferredCurrency?: string;
  customCurrency?: string;
}

export interface MultiAccountDetectionResult {
  hasMultipleAccounts: boolean;
  accountColumn: string | null;
  groups: AccountGroup[];
  totalRows: number;
}

const ACCOUNT_COLUMN_KEYWORDS = [
  'account number',
  'account #',
  'account_number',
  'account',
  'card number',
  'card #',
  'card no.',
  'card no',
  'card_number',
  'card member',
  'cardholder',
  'account name',
  'sub account',
  'masked account',
  'account id',
];

const CURRENCY_COLUMN_KEYWORDS = ['currency', 'curr', 'iso currency', 'trans currency'];

/**
 * Infer probable currency for a set of transaction rows
 */
function inferGroupCurrency(headers: string[], groupRows: Record<string, string>[]): string | undefined {
  // 1. Check currency column
  for (const h of headers) {
    const norm = h.toLowerCase().trim();
    if (CURRENCY_COLUMN_KEYWORDS.some((kw) => norm === kw || norm.includes(kw))) {
      for (const row of groupRows.slice(0, 5)) {
        const val = (row[h] || '').trim().toUpperCase();
        if (['USD', 'EUR', 'GBP', 'CAD', 'INR', 'JPY', 'AUD', 'CHF', 'SGD', 'NZD', 'SEK', 'NOK', 'BRL'].includes(val)) {
          return val;
        }
      }
    }
  }

  // 2. Check amount strings for currency symbols
  for (const row of groupRows.slice(0, 5)) {
    const joined = Object.values(row).join(' ');
    if (joined.includes('€')) return 'EUR';
    if (joined.includes('£')) return 'GBP';
    if (joined.includes('₹')) return 'INR';
    if (joined.includes('¥')) return 'JPY';
    if (joined.includes('C$') || joined.includes('CAD')) return 'CAD';
    if (joined.includes('A$') || joined.includes('AUD')) return 'AUD';
    if (joined.includes('$')) return 'USD';
  }

  return undefined;
}

/**
 * Scans CSV headers and rows to detect if a file contains transactions from multiple accounts or cards
 */
export function detectMultiAccountGroups(
  headers: string[],
  rows: Record<string, string>[],
  defaultCurrency: string = 'USD'
): MultiAccountDetectionResult {
  if (!headers || headers.length === 0 || !rows || rows.length === 0) {
    return {
      hasMultipleAccounts: false,
      accountColumn: null,
      groups: [],
      totalRows: 0,
    };
  }

  // 1. Locate potential account/card column
  let detectedColumn: string | null = null;

  for (const h of headers) {
    const norm = h.toLowerCase().trim();
    if (ACCOUNT_COLUMN_KEYWORDS.some((kw) => norm === kw || norm.includes(kw))) {
      detectedColumn = h;
      break;
    }
  }

  if (!detectedColumn) {
    return {
      hasMultipleAccounts: false,
      accountColumn: null,
      groups: [],
      totalRows: rows.length,
    };
  }

  // 2. Group rows by the detected account column
  const groupMap = new Map<string, Record<string, string>[]>();

  for (const row of rows) {
    const rawVal = (row[detectedColumn] || '').trim();
    const key = rawVal || 'Unknown / Unassigned Account';

    if (!groupMap.has(key)) {
      groupMap.set(key, []);
    }
    groupMap.get(key)!.push(row);
  }

  // If only 1 distinct group exists, no multi-account selection needed
  if (groupMap.size <= 1) {
    return {
      hasMultipleAccounts: false,
      accountColumn: detectedColumn,
      groups: [],
      totalRows: rows.length,
    };
  }

  // 3. Construct structured AccountGroup objects with currency detection
  const groups: AccountGroup[] = [];
  let index = 1;

  for (const [key, groupRows] of groupMap.entries()) {
    let cleanLabel = key;
    // Format card numbers (e.g. ************1234 -> Card ending in 1234)
    if (/^\*+(\d{4})$/.test(key) || /^\d{12,16}$/.test(key) || key.length > 8) {
      const last4 = key.slice(-4);
      cleanLabel = `Card ending in ${last4}`;
    }

    const inferred = inferGroupCurrency(headers, groupRows) || defaultCurrency;

    groups.push({
      id: `acc-grp-${index++}`,
      accountKey: key,
      label: cleanLabel,
      rowCount: groupRows.length,
      sampleRows: groupRows.slice(0, 3),
      inferredCurrency: inferred,
      customCurrency: inferred,
    });
  }

  // Sort groups by highest transaction count
  groups.sort((a, b) => b.rowCount - a.rowCount);

  return {
    hasMultipleAccounts: true,
    accountColumn: detectedColumn,
    groups,
    totalRows: rows.length,
  };
}
