import type { PageContent, ParseResult, Transaction } from '../pdf/types';
import { normalizeDate, normalizeTransactions, summarizeTransactions } from '../pdf/utils';

const BANK_NAME = 'ENBD';
const CARD_TYPE = 'debit' as const;

const CREDIT_HINTS = new Set([
  'salary', 'credit', 'inward', 'uaefts', 'refund', 'reversal',
  'ipp customer credit', 'sdm deposit', 'deposit', 'tt ref', 'customer credit',
]);

// Transaction date line: DDMONYY optionally followed by a description fragment.
const DATE_RE = /^(\d{2}[A-Z]{3}\d{2})(?:\s+(.*))?$/;

// Line containing both the transaction amount and the running balance (ends with "Cr").
const AMOUNT_TAIL_RE = /(?<!\S)([\d,]+\.\d{2})(?:\s+)([\d,]+\.\d{2})\s*Cr\b/i;

// Line containing only a "Cr" balance (no separate amount).
const BALANCE_ONLY_CR_RE = /(?<!\S)([\d,]+\.\d{2})\s*Cr\b/i;

// Explicit "From DD/MM/YYYY To DD/MM/YYYY" in one line.
const STATEMENT_PERIOD_RE = /[Ff]rom\s*(\d{2}\/\d{2}\/\s*\d{4})\s*[Tt]o\s*(\d{2}\/\d{2}\/\d{4})/i;

// Any DD/MM/YYYY or DD/MM/YY token.
const DATE_FINDER = /(\d{1,2}\s*\/\s*\d{1,2}\s*\/\s*\d{2,4})/g;

function cleanAmount(s: string | null | undefined): number {
  if (!s) return 0;
  const v = s.replace(/,/g, '').replace(/Cr/gi, '').trim();
  return v === '' || v === '-' ? 0 : parseFloat(v) || 0;
}

function looksCredit(desc: string): boolean {
  const d = desc.toLowerCase();
  if (d.includes('credit card payment')) return false;
  return [...CREDIT_HINTS].some(k => d.includes(k));
}

type PartialTx = Partial<Transaction> & { balance?: number };

export function parseEnbd(pages: PageContent[]): ParseResult {
  const transactions: PartialTx[] = [];
  let lastBalance: number | null = null;
  let statementFrom: string | null = null;
  let statementTo: string | null = null;
  let current: PartialTx | null = null;

  for (const { lines } of pages) {
    for (let idx = 0; idx < lines.length; idx++) {
      const line = lines[idx].trim();
      if (!line) continue;

      const low = line.toLowerCase();

      // Opening balance — seed the running-balance comparison.
      if (low.includes('brought forward')) {
        const mBal = line.match(/(?<!\S)([\d,]+\.\d{2})\s*Cr/i);
        if (mBal) lastBalance = cleanAmount(mBal[1]);
        continue;
      }

      // Statement period header — look ahead up to 3 lines for date pairs.
      if (low.includes('statement period') || low.includes('statement details')) {
        const searchLines = lines.slice(idx, idx + 3).filter(Boolean);
        const found = searchLines.flatMap(sl => [...sl.matchAll(DATE_FINDER)].map(m => m[1]));

        if (found.length >= 2) {
          statementFrom = normalizeDate(found[0].replace(/\s/g, ''), '%d/%m/%Y');
          statementTo = normalizeDate(found[1].replace(/\s/g, ''), '%d/%m/%Y');
        } else {
          for (const sl of searchLines) {
            const m = STATEMENT_PERIOD_RE.exec(sl);
            if (m) {
              statementFrom = normalizeDate(m[1].replace(/\s/g, ''), '%d/%m/%Y');
              statementTo = normalizeDate(m[2], '%d/%m/%Y');
              break;
            }
          }
        }
        continue;
      }

      // New transaction row — starts with a DDMONYY date token.
      const mDate = DATE_RE.exec(line);
      if (mDate) {
        if (current && current.balance !== undefined) transactions.push(current);
        current = {
          transaction_date: normalizeDate(mDate[1], '%d%b%y'),
          description: (mDate[2] ?? '').trim(),
          debit: 0,
          credit: 0,
          amount: 0,
          balance: undefined,
        };
        continue;
      }

      if (current) {
        // Amount + balance on the same line (both ending in "Cr").
        const mTail = AMOUNT_TAIL_RE.exec(line);
        if (mTail) {
          const amtVal = cleanAmount(mTail[1]);
          const balVal = cleanAmount(mTail[2]);
          current.amount = amtVal;
          current.balance = balVal;

          if (lastBalance !== null) {
            if (balVal > lastBalance) current.credit = amtVal;
            else if (balVal < lastBalance) current.debit = amtVal;
            else looksCredit(current.description ?? '')
              ? (current.credit = amtVal)
              : (current.debit = amtVal);
          } else {
            looksCredit(current.description ?? '')
              ? (current.credit = amtVal)
              : (current.debit = amtVal);
          }

          lastBalance = balVal;
          transactions.push(current);
          current = null;
          continue;
        }

        // Balance-only "Cr" line — no explicit amount.
        const mBal = BALANCE_ONLY_CR_RE.exec(line);
        if (mBal) {
          const balVal = cleanAmount(mBal[1]);
          current.balance = balVal;
          lastBalance = balVal;
          transactions.push(current);
          current = null;
          continue;
        }

        if (low.includes('brought forward') || low.includes('carried forward')) continue;

        // Continuation of the description.
        current.description = current.description
          ? `${current.description} ${line}`
          : line;
      }
    }

    // Flush any pending transaction at the end of each page.
    if (current && current.balance !== undefined) {
      transactions.push(current);
      current = null;
    }
  }

  const clean = transactions.filter(
    t =>
      t.transaction_date &&
      t.description &&
      !['brought forward', 'carried forward'].some(x =>
        t.description!.toLowerCase().includes(x),
      ),
  );

  const normalized = normalizeTransactions(clean, BANK_NAME, CARD_TYPE);
  return {
    bank: BANK_NAME,
    card_type: CARD_TYPE,
    from_date: statementFrom,
    to_date: statementTo,
    summary: summarizeTransactions(normalized),
    transactions: normalized,
  };
}
