import type { PageContent, ParseResult, Transaction } from '../pdf/types';
import { normalizeDate, normalizeTransactions, summarizeTransactions, detectCurrency } from '../pdf/utils';

const BANK_NAME = 'Mashreq';
const CARD_TYPE = 'credit' as const;

const CREDIT_KEYWORDS = [
  'inward', 'credit', 'uaefts', 'payment received', 'refund', 'reversal', 'salary',
];

/**
 * Determine debit/credit split by matching known credit-side keywords.
 * Returns [debit, credit].
 */
function classifyTransaction(desc: string, amount: number): [number, number] {
  const lower = desc.toLowerCase();
  if (CREDIT_KEYWORDS.some(k => lower.includes(k))) return [0, amount];
  return [amount, 0];
}

// Two DD/MM dates, a lazy description, then an amount (with optional comma thousands).
const ROW_PATTERN =
  /(\d{2}\/\d{2})\s+(\d{2}\/\d{2})\s+(.+?)\s+(\d{1,3}(?:,\d{3})*\.\d{2})(?:\s|-)/g;

export function parseMashreq(pages: PageContent[]): ParseResult {
  const transactions: Partial<Transaction>[] = [];
  let statementFrom: string | null = null;
  let statementTo: string | null = null;

  for (const { lines, text } of pages) {
    // Locate the statement date header to derive the billing period.
    for (const line of lines) {
      if (line.toLowerCase().includes('statement date')) {
        const m = line.match(/(\d{1,2}\s*\/\s*\d{1,2}\s*\/\s*\d{4})/);
        if (m) {
          const td = normalizeDate(m[1].replace(/\s/g, ''), '%d/%m/%Y');
          if (td) {
            try {
              const toDate = new Date(td);
              const fromDate = new Date(toDate);
              fromDate.setMonth(fromDate.getMonth() - 1);
              statementTo = td;
              statementFrom = fromDate.toISOString().slice(0, 10);
            } catch {
              // ignore invalid dates
            }
          }
        }
      }
    }

    // Scan the full page text for transaction rows via the column-aligned pattern.
    ROW_PATTERN.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = ROW_PATTERN.exec(text)) !== null) {
      const [, tDate, , desc, amountStr] = match;
      const value = parseFloat(amountStr.replace(/,/g, ''));
      const [debit, credit] = classifyTransaction(desc, value);

      let txnDate = normalizeDate(tDate, '%d/%m');
      if (txnDate) {
        const txnDt = new Date(txnDate);
        const toYear = statementTo ? parseInt(statementTo.slice(0, 4)) : new Date().getFullYear();
        const fromYear = statementFrom ? parseInt(statementFrom.slice(0, 4)) : toYear;
        txnDt.setFullYear(toYear);

        // Handle year-boundary: statement spans Dec→Jan
        if (statementTo) {
          const toMonth = parseInt(statementTo.slice(5, 7));
          if (toMonth < 6 && txnDt.getMonth() + 1 > 6) txnDt.setFullYear(fromYear);
        }

        txnDate = txnDt.toISOString().slice(0, 10);
      }

      transactions.push({ transaction_date: txnDate, description: desc.trim(), debit, credit, amount: value });
    }
  }

  const allText = pages.map(p => p.text).join('\n');
  const currency = detectCurrency(allText);
  const normalized = normalizeTransactions(transactions, BANK_NAME, CARD_TYPE, currency);
  return {
    bank: BANK_NAME,
    card_type: CARD_TYPE,
    currency,
    from_date: statementFrom,
    to_date: statementTo,
    summary: summarizeTransactions(normalized, currency),
    transactions: normalized,
  };
}
