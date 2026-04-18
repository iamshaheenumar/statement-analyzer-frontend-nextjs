"use server";

import prisma from "@/services/prisma";
import { getUser } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { ParserConfigData } from "@/lib/parsers/configParser";

export async function saveParserAction(data: {
  bank: string;
  keywords: string[];
  config: ParserConfigData;
}) {
  const user = await getUser();
  if (!user) throw new Error("Unauthorized");

  await prisma.parserConfig.create({
    data: {
      id: crypto.randomUUID(),
      userId: user.id,
      bank: data.bank,
      keywords: data.keywords,
      config: data.config as any,
      source: "ai",
      active: true,
    },
  });

  revalidatePath("/parsers");
}

export async function getParsersAction() {
  const user = await getUser();
  if (!user) return [];
  return prisma.parserConfig.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });
}

export async function deleteParserAction(id: string) {
  const user = await getUser();
  if (!user) throw new Error("Unauthorized");
  await prisma.parserConfig.deleteMany({ where: { id, userId: user.id } });
  revalidatePath("/parsers");
}

export async function toggleParserAction(id: string, active: boolean) {
  const user = await getUser();
  if (!user) throw new Error("Unauthorized");
  await prisma.parserConfig.updateMany({
    where: { id, userId: user.id },
    data: { active },
  });
  revalidatePath("/parsers");
}
