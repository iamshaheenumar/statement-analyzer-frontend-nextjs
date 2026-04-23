import prisma from "@/services/prisma";
import AdminParsersClient from "./AdminParsersClient";

async function getAllParsers() {
  try {
    return await prisma.parserConfig.findMany({
      orderBy: { createdAt: "desc" },
    });
  } catch {
    return [];
  }
}

async function getStatementCountsByBank(): Promise<Record<string, number>> {
  try {
    const counts = await prisma.statement.groupBy({
      by: ["bank"],
      _count: { id: true },
    });
    return Object.fromEntries(counts.map((r) => [r.bank.toLowerCase(), r._count.id]));
  } catch {
    return {};
  }
}

export default async function AdminParsersPage() {
  const [parsers, countByBank] = await Promise.all([
    getAllParsers(),
    getStatementCountsByBank(),
  ]);

  const serialized = parsers.map((p) => ({
    id: p.id,
    userId: p.userId,
    bank: p.bank,
    keywords: p.keywords,
    config: p.config as Record<string, unknown>,
    source: p.source,
    active: p.active,
    status: p.status,
    createdAt: p.createdAt.toISOString(),
    rawPageContent: p.rawPageContent as Array<{ page: number; lines: string[]; text: string }> | null,
    statementCount: countByBank[p.bank.toLowerCase()] ?? 0,
  }));

  return <AdminParsersClient parsers={serialized} />;
}
