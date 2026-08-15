import { CsvColumnMapping } from '../types';

const STORAGE_KEY = 'sift_saved_statement_mappings_v2';

export interface SavedStatementMapping {
  signature: string;
  bankName: string;
  headers: string[];
  mapping: CsvColumnMapping;
  lastUsedAt: string;
  useCount: number;
}

/**
 * Known Bank Fingerprint Rules
 */
interface BankRule {
  name: string;
  fileKeywords: string[];
  requiredHeaders: string[];
  optionalHeaders: string[];
}

const BANK_RULES: BankRule[] = [
  {
    name: 'Chase',
    fileKeywords: ['chase', 'activity'],
    requiredHeaders: ['transaction date', 'description', 'amount'],
    optionalHeaders: ['post date', 'category', 'type', 'memo'],
  },
  {
    name: 'American Express',
    fileKeywords: ['amex', 'americanexpress', 'statement'],
    requiredHeaders: ['date', 'description', 'amount'],
    optionalHeaders: ['card member', 'account #', 'extended details', 'appears on your statement as'],
  },
  {
    name: 'Revolut',
    fileKeywords: ['revolut'],
    requiredHeaders: ['started date', 'description', 'amount'],
    optionalHeaders: ['completed date', 'fee', 'currency', 'state', 'balance'],
  },
  {
    name: 'Apple Card',
    fileKeywords: ['apple card', 'applecard', 'apple_card'],
    requiredHeaders: ['transaction date', 'description', 'amount (usd)'],
    optionalHeaders: ['clearing date', 'merchant', 'category', 'type'],
  },
  {
    name: 'Capital One',
    fileKeywords: ['capitalone', 'capital_one'],
    requiredHeaders: ['transaction date', 'description'],
    optionalHeaders: ['card no.', 'category', 'debit', 'credit', 'posted date'],
  },
  {
    name: 'Bank of America',
    fileKeywords: ['bofa', 'bankofamerica', 'boa'],
    requiredHeaders: ['date', 'description', 'amount'],
    optionalHeaders: ['running bal.', 'reference number'],
  },
  {
    name: 'Wells Fargo',
    fileKeywords: ['wellsfargo', 'wells_fargo'],
    requiredHeaders: ['date', 'amount', 'description'],
    optionalHeaders: ['check number', 'reference'],
  },
  {
    name: 'Barclays',
    fileKeywords: ['barclays', 'barclaycard'],
    requiredHeaders: ['date', 'description', 'amount'],
    optionalHeaders: ['sub category', 'account number'],
  },
  {
    name: 'Monzo',
    fileKeywords: ['monzo'],
    requiredHeaders: ['date', 'name', 'amount'],
    optionalHeaders: ['transaction id', 'time', 'type', 'category', 'currency', 'local amount'],
  },
];

/**
 * Detect the likely issuing bank from file name and CSV headers
 */
export function detectBankSource(headers: string[], fileName: string = ''): string {
  const normFile = fileName.toLowerCase().replace(/[^a-z0-9]/g, '');
  const normHeaders = headers.map((h) => h.toLowerCase().trim());

  // 1. Check for strong file keyword + header match
  for (const rule of BANK_RULES) {
    const hasFileMatch = rule.fileKeywords.some((kw) => normFile.includes(kw.replace(/[^a-z0-9]/g, '')));
    const hasRequired = rule.requiredHeaders.every((req) =>
      normHeaders.some((h) => h.includes(req))
    );

    if (hasFileMatch && hasRequired) {
      return rule.name;
    }
  }

  // 2. Check for unique header combinations
  for (const rule of BANK_RULES) {
    const matchedRequired = rule.requiredHeaders.filter((req) =>
      normHeaders.some((h) => h.includes(req))
    );
    const matchedOptional = rule.optionalHeaders.filter((opt) =>
      normHeaders.some((h) => h.includes(opt))
    );

    if (
      matchedRequired.length === rule.requiredHeaders.length &&
      matchedOptional.length >= Math.min(2, rule.optionalHeaders.length)
    ) {
      return rule.name;
    }
  }

  return 'Custom Statement Format';
}

/**
 * Generate a deterministic signature for a CSV header layout
 */
export function generateHeaderSignature(headers: string[]): string {
  return headers
    .map((h) => h.toLowerCase().trim().replace(/[^a-z0-9]/g, ''))
    .filter(Boolean)
    .sort()
    .join('|');
}

/**
 * Retrieve all saved mappings from localStorage safely
 */
