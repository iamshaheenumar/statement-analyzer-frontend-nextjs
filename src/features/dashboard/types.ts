export type Transaction = {
  transaction_date: string;
  description: string;
  debit: number;
  credit: number;
  amount: number;
  bank: string;
};

export type ParsedData = {
  bank: string;
  summary: {
    record_count: number;
    total_debit: number;
    total_credit: number;
    net_change: number;
  };
  transactions: Transaction[];
};

export type ParsedDataWithId = ParsedData & { id: string };
