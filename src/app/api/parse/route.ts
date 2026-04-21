import { NextRequest, NextResponse } from 'next/server';
import { parseStatement } from '@/lib/parsers';
import type { PageContent } from '@/lib/pdf/types';
import type { ParserConfigData } from '@/lib/parsers/configParser';
import prisma from '@/services/prisma';

export const runtime = 'nodejs';

interface ParseRequestBody {
  pages: { page: number; lines: string[] }[];
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

  // Find the first approved & active config whose keywords ALL match (AND) the statement text
  let dbConfig: ParserConfigData | null = null;
  try {
    const configs = await prisma.parserConfig.findMany({
      where: { active: true, status: 'approved' },
      orderBy: { createdAt: 'desc' },
    });
    const match = configs.find(c => {
      const cfg = c.config as ParserConfigData;
      const scopedPages = cfg.keywordsPage != null
        ? pages.filter(p => p.page === cfg.keywordsPage)
        : pages;
      const textLower = scopedPages.flatMap(p => p.lines).join(' ').toLowerCase();
      return (c.keywords as string[]).every(k => textLower.includes(k.toLowerCase()));
    });
    if (match) dbConfig = match.config as ParserConfigData;
  } catch {
    // DB unavailable — fall through to generic
  }

  try {
    const result = parseStatement(pages, dbConfig);
    // Only include raw page content for unknown banks so the user can submit them for admin review
    if (!dbConfig) {
      return NextResponse.json({ ...result, rawPageContent: pages });
    }
    return NextResponse.json(result);
  } catch (err) {
    console.error('[POST /api/parse]', err);
    return NextResponse.json({ error: 'Failed to parse statement' }, { status: 500 });
  }
}
