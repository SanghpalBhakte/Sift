import { CsvColumnMapping } from '../types';

const STORAGE_KEY = 'sift_saved_statement_mappings_v1';

export interface SavedStatementMapping {
  signature: string;
  headers: string[];
  mapping: CsvColumnMapping;
  lastUsedAt: string;
  useCount: number;
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
 * Find a saved mapping matching the uploaded CSV headers
 */
export function findSavedMapping(
  headers: string[]
): { mapping: CsvColumnMapping; matchedSignature: string; isExact: boolean } | null {
  if (!headers || headers.length === 0) return null;

  const currentSignature = generateHeaderSignature(headers);
  const saved = getSavedStatementMappings();

  // 1. Check for exact signature match
  const exact = saved.find((s) => s.signature === currentSignature);
  if (exact && validateMappingWithHeaders(exact.mapping, headers)) {
    return {
      mapping: exact.mapping,
      matchedSignature: exact.signature,
      isExact: true,
    };
  }

  // 2. Check for high-confidence subset match (all mapped columns exist in new CSV)
  for (const item of saved) {
    if (validateMappingWithHeaders(item.mapping, headers)) {
      const savedNorm = item.headers.map((h) => h.toLowerCase().trim());
      const currentNorm = headers.map((h) => h.toLowerCase().trim());
      const shared = savedNorm.filter((h) => currentNorm.includes(h));

      // If at least 75% of columns overlap and all critical mapped columns exist
      if (shared.length / savedNorm.length >= 0.75) {
        return {
          mapping: item.mapping,
          matchedSignature: item.signature,
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
export function saveConfirmedMapping(headers: string[], mapping: CsvColumnMapping): void {
  if (typeof window === 'undefined') return;
  if (!validateMappingWithHeaders(mapping, headers)) return;

  const signature = generateHeaderSignature(headers);
  if (!signature) return;

  try {
    const saved = getSavedStatementMappings();
    const existingIndex = saved.findIndex((s) => s.signature === signature);

    const updatedEntry: SavedStatementMapping = {
      signature,
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
      // Keep up to 20 recent formats
      nextSaved = [updatedEntry, ...saved.slice(0, 19)];
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextSaved));
  } catch (err) {
    console.warn('Failed to save statement mapping:', err);
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
