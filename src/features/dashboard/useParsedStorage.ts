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

  async function updateParsed(
    id: string,
    data: Partial<ParsedData>
  ): Promise<ParsedDataWithId | null> {
    const existing =
      (await localforage.getItem<ParsedDataWithId[]>(PARSED_KEY)) || [];
    const idx = existing.findIndex((item) => item.id === id);
    if (idx === -1) return null;

    const updatedItem: ParsedDataWithId = {
      ...existing[idx],
      ...data,
    } as ParsedDataWithId;

    const updatedList = [...existing];
    updatedList[idx] = updatedItem;
    await localforage.setItem(PARSED_KEY, updatedList);
    setParsedList(updatedList);
    return updatedItem;
  }

  async function clearAll() {
    await localforage.removeItem(PARSED_KEY);
    setParsedList([]);
  }

  return { parsedList, addParsed, deleteParsed, updateParsed, clearAll, loading };
}
