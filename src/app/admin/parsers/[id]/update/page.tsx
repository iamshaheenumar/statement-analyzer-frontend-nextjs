import prisma from "@/services/prisma";
import { notFound } from "next/navigation";
import UpdateParserClient from "./UpdateParserClient";

export default async function UpdateParserPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let parser;
  try {
    parser = await prisma.parserConfig.findUnique({ where: { id } });
  } catch {
    notFound();
  }

  if (!parser) notFound();

  const serialized = {
    id: parser.id,
    bank: parser.bank,
    keywords: parser.keywords,
    config: parser.config as Record<string, unknown>,
  };

  return <UpdateParserClient parser={serialized} />;
}
