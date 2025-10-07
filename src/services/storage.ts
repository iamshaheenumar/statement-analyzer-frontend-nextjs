import { ParsedResponse } from "@/features/dashboard/types";
import localforage from "localforage";

const PARSED_KEY = "parsedStatements";

localforage.config({
  name: "BankDashboard",
  storeName: "bank_statements",
});

export async function saveParsedStatement(data: ParsedResponse) {
  const existing =
    (await localforage.getItem<ParsedResponse[]>(PARSED_KEY)) || [];
  await localforage.setItem(PARSED_KEY, [...existing, data]);
}

export async function getParsedStatements(): Promise<ParsedResponse[]> {
  return (await localforage.getItem<ParsedResponse[]>(PARSED_KEY)) || [];
}

export async function clearParsedStatements() {
  await localforage.removeItem(PARSED_KEY);
}
