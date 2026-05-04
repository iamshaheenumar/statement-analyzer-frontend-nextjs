"use server";

import prisma from "@/services/prisma";
import type { ParserConfigData } from "@/lib/parsers/configParser";

type BankOption = {
  bank: string;
  options: { configId: string; cardType: "credit" | "debit"; cardVariant: string | null }[];
};

export async function getAvailableBanksAction(): Promise<BankOption[]> {
  const configs = await prisma.parserConfig.findMany({
    where: { active: true, status: "approved" },
    select: { id: true, bank: true, config: true },
    orderBy: { bank: "asc" },
  });

  const grouped = new Map<string, BankOption["options"]>();

  for (const record of configs) {
    const cfg = record.config as ParserConfigData;
    const bank = cfg.bankName || record.bank;
    if (!grouped.has(bank)) grouped.set(bank, []);
    grouped.get(bank)!.push({
      configId: record.id,
      cardType: cfg.cardType as "credit" | "debit",
      cardVariant: cfg.cardVariant ?? null,
    });
  }

  return Array.from(grouped.entries()).map(([bank, options]) => ({ bank, options }));
}
