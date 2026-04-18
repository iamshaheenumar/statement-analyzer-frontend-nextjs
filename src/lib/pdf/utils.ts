import type { Transaction, StatementSummary } from './types';

const MONTHS: Record<string, number> = {
  JAN: 1, FEB: 2, MAR: 3, APR: 4, MAY: 5, JUN: 6,
  JUL: 7, AUG: 8, SEP: 9, OCT: 10, NOV: 11, DEC: 12,
  JANUARY: 1, FEBRUARY: 2, MARCH: 3, APRIL: 4, JUNE: 6,
  JULY: 7, AUGUST: 8, SEPTEMBER: 9, OCTOBER: 10, NOVEMBER: 11, DECEMBER: 12,
};

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

function toIso(day: number, month: number, year: number): string {
  return `${year}-${pad(month)}-${pad(day)}`;
}

/**
 * Normalise a raw date string to ISO YYYY-MM-DD.
 *
 * fmt mirrors Python strptime tokens: %d, %m, %Y, %y, %b.
 * When fmt is omitted a set of fallback patterns is tried in order.
 * Returns '' when parsing fails.
 */
export function normalizeDate(rawDate: string, fmt?: string): string {
  if (!rawDate) return '';

  // Mirror the Python pre-processing: strip, uppercase, remove dots/commas.
  const raw = rawDate.trim().toUpperCase().replace(/\./g, '').replace(/,/g, '');
  const currentYear = new Date().getFullYear();

  if (fmt) {
    switch (fmt) {
      case '%d/%m/%Y': {
        const m = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
        if (m) return toIso(+m[1], +m[2], +m[3]);
        break;
      }
      case '%d/%m/%y': {
        const m = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2})$/);
        if (m) return toIso(+m[1], +m[2], 2000 + +m[3]);
        break;
      }
      case '%d/%m': {
        const m = raw.match(/^(\d{1,2})\/(\d{1,2})$/);
        if (m) return toIso(+m[1], +m[2], currentYear);
        break;
      }
      case '%d %b %Y': {
        const m = raw.match(/^(\d{1,2}) ([A-Z]+) (\d{4})$/);
        if (m && MONTHS[m[2]]) return toIso(+m[1], MONTHS[m[2]], +m[3]);
        break;
      }
      case '%d %b': {
        const m = raw.match(/^(\d{1,2}) ([A-Z]+)$/);
        if (m && MONTHS[m[2]]) return toIso(+m[1], MONTHS[m[2]], currentYear);
        break;
      }
      case '%d%b%y': {
        const m = raw.match(/^(\d{1,2})([A-Z]+)(\d{2})$/);
        if (m && MONTHS[m[2]]) return toIso(+m[1], MONTHS[m[2]], 2000 + +m[3]);
        break;
      }
      case '%d%b%Y': {
        const m = raw.match(/^(\d{1,2})([A-Z]+)(\d{4})$/);
        if (m && MONTHS[m[2]]) return toIso(+m[1], MONTHS[m[2]], +m[3]);
        break;
      }
    }
    return '';
  }

  // Fallback patterns (no fmt supplied)
  const fallbacks: Array<{
    re: RegExp;
    parse(m: RegExpMatchArray): { d: number; mo: number; y: number } | null;
  }> = [
    { re: /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/, parse: m => ({ d: +m[1], mo: +m[2], y: +m[3] }) },
    { re: /^(\d{1,2})\/(\d{1,2})\/(\d{2})$/, parse: m => ({ d: +m[1], mo: +m[2], y: 2000 + +m[3] }) },
    { re: /^(\d{1,2})\/(\d{1,2})$/, parse: m => ({ d: +m[1], mo: +m[2], y: currentYear }) },
    { re: /^(\d{1,2}) ([A-Z]+) (\d{4})$/, parse: m => MONTHS[m[2]] ? { d: +m[1], mo: MONTHS[m[2]], y: +m[3] } : null },
    { re: /^(\d{1,2}) ([A-Z]+)$/, parse: m => MONTHS[m[2]] ? { d: +m[1], mo: MONTHS[m[2]], y: currentYear } : null },
    { re: /^(\d{1,2})([A-Z]+)(\d{2})$/, parse: m => MONTHS[m[2]] ? { d: +m[1], mo: MONTHS[m[2]], y: 2000 + +m[3] } : null },
    { re: /^(\d{1,2})([A-Z]+)(\d{4})$/, parse: m => MONTHS[m[2]] ? { d: +m[1], mo: MONTHS[m[2]], y: +m[3] } : null },
  ];

  for (const { re, parse } of fallbacks) {
    const m = raw.match(re);
    if (m) {
      const parts = parse(m);
      if (parts) return toIso(parts.d, parts.mo, parts.y);
    }
  }

  return '';
}

/** Stamp every transaction with its bank, card_type, and settlement currency. */
export function normalizeTransactions(
  transactions: Partial<Transaction>[],
  bank: string,
  cardType: 'credit' | 'debit',
  currency = 'AED',
): Transaction[] {
  return transactions.map(tx => ({
    transaction_date: tx.transaction_date ?? '',
    description: tx.description ?? '',
    debit: tx.debit ?? 0,
    credit: tx.credit ?? 0,
    amount: tx.amount ?? 0,
    bank,
    card_type: cardType,
    currency: tx.currency ?? currency,
    ...(tx.balance !== undefined && { balance: tx.balance }),
    ...(tx.fx_currency !== undefined && { fx_currency: tx.fx_currency }),
    ...(tx.fx_amount !== undefined && { fx_amount: tx.fx_amount }),
    ...(tx.fx_rate !== undefined && { fx_rate: tx.fx_rate }),
  }));
}

export function summarizeTransactions(transactions: Transaction[], currency = 'AED'): StatementSummary {
  const total_debit = transactions.reduce((s, t) => s + t.debit, 0);
  const total_credit = transactions.reduce((s, t) => s + t.credit, 0);
  return {
    record_count: transactions.length,
    total_debit: Math.round(total_debit * 100) / 100,
    total_credit: Math.round(total_credit * 100) / 100,
    net_change: Math.round((total_credit - total_debit) * 100) / 100,
    currency,
  };
}

/**
 * Detect the base currency from raw statement text.
 * Looks for explicit "Currency: XXX" patterns. Defaults to 'AED'.
 */
export function detectCurrency(allText: string): string {
  const patterns = [
    /account\s+currency\s*:?\s*([A-Z]{3})\b/i,
    /statement\s+currency\s*:?\s*([A-Z]{3})\b/i,
    /billing\s+currency\s*:?\s*([A-Z]{3})\b/i,
    /currency\s*:?\s*([A-Z]{3})\b/i,
  ];
  for (const p of patterns) {
    const m = allText.match(p);
    if (m?.[1]) {
      const c = m[1].toUpperCase();
      if (!['THE', 'FOR', 'AND', 'ARE', 'NOT'].includes(c)) return c;
    }
  }
  return 'AED';
}
