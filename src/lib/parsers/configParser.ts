import type { PageContent, ParseResult } from '../pdf/types';
import { normalizeDate, normalizeTransactions, summarizeTransactions, detectCurrency } from '../pdf/utils';

export type ParserConfigData = {
  bankName: string;
  cardType: 'credit' | 'debit';
  currency?: string;
  keywords: string[];
  keywordsPage?: number;
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
  columnHeaders?: string[];  // Display names for each regex capture group, in group order
};

export function parseWithConfig(pages: PageContent[], config: ParserConfigData): ParseResult {
  const transactions = [];
  const rawRows: string[][] = [];
  let statementFrom: string | null = null;
  let statementTo: string | null = null;
  let statementDueDate: string | null = null;

  let rowRegex: RegExp;
  let fromRegex: RegExp | null = null;
  let toRegex: RegExp | null = null;
  let dueDateRegex: RegExp | null = null;

  try {
    rowRegex = new RegExp(config.rowPattern);
    if (config.periodFrom) fromRegex = new RegExp(config.periodFrom);
    if (config.periodTo) toRegex = new RegExp(config.periodTo);
    if (config.dueDatePattern) dueDateRegex = new RegExp(config.dueDatePattern);
  } catch {
    const fallbackCurrency = config.currency || 'AED';
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
        (config.creditKeywords || []).some(k =>
          desc.toLowerCase().includes(k.toLowerCase())
        );

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
    due_date: statementDueDate,
    summary: summarizeTransactions(normalized, currency),
    transactions: normalized,
    ...(config.columnHeaders?.length ? { originalHeaders: config.columnHeaders, rawRows } : {}),
  };
}
