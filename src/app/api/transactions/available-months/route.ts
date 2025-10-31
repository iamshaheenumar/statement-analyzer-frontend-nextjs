import { NextResponse } from "next/server";
import prisma from "@/services/prisma";

function monthLabel(month: number, year: number) {
  return new Date(year, month - 1, 1).toLocaleString("en-US", {
    month: "long",
    year: "numeric",
  });
}

export async function GET() {
  try {
    // Prefer Statement.to_date if available
    const statements = await prisma.statement.findMany({
      where: { to_date: { not: null } },
      select: { to_date: true },
    });

    const monthsSet = new Set<string>();

    if (statements && statements.length > 0) {
      for (const s of statements) {
        if (!s.to_date) continue;
        const dt = new Date(s.to_date);
        const month = dt.getUTCMonth() + 1;
        const year = dt.getUTCFullYear();
        monthsSet.add(`${year}-${String(month).padStart(2, "0")}`);
      }
    } else {
      // Fallback to transactions
      const txns = await prisma.transaction.findMany({
        where: { transactionDate: { not: null } },
        select: { transactionDate: true },
      });
      for (const t of txns) {
        if (!t.transactionDate) continue;
        const dt = new Date(t.transactionDate);
        const month = dt.getUTCMonth() + 1;
        const year = dt.getUTCFullYear();
        monthsSet.add(`${year}-${String(month).padStart(2, "0")}`);
      }
    }

    const months = Array.from(monthsSet)
      .map((v) => {
        const [yearStr, monthStr] = v.split("-");
        const year = parseInt(yearStr, 10);
        const month = parseInt(monthStr, 10);
        return { year, month, label: monthLabel(month, year) };
      })
      .sort((a, b) => {
        if (a.year !== b.year) return b.year - a.year;
        return b.month - a.month;
      });

    return NextResponse.json({ months });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json(
      { error: err?.message || "Failed to fetch months" },
      { status: 500 }
    );
  }
}
