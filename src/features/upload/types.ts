export type FormValues = {
  file: FileList;
  password?: string;
};

export type SavedCard = {
  id: string;
  bank: string;
  cardNumber: string | null;
  cardType: string;
  cardVariant: string | null;
  password: string | null;
  nickname: string | null;
};
