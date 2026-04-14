import type { PageContent, ParseResult, Transaction } from '../pdf/types';
import { normalizeDate, normalizeTransactions, summarizeTransactions } from '../pdf/utils';

const BANK_NAME = 'Emirates Islamic';
const CARD_TYPE = 'credit' as const;

// Full transaction row: posting date, txn date, description, amount, optional CR flag.
const LINE_REGEX =
  /^(\d{2}\s+[A-Z]{3})\s+(\d{2}\s+[A-Z]{3})\s+(.+?)\s+([\d,]+\.\d{2})(CR)?\s*$/i;

// "From: 1st January 2025" or "To: 14 September 2025" (with optional ordinal suffix).
const FROM_TO_REGEX =
  /^\s*(From|To)\s*:?\s*(\d{1,2}(?:st|nd|rd|th)?\s+[A-Za-z]{3,9}\s+\d{4})\s*$/i;

const SKIP_KEYWORDS = [
  'opening balance', 'primary card no', 'rewards summary', 'cashback',
  'card limit', 'minimum payment due', 'payment due date',
  'profit/other charges', 'current balance', 'profit reversal', 'finance charges',
];

const ARABIC_RANGE_MAP: Record<string, 'from' | 'to'> = {
  'من': 'from',
  'الى': 'to',
  'إلى': 'to',
  'ىلإ': 'to',
};

const FULL_MONTHS: Record<string, number> = {
  JANUARY: 1, FEBRUARY: 2, MARCH: 3, APRIL: 4, MAY: 5, JUNE: 6,
  JULY: 7, AUGUST: 8, SEPTEMBER: 9, OCTOBER: 10, NOVEMBER: 11, DECEMBER: 12,
};

function cleanAmount(val: string): number {
  return parseFloat(val.replace(/,/g, '').replace(/CR/gi, '').trim()) || 0;
}

function stripOrdinal(s: string): string {
  return s.replace(/(\d+)(?:st|nd|rd|th)/gi, '$1').trim();
}

/** Parse "15 January 2025" or "15 Jan 2025" (with possible ordinal) → ISO date. */
function parseFullDate(s: string): string | null {
  const cleaned = stripOrdinal(s.trim());
  const m = cleaned.match(/^(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})$/);
  if (!m) return null;

  const day = +m[1];
  const year = +m[3];
  const monStr = m[2].toUpperCase();

  // Try abbreviated month first, then full month name.
  const result = normalizeDate(`${m[1]} ${monStr} ${m[3]}`, '%d %b %Y');
  if (result) return result;

  const mon = FULL_MONTHS[monStr];
  if (!mon) return null;

  return `${year}-${String(mon).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function normalizeRangeToken(raw: string): 'from' | 'to' | null {
  const token = raw.trim().replace(/:$/, '').toLowerCase();
  if (token === 'from') return 'from';
  if (token === 'to') return 'to';
  return ARABIC_RANGE_MAP[raw.trim()] ?? null;
}

export function parseEmiratesIslamic(pages: PageContent[]): ParseResult {
  const transactions: Partial<Transaction>[] = [];
  let statementFrom: string | null = null;
  let statementTo: string | null = null;
  let pendingRange: 'from' | 'to' | null = null;

  for (const { lines } of pages) {
    for (const raw of lines) {
      const line = raw.trim();
      if (!line) continue;

      const low = line.toLowerCase();
      if (SKIP_KEYWORDS.some(k => low.includes(k))) continue;

      // "From: 1st January 2025" — date on the same line.
      const mRange = FROM_TO_REGEX.exec(line);
      if (mRange) {
        const parsed = parseFullDate(mRange[2]);
        if (parsed) {
          mRange[1].toLowerCase() === 'from'
            ? (statementFrom = parsed)
            : (statementTo = parsed);
        }
        pendingRange = null;
        continue;
      }

      // Standalone "From" / "To" / Arabic equivalent — date follows on next line.
      const rangeToken = normalizeRangeToken(line);
      if (rangeToken) {
        if (rangeToken === 'from' && statementFrom) continue;
        if (rangeToken === 'to' && statementTo) continue;
        pendingRange = rangeToken;
        continue;
      }

      // The line following a pending range token should be the date.
      if (pendingRange) {
        const parsed = parseFullDate(line);
        if (parsed) {
          pendingRange === 'from' ? (statementFrom = parsed) : (statementTo = parsed);
          pendingRange = null;
          continue;
        }
      }

      // Transaction row.
      const m = LINE_REGEX.exec(line);
      if (!m) continue;

      const [, , txnDateRaw, desc, amtRaw, cr] = m;
      const amtVal = cleanAmount(amtRaw);
      const isCredit = !!cr || desc.toLowerCase().includes('payment received');

      let txnDate = normalizeDate(txnDateRaw.trim(), '%d %b');
      if (txnDate && statementFrom && statementTo) {
        const toYear = parseInt(statementTo.slice(0, 4));
        const fromYear = parseInt(statementFrom.slice(0, 4));
        const txnDt = new Date(txnDate);
        txnDt.setFullYear(toYear);

        // Handle year-boundary crossing (e.g. statement ends in Jan, txn is in Dec).
        const toMonth = parseInt(statementTo.slice(5, 7));
        if (toMonth < 6 && txnDt.getMonth() + 1 > 6) txnDt.setFullYear(fromYear);

        txnDate = txnDt.toISOString().slice(0, 10);
      }

      transactions.push({
        transaction_date: txnDate,
        description: desc.trim(),
        debit: isCredit ? 0 : amtVal,
        credit: isCredit ? amtVal : 0,
        amount: amtVal,
      });
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
