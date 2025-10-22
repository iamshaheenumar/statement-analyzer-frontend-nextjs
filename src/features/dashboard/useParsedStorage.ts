import { useEffect, useState } from "react";
import localforage from "localforage";
import { ParsedData, ParsedDataWithId } from "@/features/dashboard/types";

const PARSED_KEY = "parsedStatements";

localforage.config({
  name: "BankDashboard",
  storeName: "bank_statements",
});

export function useParsedStorage() {
  const [parsedList, setParsedList] = useState<ParsedDataWithId[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const stored =
        (await localforage.getItem<ParsedDataWithId[]>(PARSED_KEY)) || [];
      setParsedList(stored);
      setLoading(false);
    })();
  }, []);

  async function addParsed(data: ParsedData): Promise<ParsedDataWithId> {
    const withId = { ...data, id: crypto.randomUUID() };
    const existing =
      (await localforage.getItem<ParsedDataWithId[]>(PARSED_KEY)) || [];
    const updated = [...existing, withId];
    await localforage.setItem(PARSED_KEY, updated);
    setParsedList(updated);

    return withId;
  }

  async function deleteParsed(id: string) {
    const existing =
      (await localforage.getItem<ParsedDataWithId[]>(PARSED_KEY)) || [];
    const filtered = existing.filter((item) => item.id !== id);
    await localforage.setItem(PARSED_KEY, filtered);
    setParsedList(filtered);
  }

  async function clearAll() {
    await localforage.removeItem(PARSED_KEY);
    setParsedList([]);
  }

  return { parsedList, addParsed, deleteParsed, clearAll, loading };
}
