import { NextResponse } from "next/server";
import prisma from "@/services/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const month = searchParams.get("month");
    const year = searchParams.get("year");

    if (!month || !year) {
      return NextResponse.json(
        { error: "Missing month or year query parameters" },
        { status: 400 }
      );
    }

    const monthNum = parseInt(month, 10);
    const yearNum = parseInt(year, 10);
    if (isNaN(monthNum) || isNaN(yearNum)) {
      return NextResponse.json(
        { error: "Invalid month or year" },
        { status: 400 }
      );
    }

    const start = new Date(yearNum, monthNum - 1, 1);
    const end = new Date(yearNum, monthNum, 1);

    const transactions = await prisma.transaction.findMany({
      where: {
        transactionDate: {
          gte: start,
          lt: end,
        },
      },
      orderBy: { transactionDate: "asc" },
    });

    return NextResponse.json(transactions);
  } catch (err: any) {
    console.error(err);
    return NextResponse.json(
      { error: err?.message || "Failed to fetch" },
      { status: 500 }
    );
  }
}
