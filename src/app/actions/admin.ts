"use server";

import prisma from "@/services/prisma";
import { isAdminAuthenticated } from "@/lib/admin/auth";
import { revalidatePath } from "next/cache";
import type { ParserConfigData } from "@/lib/parsers/configParser";

async function requireAdmin() {
  const ok = await isAdminAuthenticated();
  if (!ok) throw new Error("Unauthorized: admin access required");
}

export async function approveParserAction(id: string) {
  await requireAdmin();
  await prisma.parserConfig.update({
    where: { id },
    data: { status: "approved", active: true },
  });
  revalidatePath("/admin/parsers");
  revalidatePath("/parsers");
}

export async function rejectParserAction(id: string) {
  await requireAdmin();
  await prisma.parserConfig.update({
    where: { id },
    data: { status: "rejected", active: false },
  });
  revalidatePath("/admin/parsers");
  revalidatePath("/parsers");
}

export async function updateParserRulesAction(
  id: string,
  creditKeywords: string[],
  creditFlag: string
) {
  await requireAdmin();
  const existing = await prisma.parserConfig.findUnique({ where: { id } });
  if (!existing) throw new Error("Parser not found");

  const currentConfig = existing.config as Record<string, unknown>;
  const updatedConfig = {
    ...currentConfig,
    creditKeywords,
    creditFlag,
  };

  await prisma.parserConfig.update({
    where: { id },
    data: { config: updatedConfig },
  });
  revalidatePath("/admin/parsers");
  revalidatePath("/parsers");
}

export async function toggleParserActiveAction(id: string, active: boolean) {
  await requireAdmin();
  await prisma.parserConfig.update({
    where: { id },
    data: { active },
  });
  revalidatePath("/admin/parsers");
  revalidatePath("/parsers");
}

export async function deleteParserAdminAction(id: string) {
  await requireAdmin();
  await prisma.parserConfig.delete({ where: { id } });
  revalidatePath("/admin/parsers");
  revalidatePath("/parsers");
}

export async function createAdminParserAction(data: {
  bank: string;
  keywords: string[];
  config: ParserConfigData;
}) {
  await requireAdmin();

  await prisma.parserConfig.create({
    data: {
      id: crypto.randomUUID(),
      userId: null,
      bank: data.bank,
      keywords: data.keywords,
      config: data.config as any,
      source: "admin",
      active: true,
      status: "approved",
    },
  });

  revalidatePath("/admin/parsers");
  revalidatePath("/parsers");
}
