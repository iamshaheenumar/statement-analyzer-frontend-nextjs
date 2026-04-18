import type { PageContent, ParseResult, Transaction } from '../pdf/types';
import { normalizeTransactions, summarizeTransactions, detectCurrency } from '../pdf/utils';

const BANK_NAME = 'CBD';
const CARD_TYPE = 'credit' as const;

// Maps ISO 3166-1 alpha-2 country codes to their primary currency
const COUNTRY_TO_CURRENCY: Record<string, string> = {
  AE: 'AED', US: 'USD', GB: 'GBP', EU: 'EUR', IN: 'INR',
  CA: 'CAD', AU: 'AUD', SG: 'SGD', SA: 'SAR', QA: 'QAR',
  KW: 'KWD', BH: 'BHD', OM: 'OMR', JP: 'JPY', CN: 'CNY',
  HK: 'HKD', MY: 'MYR', TH: 'THB', TR: 'TRY', ZA: 'ZAR',
  NZ: 'NZD', CH: 'CHF', SE: 'SEK', NO: 'NOK', DK: 'DKK',
  PK: 'PKR', LK: 'LKR', BD: 'BDT', NP: 'NPR', PH: 'PHP',
  ID: 'IDR', VN: 'VND', KR: 'KRW', TW: 'TWD', MX: 'MXN',
  BR: 'BRL', EG: 'EGP', NG: 'NGN', KE: 'KES', GH: 'GHS',
};

// DD-MM-YYYY → YYYY-MM-DD
function parseCbdDate(s: string): string {
  const m = s.match(/^(\d{2})-(\d{2})-(\d{4})$/);
  return m ? `${m[3]}-${m[2]}-${m[1]}` : '';
}

// DD-MM-YYYY  DD-MM-YYYY  DESCRIPTION  [optional: CC]  [[ FX_AMT]]  AMOUNT  [CR]
const ROW_PATTERN =
  /^(\d{2}-\d{2}-\d{4})\s+(\d{2}-\d{2}-\d{4})\s+(.+?)\s+(?:([A-Z]{2,3})\s+)?(?:\[\s*([\d,]+\.\d{2})\]\s+)?(\d{1,3}(?:,\d{3})*\.\d{2})(\s+CR)?$/;

export function parseCbd(pages: PageContent[]): ParseResult {
  const transactions: Partial<Transaction>[] = [];
  let statementFrom: string | null = null;
  let statementTo: string | null = null;

  for (const { lines } of pages) {
    for (const line of lines) {
      // Statement period: "From: 2026-03-09" / "To: 2026-04-08"
      const fromMatch = line.match(/From:\s*(\d{4}-\d{2}-\d{2})/);
      if (fromMatch) { statementFrom = fromMatch[1]; continue; }

      const toMatch = line.match(/To:\s*(\d{4}-\d{2}-\d{2})/);
      if (toMatch) { statementTo = toMatch[1]; continue; }

      const m = line.match(ROW_PATTERN);
      if (!m) continue;

      const [, txnDateRaw, , desc, ccCode, fxAmtStr, aedAmtStr, crFlag] = m;
      const txnDate = parseCbdDate(txnDateRaw);
      const amount = parseFloat(aedAmtStr.replace(/,/g, ''));
      const isCredit = !!crFlag;

      const tx: Partial<Transaction> = {
        transaction_date: txnDate,
        description: desc.trim(),
        debit: isCredit ? 0 : amount,
        credit: isCredit ? amount : 0,
        amount,
      };

      if (fxAmtStr) {
        tx.fx_amount = parseFloat(fxAmtStr.replace(/,/g, ''));
        // Resolve currency: prefer 3-letter code directly, else map 2-letter country code
        if (ccCode) {
          tx.fx_currency = ccCode.length === 3
            ? ccCode
            : (COUNTRY_TO_CURRENCY[ccCode] ?? undefined);
        }
      }

      transactions.push(tx);
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
