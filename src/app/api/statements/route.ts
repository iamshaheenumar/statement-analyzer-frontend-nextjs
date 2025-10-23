import { NextResponse } from "next/server";
import prisma from "@/services/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const rows = await prisma.statement.findMany({
      orderBy: { createdAt: "desc" },
    });

    const data = rows.map((s) => ({
      id: s.id,
      bank: s.bank,
      created_at: s.createdAt,
      summary: {
        record_count: s.recordCount,
        total_debit: Number(s.totalDebit),
        total_credit: Number(s.totalCredit),
        net_change: Number(s.netChange),
      },
    }));

    return NextResponse.json({ items: data });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Failed to list statements" },
      { status: 500 }
    );
  }
}

