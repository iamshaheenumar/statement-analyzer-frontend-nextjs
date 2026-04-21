"use server";

import prisma from "@/services/prisma";
import { getUser } from "@/lib/supabase/server";
import type {
  ParsedData as DashboardParsedData,
  Transaction as DashboardTransaction,
} from "@/features/dashboard/types";
import { Prisma as PrismaNS } from "@prisma/client";
import { categorizeDescriptions } from "@/lib/categorize";

type ParsedData = DashboardParsedData & { id?: string };
type Transaction = DashboardTransaction;

export async function saveStatementAction(data: ParsedData) {
  try {
    const user = await getUser();
    if (!user) return { error: "Unauthorized", code: "AUTH" };

    if (!data) throw new Error("Empty body");

    const { id, bank, summary, transactions, from_date, to_date, card_type, currency } = data;

    if (!bank || !summary || !Array.isArray(transactions)) {
      throw new Error("Invalid payload");
    }

    const statementId = id || crypto.randomUUID();
    const settlementCurrency = currency || summary.currency || 'AED';

    // Categorize descriptions BEFORE the Prisma transaction (AI calls must not be inside it)
    const descriptions = transactions
      .map((t: Transaction) => t.description)
      .filter((d): d is string => !!d);
    const categoryMap = await categorizeDescriptions(descriptions, user.id);

    await prisma.$transaction(async (tx) => {
      await tx.statement.upsert({
        where: { id: statementId },
        update: {
          bank,
          from_date: from_date ? new Date(from_date) : null,
          to_date: to_date ? new Date(to_date) : null,
          card_type: card_type || null,
          currency: settlementCurrency,
          recordCount: summary.record_count,
          totalDebit: summary.total_debit,
          totalCredit: summary.total_credit,
          netChange: summary.net_change,
        },
        create: {
          id: statementId,
          userId: user.id,
          bank,
          from_date: from_date ? new Date(from_date) : null,
          to_date: to_date ? new Date(to_date) : null,
          card_type: card_type || null,
          currency: settlementCurrency,
          recordCount: summary.record_count,
          totalDebit: summary.total_debit,
          totalCredit: summary.total_credit,
          netChange: summary.net_change,
        },
      });

      await tx.transaction.deleteMany({ where: { statementId } });

      if (transactions.length > 0) {
        await tx.transaction.createMany({
          data: transactions.map((t: Transaction) => ({
            statementId,
            transactionDate: t.transaction_date ? new Date(t.transaction_date) : null,
            description: t.description || null,
            debit: (t.debit as any) ?? null,
            credit: (t.credit as any) ?? null,
            amount: (t.amount as any) ?? null,
            bank: t.bank || bank,
            categoryId: t.description
              ? (categoryMap.get(t.description.trim().toLowerCase()) ?? null)
              : null,
          })),
        });
      }
    });

    return { id: statementId, status: "saved" };
  } catch (err: any) {
    console.error(err);
    if (err instanceof PrismaNS.PrismaClientKnownRequestError) {
      if (err.code === "P2021" || err.code === "P2022") {
        return {
          error: "Database schema is missing. Run `prisma db push` to create tables.",
          code: err.code,
        };
      }
      return { error: err.message, code: err.code };
    }
    return { error: err?.message || "Failed to save" };
  }
}
