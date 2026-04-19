export interface Transaction {
  transaction_date: string; // ISO: YYYY-MM-DD
  description: string;
  debit: number;
  credit: number;
  amount: number;
  bank: string;
  card_type: 'credit' | 'debit';
  currency: string;   // settlement currency (e.g. 'AED', 'INR')
  balance?: number;
  fx_currency?: string;  // original spend currency if different
  fx_amount?: number;
  fx_rate?: number;
}

export interface StatementSummary {
  record_count: number;
  total_debit: number;
  total_credit: number;
  net_change: number;
  currency: string;
}

export interface ParseResult {
  bank: string;
  card_type: 'credit' | 'debit';
  currency: string;   // base/settlement currency of the statement
  from_date: string | null;
  to_date: string | null;
  due_date?: string | null;
  summary: StatementSummary;
  transactions: Transaction[];
}

/** One page of extracted PDF content. */
export interface PageContent {
  page: number;
  lines: string[]; // visual lines (Y-grouped, top → bottom)
  text: string;    // lines joined with '\n' — useful for full-page regex
}

export interface PreviewResult {
  pages: Array<{
    page: number;
    lines: Array<{ i: number; line: string }>;
  }>;
}
