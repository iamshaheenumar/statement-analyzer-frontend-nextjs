import type { PageContent, ParseResult, Transaction } from '../pdf/types';
import { normalizeDate, normalizeTransactions, summarizeTransactions } from '../pdf/utils';

const BANK_NAME = 'RAKBANK';
const CARD_TYPE = 'credit' as const;

const STATEMENT_PERIOD_RE =
  /(\d{1,2}\/\d{1,2}\/\d{4})\s*(?:to|TO|To)\s*(\d{1,2}\/\d{1,2}\/\d{4})/;

// Standard AED transaction: date, description, AED amount (optional CR), dash, balance (optional CR).
const AED_LINE_RE =
  /^(\d{2}\/\d{2}\/\d{4})\s+(.+?)\s+AED\s+([\d,]+\.\d{2})(?:\s*(CR|Cr))?\s+-\s+([\d,]+\.\d{2})(?:\s*(CR|Cr))?\s*$/i;

// Foreign-currency transaction: date, CCY, fx-amount, fx-rate, AED-equivalent (optional CR).
const FX_LINE_RE =
  /^(\d{2}\/\d{2}\/\d{4})\s+([A-Z]{3})\s+([\d,]+\.\d{2})\s+([\d,]+\.\d{2})\s+([\d,]+\.\d{2})(?:\s*(CR|Cr))?\s*$/i;

const SKIP_KEYWORDS = [
  'opening balance', 'closing balance', 'available credit',
  'minimum payment due', 'payment due date', 'credit limit',
];

// Lines whose accumulated buffer should be discarded before they are attached to a transaction.
const DROP_PREFIXES = [
  'your credit card statement', 'statement period',
  'product name', 'card number', 'page[',
];

function cleanAmount(val: string | null | undefined): number {
  if (!val) return 0;
  return parseFloat(val.replace(/,/g, '').replace(/CR|Cr/g, '').trim()) || 0;
}

type ExtendedTx = Partial<Transaction> & {
  fx_currency?: string;
  fx_amount?: number;
  fx_rate?: number;
};

export function parseRakbank(pages: PageContent[]): ParseResult {
  const transactions: ExtendedTx[] = [];
  let statementFrom: string | null = null;
  let statementTo: string | null = null;
  let descBuffer: string[] = [];

  for (const { lines } of pages) {
    for (const raw of lines) {
      const line = raw.trim();
      if (!line) continue;

      const low = line.toLowerCase();
      if (SKIP_KEYWORDS.some(k => low.includes(k))) continue;

      // Statement period header.
      if (low.includes('statement period')) {
        const m = STATEMENT_PERIOD_RE.exec(line);
        if (m) {
          statementFrom = normalizeDate(m[1].replace(/\s/g, ''), '%d/%m/%Y');
          statementTo = normalizeDate(m[2].replace(/\s/g, ''), '%d/%m/%Y');
        }
        continue;
      }

      // AED transaction line.
      const mAed = AED_LINE_RE.exec(line);
      if (mAed) {
        const [, date, desc, amtRaw, amtCr, , balCr] = mAed;

        if (DROP_PREFIXES.some(p => descBuffer.join(' ').toLowerCase().includes(p))) {
          descBuffer = [];
        }

        const fullDesc = [...descBuffer, desc.trim()].join(' ').trim();
        descBuffer = [];

        const amtVal = cleanAmount(amtRaw);
        const descLow = fullDesc.toLowerCase();
        const hasCr = !!amtCr || !!balCr;
        const isCredit = hasCr || descLow.includes('payment') || descLow.includes('refund');

        transactions.push({
          transaction_date: normalizeDate(date, '%d/%m/%Y'),
          description: fullDesc,
          debit: isCredit ? 0 : amtVal,
          credit: isCredit ? amtVal : 0,
          amount: amtVal,
        });
        continue;
      }

      // Foreign-currency transaction line.
      const mFx = FX_LINE_RE.exec(line);
      if (mFx) {
        const [, date, ccy, fxAmt, fxRate, aedAmt, crFlag] = mFx;

        if (DROP_PREFIXES.some(p => descBuffer.join(' ').toLowerCase().includes(p))) {
          descBuffer = [];
        }

        const fullDesc = descBuffer.join(' ').trim();
        descBuffer = [];

        const aedVal = cleanAmount(aedAmt);
        const descLow = fullDesc.toLowerCase();
        const isCredit = !!crFlag || descLow.includes('payment') || descLow.includes('refund');

        transactions.push({
          transaction_date: normalizeDate(date, '%d/%m/%Y'),
          description: fullDesc,
          debit: isCredit ? 0 : aedVal,
          credit: isCredit ? aedVal : 0,
          amount: aedVal,
          fx_currency: ccy,
          fx_amount: cleanAmount(fxAmt),
          fx_rate: cleanAmount(fxRate),
        });
        continue;
      }

      // Non-transaction line — accumulate into the description buffer.
      descBuffer.push(line);
    }
  }

  const normalized = normalizeTransactions(transactions, BANK_NAME, CARD_TYPE);
  return {
    bank: BANK_NAME,
    card_type: CARD_TYPE,
    from_date: statementFrom,
    to_date: statementTo,
    summary: summarizeTransactions(normalized),
    transactions: normalized,
  };
}
