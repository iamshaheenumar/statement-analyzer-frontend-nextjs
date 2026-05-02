import type { PageContent, ParseResult } from '../pdf/types';
import { normalizeDate, normalizeTransactions, summarizeTransactions, detectCurrency } from '../pdf/utils';

export type ParserConfigData = {
  bankName: string;
  cardType: 'credit' | 'debit';
  currency?: string;
  keywords: string[];
  keywordsPage?: number;
  // Card variant string used for tier-1 detection matching (e.g. "titanium credit card")
  cardVariant?: string;
  // Supports ranked fallback arrays — parser tries each in order until one matches
  rowPattern: string | string[];
  // When set, lines are accumulated into a block (joined with space) starting from each match before rowPattern is applied
  transactionStartPattern?: string;
  groups: {
    date: number;
    description: number;
    amount: number;
    creditFlag?: number;
  };
  dateFormat: string;
  creditKeywords?: string[];
  creditFlag?: string;
  periodFrom?: string | string[];
  periodTo?: string | string[];
  dueDatePattern?: string | string[];
  columnHeaders?: string[];
  // Summary field extraction patterns (group 1 captures the value)
  issuedDatePattern?: string | string[];
  cardVariantPattern?: string | string[];
  creditLimitPattern?: string | string[];
  availableCreditPattern?: string | string[];
  minPaymentPattern?: string | string[];
  totalOutstandingPattern?: string | string[];
  totalAmountDuePattern?: string | string[];
  // Line-window search: positive = scan N lines forward, negative = scan N lines backward.
  // When set, the pattern acts as a label anchor and the value is extracted from nearby lines.
  periodFromWindow?: number;
  periodToWindow?: number;
  dueDateWindow?: number;
  issuedDateWindow?: number;
  cardVariantWindow?: number;
  creditLimitWindow?: number;
  availableCreditWindow?: number;
  minPaymentWindow?: number;
  totalOutstandingWindow?: number;
  totalAmountDueWindow?: number;
  // Metadata stored by multi-sample wizard (not used in parsing)
  _meta?: { confidence: Record<string, number>; sampleCount: number };
};

function extractNumber(line: string, re: RegExp): number | null {
  const m = line.match(re);
  if (!m?.[1]) return null;
  const n = parseFloat(m[1].replace(/,/g, ''));
  return isNaN(n) ? null : n;
}

function extractText(line: string, re: RegExp): string | null {
  const m = line.match(re);
  return m?.[1]?.trim() || null;
}

function extractFirstNumber(line: string): number | null {
  const m = line.match(/([\d,]+\.?\d*)/);
  if (!m) return null;
  const n = parseFloat(m[1].replace(/,/g, ''));
  return isNaN(n) ? null : n;
}

function extractFirstDate(line: string): string | null {
  const m = line.match(/(\d{1,2}[/\-.]\d{1,2}[/\-.]\d{2,4}|\d{4}[/\-.]\d{1,2}[/\-.]\d{1,2})/);
  return m?.[1] ?? null;
}

function scanWindow(
  lines: string[], i: number, window: number,
  extract: (l: string) => number | string | null
): number | string | null {
  const step = window > 0 ? 1 : -1;
  const limit = Math.abs(window);
  for (let k = 1; k <= limit; k++) {
    const idx = i + step * k;
    if (idx < 0 || idx >= lines.length) break;
    const val = extract(lines[idx]);
    if (val !== null) return val;
  }
  return null;
}

function compilePatterns(p: string | string[] | undefined, flags?: string): RegExp[] {
  if (!p) return [];
  return (Array.isArray(p) ? p : [p]).flatMap(src => {
    try { return [new RegExp(src, flags)]; } catch { return []; }
  });
}

function firstMatch(line: string, regexes: RegExp[]): RegExpMatchArray | null {
  for (const re of regexes) {
    const m = line.match(re);
    if (m) return m;
  }
  return null;
}

