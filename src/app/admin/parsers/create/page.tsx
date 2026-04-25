import prisma from "@/services/prisma";
import CreateParserClient from "./CreateParserClient";

export default async function CreateParserPage({
  searchParams,
}: {
  searchParams: Promise<{ submissionId?: string }>;
}) {
  const { submissionId } = await searchParams;

  let initialPages: Array<{ page: number; lines: string[]; text: string }> | undefined;
  let pendingSubmissionId: string | undefined;

  if (submissionId) {
    try {
      const submission = await prisma.parserConfig.findUnique({ where: { id: submissionId } });
      if (submission?.rawPageContent) {
        initialPages = submission.rawPageContent as Array<{ page: number; lines: string[]; text: string }>;
        pendingSubmissionId = submissionId;
      }
    } catch {
      // continue without pre-filled data
    }
  }

  return <CreateParserClient initialPages={initialPages} pendingSubmissionId={pendingSubmissionId} />;
}