export function getSavedStatementMappings(): SavedStatementMapping[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.warn('Failed to read saved statement mappings:', err);
    return [];
  }
}

/**
 * Find a saved mapping matching the uploaded CSV headers and bank source
 */
export function findSavedMapping(
  headers: string[],
  fileName: string = ''
): {
  mapping: CsvColumnMapping;
  matchedSignature: string;
  bankName: string;
  isExact: boolean;
} | null {
  if (!headers || headers.length === 0) return null;

  const currentSignature = generateHeaderSignature(headers);
  const detectedBank = detectBankSource(headers, fileName);
  const saved = getSavedStatementMappings();

  // 1. Check for exact signature match
  const exact = saved.find((s) => s.signature === currentSignature);
  if (exact && validateMappingWithHeaders(exact.mapping, headers)) {
    return {
      mapping: exact.mapping,
      matchedSignature: exact.signature,
      bankName: exact.bankName || detectedBank,
      isExact: true,
    };
  }

  // 2. Check for same bank profile with compatible headers
  if (detectedBank !== 'Custom Statement Format') {
    const bankMatches = saved.filter((s) => s.bankName === detectedBank);
    for (const item of bankMatches) {
      if (validateMappingWithHeaders(item.mapping, headers)) {
        return {
          mapping: item.mapping,
          matchedSignature: item.signature,
          bankName: item.bankName,
          isExact: false,
        };
      }
    }
  }

  // 3. High-confidence subset match (all mapped columns exist in new CSV)
  for (const item of saved) {
    if (validateMappingWithHeaders(item.mapping, headers)) {
      const savedNorm = item.headers.map((h) => h.toLowerCase().trim());
      const currentNorm = headers.map((h) => h.toLowerCase().trim());
      const shared = savedNorm.filter((h) => currentNorm.includes(h));

      if (shared.length / savedNorm.length >= 0.75) {
        return {
          mapping: item.mapping,
          matchedSignature: item.signature,
          bankName: item.bankName || detectedBank,
          isExact: false,
        };
      }
    }
  }

  return null;
}

/**
 * Validates that the mapped columns exist in the provided header list
 */
function validateMappingWithHeaders(mapping: CsvColumnMapping, headers: string[]): boolean {
  if (!mapping.dateColumn || !headers.includes(mapping.dateColumn)) return false;
  if (!mapping.descriptionColumn || !headers.includes(mapping.descriptionColumn)) return false;
  if (mapping.amountColumn && !headers.includes(mapping.amountColumn)) {
    if (!mapping.debitColumn || !headers.includes(mapping.debitColumn)) return false;
  }
  return true;
}

/**
 * Persist a user-confirmed mapping after successful step confirmation
 */
export function saveConfirmedMapping(
  headers: string[],
  mapping: CsvColumnMapping,
  customBankName?: string,
  fileName: string = ''
): void {
  if (typeof window === 'undefined') return;
  if (!validateMappingWithHeaders(mapping, headers)) return;

  const signature = generateHeaderSignature(headers);
  if (!signature) return;

  const bankName = customBankName?.trim() || detectBankSource(headers, fileName);

  try {
    const saved = getSavedStatementMappings();
    const existingIndex = saved.findIndex((s) => s.signature === signature);

    const updatedEntry: SavedStatementMapping = {
      signature,
      bankName,
      headers: [...headers],
      mapping: { ...mapping },
      lastUsedAt: new Date().toISOString(),
      useCount: existingIndex >= 0 ? (saved[existingIndex].useCount || 1) + 1 : 1,
    };

    let nextSaved: SavedStatementMapping[];
    if (existingIndex >= 0) {
      nextSaved = [...saved];
      nextSaved[existingIndex] = updatedEntry;
    } else {
      // Keep up to 25 bank format profiles
      nextSaved = [updatedEntry, ...saved.slice(0, 24)];
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextSaved));
  } catch (err) {
    console.warn('Failed to save statement mapping:', err);
  }
}

/**
 * Delete a specific saved statement format
 */
export function deleteSavedStatementMapping(signature: string): void {
  if (typeof window === 'undefined') return;
  try {
    const saved = getSavedStatementMappings();
    const filtered = saved.filter((s) => s.signature !== signature);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  } catch (err) {
    console.warn('Failed to delete statement mapping:', err);
  }
}

/**
 * Clear all remembered statement mappings
 */
export function clearSavedStatementMappings(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (err) {
    console.warn('Failed to clear statement mappings:', err);
  }
}
