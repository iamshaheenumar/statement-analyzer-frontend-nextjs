import { NextResponse } from "next/server";
import prisma from "@/services/prisma";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json(
        { error: "Missing statementId" },
        { status: 400 }
      );
    }

    // Get both statement and its transactions
    const statement = await prisma.statement.findUnique({
      where: { id },
      include: {
        transactions: {
          orderBy: { transactionDate: "asc" },
        },
      },
    });

    if (!statement) {
      return NextResponse.json(
        { error: "Statement not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(statement);
  } catch (err: any) {
    console.error(err);
    return NextResponse.json(
      { error: err?.message || "Failed to fetch" },
      { status: 500 }
    );
  }
}
