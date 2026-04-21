export type BaseTransaction = {
  transaction_date: string | Date | null;
  description: string | null;
  debit: number | null;
  credit: number | null;
  amount: number | null;
  bank: string | null;
  currency?: string | null;
  fx_currency?: string | null;
  fx_amount?: number | null;
  fx_rate?: number | null;
};

export type Transaction = BaseTransaction;
export type TransactionWithId = BaseTransaction & { id: string };

export type StatementSummary = {
  record_count: number;
  total_debit: number;
  total_credit: number;
  net_change: number;
  currency?: string;
};

export type BaseStatement = {
  bank: string;
  card_type?: string | null;
  card_variant?: string | null;
  currency?: string | null;
  from_date: Date | null;
  to_date: Date | null;
  issued_date?: Date | string | null;
  due_date?: Date | string | null;
  credit_limit?: number | null;
  available_credit?: number | null;
  min_payment_due?: number | null;
  total_outstanding?: number | null;
  total_amount_due?: number | null;
};

export type Statement = BaseStatement & {
  id: string;
  created_at: Date;
  summary?: StatementSummary;
};

export type ParsedData = BaseStatement & {
  summary: StatementSummary;
  transactions: Transaction[];
  parsedBy?: 'config' | 'generic' | 'ai';
  originalHeaders?: string[];
  rawRows?: string[][];
  rawPageContent?: import('@/lib/pdf/types').PageContent[];
};

export type ParsedDataWithId = ParsedData & { id: string };