export function parseWithConfig(pages: PageContent[], config: ParserConfigData): ParseResult {
  const transactions = [];
  const rawRows: string[][] = [];

  let statementFrom: string | null = null;
  let statementTo: string | null = null;
  let statementDueDate: string | null = null;
  let issuedDate: string | null = null;
  let cardVariant: string | null = null;
  let creditLimit: number | null = null;
  let availableCredit: number | null = null;
  let minPaymentDue: number | null = null;
  let totalOutstanding: number | null = null;
  let totalAmountDue: number | null = null;

  const fallbackCurrency = config.currency || 'AED';

  const rowRegexes = compilePatterns(config.rowPattern);
  const fromRegexes = compilePatterns(config.periodFrom, 'i');
  const toRegexes = compilePatterns(config.periodTo, 'i');
  const dueDateRegexes = compilePatterns(config.dueDatePattern, 'i');
  const issuedDateRegexes = compilePatterns(config.issuedDatePattern, 'i');

  const cardVariantRegexes = compilePatterns(config.cardVariantPattern, 'i');
  const creditLimitRegexes = compilePatterns(config.creditLimitPattern, 'i');
  const availableCreditRegexes = compilePatterns(config.availableCreditPattern, 'i');
  const minPaymentRegexes = compilePatterns(config.minPaymentPattern, 'i');
  const totalOutstandingRegexes = compilePatterns(config.totalOutstandingPattern, 'i');
  const totalAmountDueRegexes = compilePatterns(config.totalAmountDuePattern, 'i');

  if (rowRegexes.length === 0) {
    return {
      bank: config.bankName,
      card_type: config.cardType,
      currency: fallbackCurrency,
      from_date: null,
      to_date: null,
      summary: { record_count: 0, total_debit: 0, total_credit: 0, net_change: 0, currency: fallbackCurrency },
      transactions: [],
    };
  }

  const emitMatch = (m: RegExpMatchArray) => {
    const g = config.groups;
    const rawDate = m[g.date] || '';
    const desc = (m[g.description] || '').trim();
    const amtStr = (m[g.amount] || '').replace(/,/g, '');
    const flagStr = g.creditFlag !== undefined ? (m[g.creditFlag] || '') : '';
    const date = normalizeDate(rawDate, config.dateFormat) || rawDate;
    const amount = parseFloat(amtStr) || 0;
    const isCredit =
      (config.creditFlag && flagStr.trim().toUpperCase().includes(config.creditFlag.toUpperCase())) ||
      (config.creditKeywords || []).some(k => desc.toLowerCase().includes(k.toLowerCase()));
    transactions.push({ transaction_date: date, description: desc, debit: isCredit ? 0 : amount, credit: isCredit ? amount : 0, amount });
    rawRows.push(Array.from(m).slice(1).map(v => v ?? ''));
  };

  let startRe: RegExp | null = null;
  if (config.transactionStartPattern) {
    try { startRe = new RegExp(config.transactionStartPattern); } catch { /* invalid regex — fall back to single-line mode */ }
  }
  let mlBuffer: string[] = [];
  let mlEmitted = false;

  const tryEmitBuffer = () => {
    if (mlEmitted || mlBuffer.length === 0) return;
    const m = firstMatch(mlBuffer.join(' '), rowRegexes);
    if (m) { emitMatch(m); mlEmitted = true; }
  };

  for (const { lines } of pages) {
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      if (fromRegexes.length && !statementFrom) {
        const m = firstMatch(line, fromRegexes);
        if (m?.[1]) {
          statementFrom = normalizeDate(m[1], config.dateFormat) || m[1];
        } else if (config.periodFromWindow && fromRegexes.some(re => re.test(line))) {
          const raw = scanWindow(lines, i, config.periodFromWindow, extractFirstDate) as string | null;
          if (raw) statementFrom = normalizeDate(raw, config.dateFormat) || raw;
        }
      }
      if (toRegexes.length && !statementTo) {
        const m = firstMatch(line, toRegexes);
        if (m?.[1]) {
          statementTo = normalizeDate(m[1], config.dateFormat) || m[1];
        } else if (config.periodToWindow && toRegexes.some(re => re.test(line))) {
          const raw = scanWindow(lines, i, config.periodToWindow, extractFirstDate) as string | null;
          if (raw) statementTo = normalizeDate(raw, config.dateFormat) || raw;
        }
      }
      if (dueDateRegexes.length && !statementDueDate) {
        const m = firstMatch(line, dueDateRegexes);
        if (m?.[1]) {
          statementDueDate = normalizeDate(m[1], config.dateFormat) || m[1];
        } else if (config.dueDateWindow && dueDateRegexes.some(re => re.test(line))) {
          const raw = scanWindow(lines, i, config.dueDateWindow, extractFirstDate) as string | null;
          if (raw) statementDueDate = normalizeDate(raw, config.dateFormat) || raw;
        }
      }
      if (issuedDateRegexes.length && !issuedDate) {
        const m = firstMatch(line, issuedDateRegexes);
        if (m?.[1]) {
          issuedDate = normalizeDate(m[1], config.dateFormat) || m[1];
        } else if (config.issuedDateWindow && issuedDateRegexes.some(re => re.test(line))) {
          const raw = scanWindow(lines, i, config.issuedDateWindow, extractFirstDate) as string | null;
          if (raw) issuedDate = normalizeDate(raw, config.dateFormat) || raw;
        }
      }
      if (cardVariantRegexes.length && !cardVariant) {
        const m = firstMatch(line, cardVariantRegexes);
        if (m?.[1]) cardVariant = m[1].trim();
        if (!cardVariant && config.cardVariantWindow && cardVariantRegexes.some(re => re.test(line))) {
          cardVariant = scanWindow(lines, i, config.cardVariantWindow, l => l.trim() || null) as string | null;
        }
      }
      if (creditLimitRegexes.length && creditLimit === null) {
        const m = firstMatch(line, creditLimitRegexes);
        if (m?.[1]) { const n = parseFloat(m[1].replace(/,/g, '')); if (!isNaN(n)) creditLimit = n; }
        if (creditLimit === null && config.creditLimitWindow && creditLimitRegexes.some(re => re.test(line))) {
          creditLimit = scanWindow(lines, i, config.creditLimitWindow, extractFirstNumber) as number | null;
        }
      }
      if (availableCreditRegexes.length && availableCredit === null) {
        const m = firstMatch(line, availableCreditRegexes);
        if (m?.[1]) { const n = parseFloat(m[1].replace(/,/g, '')); if (!isNaN(n)) availableCredit = n; }
        if (availableCredit === null && config.availableCreditWindow && availableCreditRegexes.some(re => re.test(line))) {
          availableCredit = scanWindow(lines, i, config.availableCreditWindow, extractFirstNumber) as number | null;
        }
      }
      if (minPaymentRegexes.length && minPaymentDue === null) {
        const m = firstMatch(line, minPaymentRegexes);
        if (m?.[1]) { const n = parseFloat(m[1].replace(/,/g, '')); if (!isNaN(n)) minPaymentDue = n; }
        if (minPaymentDue === null && config.minPaymentWindow && minPaymentRegexes.some(re => re.test(line))) {
          minPaymentDue = scanWindow(lines, i, config.minPaymentWindow, extractFirstNumber) as number | null;
        }
      }
      if (totalOutstandingRegexes.length && totalOutstanding === null) {
        const m = firstMatch(line, totalOutstandingRegexes);
        if (m?.[1]) { const n = parseFloat(m[1].replace(/,/g, '')); if (!isNaN(n)) totalOutstanding = n; }
        if (totalOutstanding === null && config.totalOutstandingWindow && totalOutstandingRegexes.some(re => re.test(line))) {
          totalOutstanding = scanWindow(lines, i, config.totalOutstandingWindow, extractFirstNumber) as number | null;
        }
      }
      if (totalAmountDueRegexes.length && totalAmountDue === null) {
        const m = firstMatch(line, totalAmountDueRegexes);
        if (m?.[1]) { const n = parseFloat(m[1].replace(/,/g, '')); if (!isNaN(n)) totalAmountDue = n; }
        if (totalAmountDue === null && config.totalAmountDueWindow && totalAmountDueRegexes.some(re => re.test(line))) {
          totalAmountDue = scanWindow(lines, i, config.totalAmountDueWindow, extractFirstNumber) as number | null;
        }
      }

      if (startRe) {
        if (startRe.test(line)) {
          tryEmitBuffer();
          mlBuffer = [line];
          mlEmitted = false;
        } else {
          mlBuffer.push(line);
        }
        tryEmitBuffer();
      } else {
        const m = firstMatch(line, rowRegexes);
        if (m) emitMatch(m);
      }
    }
  }

  if (startRe) tryEmitBuffer();

  const allText = pages.map(p => p.text).join('\n');
  const currency = config.currency || detectCurrency(allText);
  const normalized = normalizeTransactions(transactions, config.bankName, config.cardType, currency);

  return {
    bank: config.bankName,
    card_type: config.cardType,
    currency,
    from_date: statementFrom,
    to_date: statementTo,
    issued_date: issuedDate,
    due_date: statementDueDate,
    card_variant: cardVariant,
    ...(config.cardType === 'credit' ? {
      credit_limit: creditLimit,
      available_credit: availableCredit,
    } : {}),
    min_payment_due: minPaymentDue,
    total_outstanding: totalOutstanding,
    total_amount_due: totalAmountDue,
    summary: summarizeTransactions(normalized, currency),
    transactions: normalized,
    ...(config.columnHeaders?.length ? { originalHeaders: config.columnHeaders, rawRows } : {}),
  };
}
