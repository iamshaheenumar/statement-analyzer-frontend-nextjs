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
  creditFlag: string,
  keywordsPage: number | undefined,
  detectionKeywords: string[],
  columnHeaders?: string[]
) {
  await requireAdmin();
  const existing = await prisma.parserConfig.findUnique({ where: { id } });
  if (!existing) throw new Error("Parser not found");

  const updatedConfig: Record<string, unknown> = {
    ...(existing.config as Record<string, unknown>),
    creditKeywords,
    creditFlag,
  };
  if (keywordsPage !== undefined) {
    updatedConfig.keywordsPage = keywordsPage;
  } else {
    delete updatedConfig.keywordsPage;
  }
  if (columnHeaders !== undefined) {
    updatedConfig.columnHeaders = columnHeaders.length ? columnHeaders : null;
  }

  await prisma.parserConfig.update({
    where: { id },
    data: { config: updatedConfig as any, keywords: detectionKeywords },
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

export async function updateParserConfigAction(
  id: string,
  config: ParserConfigData,
  keywords: string[]
) {
  await requireAdmin();
  const existing = await prisma.parserConfig.findUnique({ where: { id } });
  if (!existing) throw new Error("Parser not found");

  await prisma.parserConfig.update({
    where: { id },
    data: {
      bank: config.bankName,
      keywords,
      config: config as any,
    },
  });
  revalidatePath("/admin/parsers");
  revalidatePath("/parsers");
}

export async function createAdminParserAction(data: {
  bank: string;
  keywords: string[];
  config: ParserConfigData;
  rawPageContent?: Array<{ page: number; lines: string[]; text: string }>;
  pendingSubmissionId?: string;
  active?: boolean;
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
      active: data.active ?? true,
      status: data.active === false ? "pending" : "approved",
      ...(data.rawPageContent ? { rawPageContent: data.rawPageContent as any } : {}),
    },
  });

  if (data.pendingSubmissionId) {
    await prisma.parserConfig.delete({ where: { id: data.pendingSubmissionId } });
  }

  revalidatePath("/admin/parsers");
  revalidatePath("/parsers");
}

// ── Category admin actions ────────────────────────────────────────────────────

export async function createSystemCategoryAction(name: string, color: string) {
  await requireAdmin();
  const trimmed = name.trim();
  if (!trimmed) throw new Error("Name is required");

  const existing = await prisma.category.findFirst({
    where: { userId: null, name: { equals: trimmed, mode: "insensitive" } },
  });
  if (existing) return { error: "Category already exists" };

  const category = await prisma.category.create({
    data: { userId: null, name: trimmed, color, isSystem: true },
  });

  revalidatePath("/admin/categories");
  revalidatePath("/settings/categories");
  revalidatePath("/dashboard");
  return { category };
}

export async function updateSystemCategoryAction(id: string, name: string, color: string) {
  await requireAdmin();
  const category = await prisma.category.update({
    where: { id },
    data: { name: name.trim(), color },
  });
  revalidatePath("/admin/categories");
  revalidatePath("/settings/categories");
  revalidatePath("/dashboard");
  return { category };
}

export async function deleteSystemCategoryAction(id: string) {
  await requireAdmin();
  await prisma.transaction.updateMany({ where: { categoryId: id }, data: { categoryId: null } });
  await prisma.descriptionCategoryMap.deleteMany({ where: { categoryId: id } });
  await prisma.category.delete({ where: { id } });
  revalidatePath("/admin/categories");
  revalidatePath("/settings/categories");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function updateGlobalMappingAction(id: string, categoryId: string) {
  await requireAdmin();
  await prisma.descriptionCategoryMap.update({
    where: { id },
    data: { categoryId, source: "admin" },
  });
  revalidatePath("/admin/categories");
  return { success: true };
}

export async function deleteGlobalMappingAction(id: string) {
  await requireAdmin();
  await prisma.descriptionCategoryMap.delete({ where: { id } });
  revalidatePath("/admin/categories");
  return { success: true };
}
