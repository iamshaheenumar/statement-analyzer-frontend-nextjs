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

export default async function AdminParsersPage() {
  const parsers = await getAllParsers();

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
  }));

  return <AdminParsersClient parsers={serialized} />;
}
