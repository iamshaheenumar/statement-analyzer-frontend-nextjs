"use server";

import prisma from "@/services/prisma";
import { getUser } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function getAllCategories() {
  const user = await getUser();
  if (!user) return [];

  return prisma.category.findMany({
    where: { OR: [{ userId: null }, { userId: user.id }] },
    orderBy: [{ isSystem: "desc" }, { name: "asc" }],
  });
}

export async function createCategoryAction(name: string, color: string) {
  const user = await getUser();
  if (!user) return { error: "Unauthorized" };

  const trimmed = name.trim();
  if (!trimmed) return { error: "Name is required" };

  // Check for duplicate name (user-scoped)
  const existing = await prisma.category.findFirst({
    where: { userId: user.id, name: { equals: trimmed, mode: "insensitive" } },
  });
  if (existing) return { error: "Category already exists" };

  const category = await prisma.category.create({
    data: { userId: user.id, name: trimmed, color, isSystem: false },
  });

  revalidatePath("/settings/categories");
  return { category };
}

export async function deleteCategoryAction(id: string) {
  const user = await getUser();
  if (!user) return { error: "Unauthorized" };

  const category = await prisma.category.findFirst({
    where: { id, userId: user.id, isSystem: false },
  });
  if (!category) return { error: "Not found or cannot delete system category" };

  // Unlink transactions before deleting
  await prisma.transaction.updateMany({
    where: { categoryId: id, statement: { userId: user.id } },
    data: { categoryId: null },
  });

  await prisma.descriptionCategoryMap.deleteMany({
    where: { categoryId: id, userId: user.id },
  });

  await prisma.category.delete({ where: { id } });

  revalidatePath("/settings/categories");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function updateTransactionCategoryAction(
  transactionId: number,
  categoryId: string
) {
  const user = await getUser();
  if (!user) return { error: "Unauthorized" };

  // Verify the transaction belongs to the user
  const tx = await prisma.transaction.findFirst({
    where: { id: transactionId, statement: { userId: user.id } },
  });
  if (!tx) return { error: "Transaction not found" };

  await prisma.transaction.update({
    where: { id: transactionId },
    data: { categoryId },
  });

  // Save user-specific description mapping so future saves auto-apply this preference
  if (tx.description) {
    const normalized = tx.description.trim().toLowerCase();
    const existingMap = await prisma.descriptionCategoryMap.findFirst({
      where: { userId: user.id, description: normalized },
    });
    if (existingMap) {
      await prisma.descriptionCategoryMap.update({
        where: { id: existingMap.id },
        data: { categoryId, source: "user" },
      });
    } else {
      await prisma.descriptionCategoryMap.create({
        data: { userId: user.id, description: normalized, categoryId, source: "user" },
      });
    }
  }

  revalidatePath("/statements/[id]", "page");
  revalidatePath("/dashboard");
  return { success: true };
}
