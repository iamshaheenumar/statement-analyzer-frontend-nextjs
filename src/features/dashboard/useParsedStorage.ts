import { useEffect, useState } from "react";
import localforage from "localforage";
import { ParsedResponse } from "@/features/dashboard/types";

const PARSED_KEY = "parsedStatements";

localforage.config({
  name: "BankDashboard",
  storeName: "bank_statements",
});

export function useParsedStorage() {
  const [parsedList, setParsedList] = useState<ParsedResponse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const stored =
        (await localforage.getItem<ParsedResponse[]>(PARSED_KEY)) || [];
      setParsedList(stored);
      setLoading(false);
    })();
  }, []);

  async function addParsed(data: ParsedResponse) {
    const existing =
      (await localforage.getItem<ParsedResponse[]>(PARSED_KEY)) || [];
    await localforage.setItem(PARSED_KEY, [...existing, data]);
    setParsedList((prev) => [...prev, data]);
  }

  async function clearAll() {
    await localforage.removeItem(PARSED_KEY);
    setParsedList([]);
  }

  return { parsedList, addParsed, clearAll, loading };
}
