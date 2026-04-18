"use server";

import prisma from "@/services/prisma";
import { getUser } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function getCardsAction() {
  const user = await getUser();
  if (!user) return [];
  return prisma.bankCard.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });
}

export async function saveCardAction(data: {
  bank: string;
  cardNumber?: string | null;
  cardType: string;
  password?: string | null;
  nickname?: string | null;
}) {
  const user = await getUser();
  if (!user) throw new Error("Unauthorized");

  if (data.cardNumber) {
    const existing = await prisma.bankCard.findFirst({
      where: { userId: user.id, cardNumber: data.cardNumber },
    });
    if (existing) {
      await prisma.bankCard.update({
        where: { id: existing.id },
        data: {
          bank: data.bank,
          cardType: data.cardType,
          password: data.password ?? existing.password,
          nickname: data.nickname ?? existing.nickname,
        },
      });
      revalidatePath("/cards");
      return;
    }
  }

  await prisma.bankCard.create({
    data: {
      id: crypto.randomUUID(),
      userId: user.id,
      bank: data.bank,
      cardNumber: data.cardNumber ?? null,
      cardType: data.cardType,
      password: data.password ?? null,
      nickname: data.nickname ?? null,
    },
  });

  revalidatePath("/cards");
}

export async function deleteCardAction(id: string) {
  const user = await getUser();
  if (!user) throw new Error("Unauthorized");
  await prisma.bankCard.deleteMany({ where: { id, userId: user.id } });
  revalidatePath("/cards");
}
