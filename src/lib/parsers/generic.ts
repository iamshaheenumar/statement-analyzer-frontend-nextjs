import type { PageContent, ParseResult } from '../pdf/types';
import { normalizeDate, normalizeTransactions, summarizeTransactions, detectCurrency } from '../pdf/utils';

const BANK_NAME = 'unknown';
const CARD_TYPE = 'debit' as const;

/**
 * Fallback parser: passes all lines that contain at least one digit through
 * as raw transactions. Dates and amounts are not extracted reliably.
 * Provides enough structure for the response contract to be satisfied.
 */
export function parseGeneric(pages: PageContent[]): ParseResult {
  const transactions = pages
    .flatMap(p => p.lines)
    .filter(line => /\d/.test(line))
    .map(line => ({
      transaction_date: normalizeDate(line.split(/\s+/)[0] ?? ''),
      description: line,
      debit: 0,
      credit: 0,
      amount: 0,
    }));

  const allText = pages.map(p => p.text).join('\n');
  const currency = detectCurrency(allText);
  const normalized = normalizeTransactions(transactions, BANK_NAME, CARD_TYPE, currency);
  return {
    bank: BANK_NAME,
    card_type: CARD_TYPE,
    currency,
    from_date: null,
    to_date: null,
    summary: summarizeTransactions(normalized, currency),
    transactions: normalized,
  };
}
