// =============================================================================
// Sift - Merchant Descriptor Normalization & Fuzzy Token Matching Engine
// Path: src/lib/utils/merchantMatcher.ts
// =============================================================================

import { NormalizedTransaction } from '../types';

export interface NormalizedDescriptorResult {
  raw: string;
  normalized: string;
  canonical: string;
  tokens: string[];
}

// Known brand canonical mappings
const CANONICAL_BRAND_DICTIONARY: Record<string, string> = {
  spotify: 'Spotify',
  netflix: 'Netflix',
  github: 'GitHub',
  notion: 'Notion',
  linear: 'Linear',
  figma: 'Figma',
  openai: 'OpenAI (ChatGPT)',
  chatgpt: 'ChatGPT Plus',
  anthropic: 'Claude Pro',
  claude: 'Claude Pro',
  cursor: 'Cursor AI',
  vercel: 'Vercel',
  supabase: 'Supabase',
  aws: 'AWS Cloud',
  amazon: 'Amazon Prime',
  amzn: 'Amazon',
  youtube: 'YouTube Premium',
  google: 'Google One',
  apple: 'Apple Services',
  icloud: 'iCloud+',
  disney: 'Disney+',
  hulu: 'Hulu',
  hbo: 'Max (HBO)',
  adobe: 'Adobe Creative Cloud',
  slack: 'Slack',
  zoom: 'Zoom',
  loom: 'Loom',
  dropbox: 'Dropbox',
  nytimes: 'NYTimes',
  medium: 'Medium',
  substack: 'Substack',
  strava: 'Strava',
  gym: 'Gym Membership',
  planetfitness: 'Planet Fitness',
  equinox: 'Equinox',
  whoop: 'Whoop',
  oura: 'Oura Ring',
  audible: 'Audible',
  playstation: 'PlayStation Plus',
  xbox: 'Xbox Game Pass',
  nintendo: 'Nintendo Switch Online',
  '1password': '1Password',
  bitwarden: 'Bitwarden',
  proton: 'Proton Mail',
  uber: 'Uber',
  lyft: 'Lyft',
  doordash: 'DoorDash',
};

// Common payment processor noise prefixes and tokens
const PROCESSOR_NOISE_PATTERNS = [
  /^(POS\s+)?(DEBIT|PURCHASE|WITHDRAWAL)\s+/i,
  /^CARD\s+PURCHASE\s+/i,
  /^RECURRING\s+(PAYMENT|DEBIT|CHARGE)?\s+/i,
  /^ACH\s+(DEBIT|PAYMENT|WITHDRAWAL)?\s+/i,
  /^DIRECT\s+DEBIT\s+/i,
  /^CHECKCARD\s+\d*\s*/i,
  /^PAYPAL\s*[*_\-]\s*/i,
  /^SQ\s*[*_\-]\s*/i,
  /^TST\s*[*_\-]\s*/i,
  /^UPI\s*[/_\-]\s*/i,
  /^APPLE\.COM\/BILL\s*/i,
  /^GOOGLE\s*[*_\-]\s*/i,
  /^AMZN\s+(MKTP|DIGITAL|RETAIL)\s*(US|UK|CA|DE)?\s*[*_\-]?\s*/i,
];

/**
 * 1. Deterministic Normalization Pipeline
 * Cleans bank descriptor noise while preserving original identity
 */
