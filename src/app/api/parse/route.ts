import { NextRequest, NextResponse } from 'next/server';
import { parseStatement, BUILTIN_PARSERS } from '@/lib/parsers';
import { detectBankFromText } from '@/lib/pdf/detectBank';
import type { PageContent } from '@/lib/pdf/types';
import type { ParserConfigData } from '@/lib/parsers/configParser';
import prisma from '@/services/prisma';

export const runtime = 'nodejs';

interface ParseRequestBody {
  pages: { page: number; lines: string[] }[];
  bank?: string;
}

export async function POST(request: NextRequest) {
  let body: ParseRequestBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  if (!Array.isArray(body?.pages) || body.pages.length === 0) {
    return NextResponse.json({ error: 'pages array is required' }, { status: 400 });
  }

  const pages: PageContent[] = body.pages.map(p => ({
    page: p.page,
    lines: p.lines,
    text: p.lines.join('\n'),
  }));

  const allLines = pages.flatMap(p => p.lines);
  const bank = body.bank ?? detectBankFromText(allLines);

  // Look up a user-created parser config if no builtin matches
  let dbConfig: ParserConfigData | null = null;
  if (!BUILTIN_PARSERS[bank]) {
    try {
      const allConfigs = await prisma.parserConfig.findMany({
        where: { active: true },
        orderBy: { createdAt: 'desc' },
      });
      const textLower = allLines.join(' ').toLowerCase();
      const match = allConfigs.find(c =>
        (c.keywords as string[]).some(k => textLower.includes(k.toLowerCase()))
      );
      if (match) dbConfig = match.config as ParserConfigData;
    } catch {
      // DB unavailable — continue without config
    }
  }

  try {
    const result = parseStatement(pages, body.bank, dbConfig);
    return NextResponse.json(result);
  } catch (err) {
    console.error('[POST /api/parse]', err);
    return NextResponse.json({ error: 'Failed to parse statement' }, { status: 500 });
  }
}
