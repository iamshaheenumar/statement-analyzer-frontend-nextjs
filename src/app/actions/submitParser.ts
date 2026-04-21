"use server";

import prisma from "@/services/prisma";
import type { PageContent } from "@/lib/pdf/types";

export async function submitUserParserAction(rawPageContent: PageContent[]): Promise<void> {
  await prisma.parserConfig.create({
    data: {
      id: crypto.randomUUID(),
      userId: null,
      bank: "Unknown",
      keywords: [],
      config: {},
      source: "user",
      active: false,
      status: "pending",
      rawPageContent: rawPageContent as any,
    },
  });
}