export function normalizeMerchantDescriptor(rawDesc: string): NormalizedDescriptorResult {
  if (!rawDesc || typeof rawDesc !== 'string') {
    return { raw: '', normalized: '', canonical: 'Unknown Service', tokens: [] };
  }

  const raw = rawDesc.trim();

  // 1. Unicode normalization (NFKC) & lowercase
  let text = raw.normalize('NFKC').toLowerCase();

  // 2. Remove common bank & payment processor noise prefixes
  for (const pattern of PROCESSOR_NOISE_PATTERNS) {
    text = text.replace(pattern, '');
  }

  // 3. Remove URLs, phone numbers, state/country codes, and reference IDs
  text = text.replace(/\b(https?:\/\/)?(www\.)?[a-z0-9-]+\.(com|io|net|org|co|app|me)\b/gi, '');
  text = text.replace(/\b\d{3}[-.\s]??\d{3}[-.\s]??\d{4}\b/g, ''); // phone numbers
  text = text.replace(/\b(ca|ny|tx|wa|de|us|usa|gb|uk|irl|nld|deu)\b/gi, ''); // region codes
  text = text.replace(/[*#_\-\\/]+\s*[a-z0-9]+/gi, ' '); // alphanumeric reference codes (e.g. *1A2B3)
  text = text.replace(/\b\d{4,}\b/g, ''); // 4+ digit reference numbers
  text = text.replace(/[^a-z0-9\s]/g, ' '); // remove punctuation
  text = text.replace(/\s{2,}/g, ' ').trim(); // collapse whitespace

  // 4. Tokenization
  const tokens = text.split(' ').filter((t) => t.length > 1);
  const normalized = tokens.join(' ') || text;

  // 5. Canonical Brand Matching
  let canonical = '';
  for (const [key, brandName] of Object.entries(CANONICAL_BRAND_DICTIONARY)) {
    if (normalized.includes(key) || tokens.includes(key)) {
      canonical = brandName;
      break;
    }
  }

  // Fallback: Title-case the first 2-3 significant tokens
  if (!canonical) {
    if (tokens.length > 0) {
      canonical = tokens
        .slice(0, 3)
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ');
    } else {
      canonical = raw.slice(0, 24);
    }
  }

  return { raw, normalized, canonical, tokens };
}

/**
 * 2. Deterministic Levenshtein Distance Scorer
 */
export function calculateLevenshteinDistance(a: string, b: string): number {
  if (a === b) return 0;
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  const matrix: number[][] = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1, // insertion
          matrix[i - 1][j] + 1 // deletion
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

/**
 * 3. Combined Similarity Scorer (Levenshtein + Token Overlap)
 * Returns a normalized score between 0.0 (unrelated) and 1.0 (exact match)
 */
export function calculateMerchantSimilarity(strA: string, strB: string): number {
  const normA = normalizeMerchantDescriptor(strA);
  const normB = normalizeMerchantDescriptor(strB);

  // Exact canonical match (e.g. both identified as "Netflix")
  if (normA.canonical && normA.canonical === normB.canonical) {
    return 1.0;
  }

  // Exact normalized string match
  if (normA.normalized === normB.normalized) {
    return 1.0;
  }

  // Jaccard Token Overlap (Intersection / Union)
  const setA = new Set(normA.tokens);
  const setB = new Set(normB.tokens);

  if (setA.size === 0 || setB.size === 0) return 0;

  const intersection = new Set([...setA].filter((x) => setB.has(x)));
  const union = new Set([...setA, ...setB]);
  const tokenJaccardScore = intersection.size / union.size;

  // Normalized Levenshtein similarity on normalized descriptors
  const maxLen = Math.max(normA.normalized.length, normB.normalized.length);
  const editDist = calculateLevenshteinDistance(normA.normalized, normB.normalized);
  const levenshteinScore = maxLen > 0 ? 1 - editDist / maxLen : 0;

  // Weighted score: 55% Token Jaccard + 45% String Levenshtein
  return Math.round((tokenJaccardScore * 0.55 + levenshteinScore * 0.45) * 100) / 100;
}

/**
 * 4. Fuzzy Clustering of Transactions
 * Clusters transactions by high-confidence merchant similarity (>= 0.78)
 */
export function clusterTransactionsBySimilarity(
  transactions: NormalizedTransaction[]
): Map<string, NormalizedTransaction[]> {
  const clusters: { canonicalName: string; transactions: NormalizedTransaction[] }[] = [];

  for (const tx of transactions) {
    const descResult = normalizeMerchantDescriptor(tx.rawDescription || tx.cleanMerchant);
    let matchedCluster: (typeof clusters)[0] | null = null;

    for (const cluster of clusters) {
      // 1. Direct Canonical Brand Match
      if (
        descResult.canonical &&
        cluster.canonicalName.toLowerCase() === descResult.canonical.toLowerCase()
      ) {
        matchedCluster = cluster;
        break;
      }

      // 2. High-Confidence Fuzzy Similarity Check
      const score = calculateMerchantSimilarity(cluster.canonicalName, descResult.normalized);
      if (score >= 0.78) {
        matchedCluster = cluster;
        break;
      }
    }

    if (matchedCluster) {
      matchedCluster.transactions.push({
        ...tx,
        cleanMerchant: matchedCluster.canonicalName,
      });
    } else {
      clusters.push({
        canonicalName: descResult.canonical,
        transactions: [
          {
            ...tx,
            cleanMerchant: descResult.canonical,
          },
        ],
      });
    }
  }

  // Convert to Map format expected by recurring detector
  const resultMap = new Map<string, NormalizedTransaction[]>();
  for (const cluster of clusters) {
    resultMap.set(cluster.canonicalName.toLowerCase(), cluster.transactions);
  }

  return resultMap;
}
