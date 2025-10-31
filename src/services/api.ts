export async function getAvailableMonths() {
  const response = await fetch("/api/transactions/available-months");
  if (!response.ok) {
    throw new Error("Failed to fetch months");
  }
  const data = await response.json();
  return data.months;
}
