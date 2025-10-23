import { NextResponse } from "next/server";
import prisma from "@/services/prisma";

export const dynamic = "force-dynamic"; // avoid static caching

export async function GET() {
  try {
    // Simple connectivity check + some metadata
    const rows = (await prisma.$queryRaw<any[]>`
      SELECT now() as now, version() as version, current_database() as db
    `) as Array<{ now: Date; version: string; db: string }>;

    const meta = rows?.[0] || null;

    return NextResponse.json({
      ok: true,
      database: meta?.db ?? null,
      time: meta?.now ?? null,
      version: meta?.version ?? null,
    });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message || "DB connection failed" },
      { status: 500 }
    );
  }
}

