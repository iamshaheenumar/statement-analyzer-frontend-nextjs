export type SavedCard = {
  id: string;
  bank: string;
  cardNumber: string | null;
  cardType: string;
  cardVariant: string | null;
  password: string | null;
  nickname: string | null;
};

export type BankSelection =
  | { type: "none" }
  | { type: "saved_card"; card: SavedCard };

export type FormValues = {
  file: FileList;
  password?: string;
  bankSelection: BankSelection;
};
