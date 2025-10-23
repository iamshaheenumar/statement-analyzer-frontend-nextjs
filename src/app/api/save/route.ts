import { NextResponse } from "next/server";
import prisma from "@/services/prisma";
import type {
  ParsedData as DashboardParsedData,
  Transaction as DashboardTransaction,
} from "@/features/dashboard/types";
import type { Prisma } from "@prisma/client";
import { Prisma as PrismaNS } from "@prisma/client";

// Reuse existing UI types for payload shape
type ParsedData = DashboardParsedData & { id?: string };
type Transaction = DashboardTransaction;

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as ParsedData | null;
    if (!body) return NextResponse.json({ error: "Empty body" }, { status: 400 });

    const { id, bank, summary, transactions } = body;
    if (!bank || !summary || !Array.isArray(transactions)) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const statementId = id || crypto.randomUUID();

    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // Upsert statement
      await tx.statement.upsert({
        where: { id: statementId },
        update: {
          bank,
          recordCount: summary.record_count,
          totalDebit: summary.total_debit,
          totalCredit: summary.total_credit,
          netChange: summary.net_change,
        },
        create: {
          id: statementId,
          bank,
          recordCount: summary.record_count,
          totalDebit: summary.total_debit,
          totalCredit: summary.total_credit,
          netChange: summary.net_change,
        },
      });

      // Replace transactions (idempotent save)
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
          })),
        });
      }
    });

    return NextResponse.json({ id: statementId, status: "saved" });
  } catch (err: any) {
    console.error(err);
    // Provide clearer error for missing tables / schema not applied
    if (err instanceof PrismaNS.PrismaClientKnownRequestError) {
      if (err.code === "P2021" || err.code === "P2022") {
        return NextResponse.json(
          {
            error:
              "Database schema is missing. Run `prisma migrate dev` or `prisma db push` to create tables.",
            code: err.code,
          },
          { status: 500 }
        );
      }
      return NextResponse.json(
        { error: err.message, code: err.code },
        { status: 500 }
      );
    }
    return NextResponse.json(
      { error: err?.message || "Failed to save" },
      { status: 500 }
    );
  }
}
