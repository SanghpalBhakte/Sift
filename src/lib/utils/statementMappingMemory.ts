import { CsvColumnMapping } from '../types';

const STORAGE_KEY = 'sift_saved_statement_mappings_v2';
const CUSTOM_RULES_KEY = 'sift_custom_bank_rules_v1';

export interface SavedStatementMapping {
  signature: string;
  bankName: string;
  headers: string[];
  mapping: CsvColumnMapping;
  lastUsedAt: string;
  useCount: number;
}

export interface CustomBankRule {
  id: string;
  bankName: string;
  filePattern?: string; // regex or substring matching file name
  headerKeywords: string[]; // header strings required (all or subset)
  headerRegexPattern?: string; // optional regex testing any header line
  isEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CustomBankRulesExportPayload {
  version: 1;
  exportedAt: string;
  app: 'Sift';
  type: 'custom_bank_rules';
  rules: CustomBankRule[];
}

export interface RuleImportValidationResult {
  valid: boolean;
  error?: string;
  payload?: CustomBankRulesExportPayload;
  newCount: number;
  updateCount: number;
  identicalCount: number;
}

/**
 * Built-in Bank Fingerprint Rules
 */
interface BankRule {
  name: string;
  fileKeywords: string[];
  requiredHeaders: string[];
  optionalHeaders: string[];
}

const BUILTIN_BANK_RULES: BankRule[] = [
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
 * Safe regular expression execution with timeout & error bounds
 */
export function safeRegexMatch(pattern: string, input: string): boolean {
  if (!pattern || !input) return false;
  // Limit input size to prevent catastrophic backtracking
  const boundedInput = input.slice(0, 1000);
  try {
    const re = new RegExp(pattern.trim(), 'i');
    return re.test(boundedInput);
  } catch (err) {
    console.warn(`Invalid regex pattern "${pattern}":`, err);
    return false;
  }
}

/**
 * Test if a custom bank rule matches given headers and filename
 */
export function testCustomRule(
  rule: CustomBankRule,
  headers: string[],
  fileName: string = ''
): { matches: boolean; matchedBy: string[] } {
  const matchedBy: string[] = [];
  const normFile = fileName.toLowerCase();
  const normHeaders = headers.map((h) => h.toLowerCase().trim());
  const headerJoined = headers.join(' | ');

  // 1. Test File Pattern
  if (rule.filePattern && rule.filePattern.trim()) {
    const filePat = rule.filePattern.trim();
    const isRegex = filePat.startsWith('/') || filePat.includes('.*') || filePat.includes('\\');
    const fileMatched = isRegex
      ? safeRegexMatch(filePat.replace(/^\/|\/$/g, ''), normFile)
      : normFile.includes(filePat.toLowerCase());

    if (fileMatched) {
      matchedBy.push(`File pattern: "${filePat}"`);
    } else {
      return { matches: false, matchedBy: [] };
    }
  }

  // 2. Test Header Keywords
  if (rule.headerKeywords && rule.headerKeywords.length > 0) {
    const cleanKeywords = rule.headerKeywords.map((k) => k.toLowerCase().trim()).filter(Boolean);
    const allKeywordsPresent = cleanKeywords.every((kw) =>
      normHeaders.some((h) => h.includes(kw))
    );

    if (allKeywordsPresent) {
      matchedBy.push(`Keywords matched: [${cleanKeywords.join(', ')}]`);
    } else {
      return { matches: false, matchedBy: [] };
    }
  }

  // 3. Test Header Regex Pattern
  if (rule.headerRegexPattern && rule.headerRegexPattern.trim()) {
    const pat = rule.headerRegexPattern.trim();
    if (safeRegexMatch(pat, headerJoined)) {
      matchedBy.push(`Header regex: "${pat}"`);
    } else {
      return { matches: false, matchedBy: [] };
    }
  }

  return {
    matches: matchedBy.length > 0,
    matchedBy,
  };
}

/**
 * Retrieve user-defined custom bank recognition rules
 */
export function getCustomBankRules(): CustomBankRule[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(CUSTOM_RULES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.warn('Failed to read custom bank rules:', err);
    return [];
  }
}

/**
 * Persist or update a custom bank recognition rule
 */
export function saveCustomBankRule(
  rule: Omit<CustomBankRule, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }
): CustomBankRule {
  const existing = getCustomBankRules();
  const now = new Date().toISOString();

  let savedRule: CustomBankRule;

  if (rule.id && existing.some((r) => r.id === rule.id)) {
    savedRule = {
      ...existing.find((r) => r.id === rule.id)!,
      ...rule,
      updatedAt: now,
    };
    const nextRules = existing.map((r) => (r.id === rule.id ? savedRule : r));
    localStorage.setItem(CUSTOM_RULES_KEY, JSON.stringify(nextRules));
  } else {
    savedRule = {
      id: `rule-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      bankName: rule.bankName.trim(),
      filePattern: rule.filePattern?.trim() || undefined,
      headerKeywords: rule.headerKeywords || [],
      headerRegexPattern: rule.headerRegexPattern?.trim() || undefined,
      isEnabled: rule.isEnabled ?? true,
      createdAt: now,
      updatedAt: now,
    };
    const nextRules = [savedRule, ...existing];
    localStorage.setItem(CUSTOM_RULES_KEY, JSON.stringify(nextRules));
  }

  return savedRule;
}

/**
 * Delete a custom bank recognition rule
 */
export function deleteCustomBankRule(id: string): void {
  if (typeof window === 'undefined') return;
  try {
    const existing = getCustomBankRules();
    const filtered = existing.filter((r) => r.id !== id);
    localStorage.setItem(CUSTOM_RULES_KEY, JSON.stringify(filtered));
  } catch (err) {
    console.warn('Failed to delete custom bank rule:', err);
  }
}

/**
 * Toggle enable/disable status for a custom bank rule
 */
export function toggleCustomBankRule(id: string, isEnabled: boolean): void {
  if (typeof window === 'undefined') return;
  try {
    const existing = getCustomBankRules();
    const updated = existing.map((r) =>
      r.id === id ? { ...r, isEnabled, updatedAt: new Date().toISOString() } : r
    );
    localStorage.setItem(CUSTOM_RULES_KEY, JSON.stringify(updated));
  } catch (err) {
    console.warn('Failed to toggle custom bank rule:', err);
  }
}

/**
 * Export all user-defined custom bank recognition rules as JSON string
 */
export function exportCustomBankRulesJson(): string {
  const rules = getCustomBankRules();
  const payload: CustomBankRulesExportPayload = {
    version: 1,
    exportedAt: new Date().toISOString(),
    app: 'Sift',
    type: 'custom_bank_rules',
    rules,
  };
  return JSON.stringify(payload, null, 2);
}

/**
 * Validate imported JSON text before applying to localStorage
 */
export function validateBankRulesJson(jsonText: string): RuleImportValidationResult {
  if (!jsonText || !jsonText.trim()) {
    return { valid: false, error: 'The provided JSON file is empty.', newCount: 0, updateCount: 0, identicalCount: 0 };
  }

  try {
    const parsed = JSON.parse(jsonText);

    // Structure validation
    if (!parsed || typeof parsed !== 'object') {
      return { valid: false, error: 'Invalid JSON root structure.', newCount: 0, updateCount: 0, identicalCount: 0 };
    }

    if (parsed.version !== 1 || parsed.type !== 'custom_bank_rules' || !Array.isArray(parsed.rules)) {
      return {
        valid: false,
        error: 'Incompatible file schema. Expected a Sift custom bank rules export (version 1).',
        newCount: 0,
        updateCount: 0,
        identicalCount: 0,
      };
    }

    // Validate each rule in array
    const validRules: CustomBankRule[] = [];
    for (let i = 0; i < parsed.rules.length; i++) {
      const r = parsed.rules[i];
      if (!r || typeof r !== 'object' || !r.bankName || typeof r.bankName !== 'string') {
        return {
          valid: false,
          error: `Rule at index ${i + 1} is missing a valid bankName string.`,
          newCount: 0,
          updateCount: 0,
          identicalCount: 0,
        };
      }

      // Check regex safety if present
      if (r.headerRegexPattern) {
        try {
          new RegExp(r.headerRegexPattern, 'i');
        } catch (e: any) {
          return {
            valid: false,
            error: `Rule "${r.bankName}" contains an invalid regular expression: ${e.message}`,
            newCount: 0,
            updateCount: 0,
            identicalCount: 0,
          };
        }
      }

      validRules.push({
        id: r.id || `rule-${Date.now()}-${i}`,
        bankName: r.bankName.trim(),
        filePattern: r.filePattern?.trim() || undefined,
        headerKeywords: Array.isArray(r.headerKeywords) ? r.headerKeywords : [],
        headerRegexPattern: r.headerRegexPattern?.trim() || undefined,
        isEnabled: r.isEnabled !== false,
        createdAt: r.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }

    // Check overlaps with existing local rules
    const existing = getCustomBankRules();
    let newCount = 0;
    let updateCount = 0;
    let identicalCount = 0;

    for (const incoming of validRules) {
      const match = existing.find(
        (e) => e.id === incoming.id || e.bankName.toLowerCase() === incoming.bankName.toLowerCase()
      );
      if (!match) {
        newCount++;
      } else {
        // Compare signatures
        const isIdentical =
          match.bankName === incoming.bankName &&
          match.filePattern === incoming.filePattern &&
          match.headerRegexPattern === incoming.headerRegexPattern &&
          match.headerKeywords.join(',') === incoming.headerKeywords.join(',');

        if (isIdentical) {
          identicalCount++;
        } else {
          updateCount++;
        }
      }
    }

    return {
      valid: true,
      payload: {
        ...parsed,
        rules: validRules,
      },
      newCount,
      updateCount,
      identicalCount,
    };
  } catch (err: any) {
    return {
      valid: false,
      error: `JSON parse failed: ${err.message}`,
      newCount: 0,
      updateCount: 0,
      identicalCount: 0,
    };
  }
}

/**
 * Apply validated custom rules using either 'merge' or 'replace' mode
 */
export function applyBankRulesImport(
  importedRules: CustomBankRule[],
  mode: 'merge' | 'replace'
): { added: number; updated: number; total: number } {
  if (typeof window === 'undefined') return { added: 0, updated: 0, total: 0 };

  const existing = getCustomBankRules();

  if (mode === 'replace') {
    localStorage.setItem(CUSTOM_RULES_KEY, JSON.stringify(importedRules));
    return { added: importedRules.length, updated: 0, total: importedRules.length };
  }

  // Merge Mode: Overwrite matching bankName/id, insert new ones
  const nextRules = [...existing];
  let added = 0;
  let updated = 0;

  for (const rule of importedRules) {
    const idx = nextRules.findIndex(
      (e) => e.id === rule.id || e.bankName.toLowerCase() === rule.bankName.toLowerCase()
    );
    if (idx >= 0) {
      nextRules[idx] = { ...nextRules[idx], ...rule, updatedAt: new Date().toISOString() };
      updated++;
    } else {
      nextRules.push(rule);
      added++;
    }
  }

  localStorage.setItem(CUSTOM_RULES_KEY, JSON.stringify(nextRules));
  return { added, updated, total: nextRules.length };
}

/**
 * Detect the likely issuing bank using:
 * 1. User-defined custom rules (Priority)
 * 2. Built-in bank fingerprints (Chase, Amex, Revolut, etc.)
 * 3. Fallback: "Custom Statement Format"
 */
export function detectBankSource(headers: string[], fileName: string = ''): string {
  // 1. Check enabled user-defined custom bank rules
  const customRules = getCustomBankRules().filter((r) => r.isEnabled);
  for (const rule of customRules) {
    const testResult = testCustomRule(rule, headers, fileName);
    if (testResult.matches) {
      return rule.bankName;
    }
  }

  const normFile = fileName.toLowerCase().replace(/[^a-z0-9]/g, '');
  const normHeaders = headers.map((h) => h.toLowerCase().trim());

  // 2. Check built-in bank rules (File match + required headers)
  for (const rule of BUILTIN_BANK_RULES) {
    const hasFileMatch = rule.fileKeywords.some((kw) => normFile.includes(kw.replace(/[^a-z0-9]/g, '')));
    const hasRequired = rule.requiredHeaders.every((req) =>
      normHeaders.some((h) => h.includes(req))
    );

    if (hasFileMatch && hasRequired) {
      return rule.name;
    }
  }

  // 3. Check built-in bank rules (Header combination match)
  for (const rule of BUILTIN_BANK_RULES) {
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
    const bankMatches = saved.filter((s) => s.bankName.toLowerCase() === detectedBank.toLowerCase());
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
