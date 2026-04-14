const BANK_KEYWORDS: Record<string, string[]> = {
  mashreq: ['mashreq', 'mashreqbank'],
  enbd: ['emirates nbd', 'dubai bank'],
  adcb: ['adcb', 'abu dhabi commercial bank'],
  emiratesislamic: ['emirates islamic'],
  rakbank: ['rakbank', 'national bank of ras al khaimah'],
  cbd: ['commercial bank of dubai', 'cbd'],
  fab: ['first abu dhabi bank', 'fab'],
  hsbc: ['hsbc middle east'],
};

/**
 * Detect the bank from extracted PDF text lines.
 * Only the first two pages worth of lines are needed in practice.
 */
export function detectBankFromText(lines: string[] | string): string {
  const text =
    typeof lines === 'string'
      ? lines.toLowerCase()
      : lines.join(' ').toLowerCase();

  for (const [bank, keywords] of Object.entries(BANK_KEYWORDS)) {
    if (keywords.some(kw => text.includes(kw))) return bank;
  }

  return 'unknown';
}
