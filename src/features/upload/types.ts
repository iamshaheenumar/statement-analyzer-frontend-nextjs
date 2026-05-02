export type SavedCard = {
  id: string;
  bank: string;
  cardNumber: string | null;
  cardType: string;
  cardVariant: string | null;
  password: string | null;
  nickname: string | null;
};

export type BankOption = {
  bank: string;
  options: {
    configId: string;
    cardType: "credit" | "debit";
    cardVariant: string | null;
  }[];
};

export type BankSelection =
  | { type: "auto" }
  | { type: "saved_card"; card: SavedCard }
  | { type: "bank"; configId: string; bank: string; cardType: "credit" | "debit"; cardVariant?: string | null }
  | { type: "ai" };

export type FormValues = {
  file: FileList;
  password?: string;
  bankSelection: BankSelection;
};
