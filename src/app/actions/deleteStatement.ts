"use server";

import prisma from "@/services/prisma";
import { getUser } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function deleteStatementAction(id: string) {
  if (!id) throw new Error("Missing statement id");

  const user = await getUser();
  if (!user) throw new Error("Unauthorized");

  await prisma.$transaction(async (tx) => {
    // Verify ownership before deleting
    const statement = await tx.statement.findFirst({
      where: { id, userId: user.id },
      select: { id: true },
    });
    if (!statement) throw new Error("Not found");

    await tx.transaction.deleteMany({ where: { statementId: id } });
    await tx.statement.delete({ where: { id } });
  });

  revalidatePath("/statements");
}
