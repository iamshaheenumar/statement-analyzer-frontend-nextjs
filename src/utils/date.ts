import { format, isValid, parseISO } from "date-fns";

export function formatDate(date: string | Date | null): string {
  if (!date) return "-";

  const d = typeof date === "string" ? parseISO(date) : date;
  return isValid(d) ? format(d, "dd LLL yy").toUpperCase() : "-";
}
