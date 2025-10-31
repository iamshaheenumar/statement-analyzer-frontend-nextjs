"use server";

import prisma from "@/services/prisma";
import { revalidatePath } from "next/cache";

export async function deleteStatementAction(id: string) {
  if (!id) throw new Error("Missing statement id");

  await prisma.$transaction(async (tx) => {
    await tx.transaction.deleteMany({ where: { statementId: id } });
    await tx.statement.delete({ where: { id } });
  });

  // Revalidate the statements page so it refetches fresh data
  revalidatePath("/statements");
}
