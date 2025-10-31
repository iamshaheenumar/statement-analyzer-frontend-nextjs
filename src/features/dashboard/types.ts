export type BaseTransaction = {
  transaction_date: string | Date | null;
  description: string | null;
  debit: number | null;
  credit: number | null;
  amount: number | null;
  bank: string | null;
};

export type Transaction = BaseTransaction;
export type TransactionWithId = BaseTransaction & { id: string };

export type StatementSummary = {
  record_count: number;
  total_debit: number;
  total_credit: number;
  net_change: number;
};

export type BaseStatement = {
  bank: string;
  card_type?: string | null;
  from_date: Date | null;
  to_date: Date | null;
};

export type Statement = BaseStatement & {
  id: string;
  created_at: Date;
  summary?: StatementSummary;
};

export type ParsedData = BaseStatement & {
  summary: StatementSummary;
  transactions: Transaction[];
};

export type ParsedDataWithId = ParsedData & { id: string };
