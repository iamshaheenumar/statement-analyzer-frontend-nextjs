// src/services/detectBank.ts

/**
 * Detects bank name based on parsed PDF text lines.
 * Works purely on text, no PDF re-parsing required.
 */

const BANK_KEYWORDS: Record<string, string[]> = {
  mashreq: ["mashreq", "mashreqbank"],
  enbd: ["emirates nbd", "dubai bank"],
  adcb: ["adcb", "abu dhabi commercial bank"],
  emiratesislamic: ["emirates islamic"],
  rakbank: ["rakbank", "national bank of ras al khaimah"],
  cbd: ["commercial bank of dubai", "cbd"],
  fab: ["first abu dhabi bank", "fab"],
  hsbc: ["hsbc middle east"],
  // Add or tune more as needed
};

export function detectBankFromText(parsedLines: string[] | string): string {
  // Join lines into one block of text
  const text =
    typeof parsedLines === "string"
      ? parsedLines.toLowerCase()
      : parsedLines.join(" ").toLowerCase();

  for (const [bank, keywords] of Object.entries(BANK_KEYWORDS)) {
    if (keywords.some((kw) => text.includes(kw))) {
      return bank;
    }
  }

  return "unknown";
}
