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
  rowPattern: string;
  groups: {
    date: number;
    description: number;
    amount: number;
    creditFlag?: number;
  };
  dateFormat: string;
  creditKeywords?: string[];
  creditFlag?: string;
  periodFrom?: string;
  periodTo?: string;
  dueDatePattern?: string;
  columnHeaders?: string[];
  // Summary field extraction patterns (group 1 captures the value)
  issuedDatePattern?: string;
  cardVariantPattern?: string;
  creditLimitPattern?: string;
  availableCreditPattern?: string;
  minPaymentPattern?: string;
  totalOutstandingPattern?: string;
  totalAmountDuePattern?: string;
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

  let rowRegex: RegExp;
  let fromRegex: RegExp | null = null;
  let toRegex: RegExp | null = null;
  let dueDateRegex: RegExp | null = null;
  let issuedDateRegex: RegExp | null = null;
  let cardVariantRegex: RegExp | null = null;
  let creditLimitRegex: RegExp | null = null;
  let availableCreditRegex: RegExp | null = null;
  let minPaymentRegex: RegExp | null = null;
  let totalOutstandingRegex: RegExp | null = null;
  let totalAmountDueRegex: RegExp | null = null;

  const fallbackCurrency = config.currency || 'AED';

  try {
    rowRegex = new RegExp(config.rowPattern);
    if (config.periodFrom) fromRegex = new RegExp(config.periodFrom, 'i');
    if (config.periodTo) toRegex = new RegExp(config.periodTo, 'i');
    if (config.dueDatePattern) dueDateRegex = new RegExp(config.dueDatePattern, 'i');
    if (config.issuedDatePattern) issuedDateRegex = new RegExp(config.issuedDatePattern, 'i');
    if (config.cardVariantPattern) cardVariantRegex = new RegExp(config.cardVariantPattern, 'i');
    if (config.creditLimitPattern) creditLimitRegex = new RegExp(config.creditLimitPattern, 'i');
    if (config.availableCreditPattern) availableCreditRegex = new RegExp(config.availableCreditPattern, 'i');
    if (config.minPaymentPattern) minPaymentRegex = new RegExp(config.minPaymentPattern, 'i');
    if (config.totalOutstandingPattern) totalOutstandingRegex = new RegExp(config.totalOutstandingPattern, 'i');
    if (config.totalAmountDuePattern) totalAmountDueRegex = new RegExp(config.totalAmountDuePattern, 'i');
  } catch {
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
      if (fromRegex && !statementFrom) {
        const m = line.match(fromRegex);
        if (m?.[1]) statementFrom = normalizeDate(m[1], config.dateFormat) || m[1];
      }
      if (toRegex && !statementTo) {
        const m = line.match(toRegex);
        if (m?.[1]) statementTo = normalizeDate(m[1], config.dateFormat) || m[1];
      }
      if (dueDateRegex && !statementDueDate) {
        const m = line.match(dueDateRegex);
        if (m?.[1]) statementDueDate = normalizeDate(m[1], config.dateFormat) || m[1];
      }
      if (issuedDateRegex && !issuedDate) {
        const m = line.match(issuedDateRegex);
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

      const m = line.match(rowRegex);
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
