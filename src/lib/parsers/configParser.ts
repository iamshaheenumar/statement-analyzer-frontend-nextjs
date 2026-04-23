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
  cardVariantPattern?: string;
  creditLimitPattern?: string;
  availableCreditPattern?: string;
  minPaymentPattern?: string;
  totalOutstandingPattern?: string;
  totalAmountDuePattern?: string;
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

  let cardVariantRegex: RegExp | null = null;
  let creditLimitRegex: RegExp | null = null;
  let availableCreditRegex: RegExp | null = null;
  let minPaymentRegex: RegExp | null = null;
  let totalOutstandingRegex: RegExp | null = null;
  let totalAmountDueRegex: RegExp | null = null;

  try {
    if (config.cardVariantPattern) cardVariantRegex = new RegExp(config.cardVariantPattern, 'i');
    if (config.creditLimitPattern) creditLimitRegex = new RegExp(config.creditLimitPattern, 'i');
    if (config.availableCreditPattern) availableCreditRegex = new RegExp(config.availableCreditPattern, 'i');
    if (config.minPaymentPattern) minPaymentRegex = new RegExp(config.minPaymentPattern, 'i');
    if (config.totalOutstandingPattern) totalOutstandingRegex = new RegExp(config.totalOutstandingPattern, 'i');
    if (config.totalAmountDuePattern) totalAmountDueRegex = new RegExp(config.totalAmountDuePattern, 'i');
  } catch { /* continue without broken summary patterns */ }

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

  for (const { lines } of pages) {
    for (const line of lines) {
      if (fromRegexes.length && !statementFrom) {
        const m = firstMatch(line, fromRegexes);
        if (m?.[1]) statementFrom = normalizeDate(m[1], config.dateFormat) || m[1];
      }
      if (toRegexes.length && !statementTo) {
        const m = firstMatch(line, toRegexes);
        if (m?.[1]) statementTo = normalizeDate(m[1], config.dateFormat) || m[1];
      }
      if (dueDateRegexes.length && !statementDueDate) {
        const m = firstMatch(line, dueDateRegexes);
        if (m?.[1]) statementDueDate = normalizeDate(m[1], config.dateFormat) || m[1];
      }
      if (issuedDateRegexes.length && !issuedDate) {
        const m = firstMatch(line, issuedDateRegexes);
        if (m?.[1]) issuedDate = normalizeDate(m[1], config.dateFormat) || m[1];
      }
      if (cardVariantRegex && !cardVariant) {
        cardVariant = extractText(line, cardVariantRegex);
      }
      if (creditLimitRegex && creditLimit === null) {
        creditLimit = extractNumber(line, creditLimitRegex);
      }
      if (availableCreditRegex && availableCredit === null) {
        availableCredit = extractNumber(line, availableCreditRegex);
      }
      if (minPaymentRegex && minPaymentDue === null) {
        minPaymentDue = extractNumber(line, minPaymentRegex);
      }
      if (totalOutstandingRegex && totalOutstanding === null) {
        totalOutstanding = extractNumber(line, totalOutstandingRegex);
      }
      if (totalAmountDueRegex && totalAmountDue === null) {
        totalAmountDue = extractNumber(line, totalAmountDueRegex);
      }

      const m = firstMatch(line, rowRegexes);
      if (!m) continue;

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
    }
  }

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
