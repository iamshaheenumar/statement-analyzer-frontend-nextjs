import { NextRequest, NextResponse } from 'next/server';
import { parseStatement } from '@/lib/parsers';
import type { PageContent } from '@/lib/pdf/types';

export const runtime = 'nodejs';

interface ParseRequestBody {
  pages: { page: number; lines: string[] }[];
  bank?: string;
}

/**
 * POST /api/parse
 *
 * Accepts pre-extracted PDF page content (produced by the browser-side
 * extractPdfPages()) and returns a structured ParseResult.
 *
 * Body: application/json
 *   pages  { page: number; lines: string[] }[]  required
 *   bank   string                               optional override
 */
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

  // Reconstruct PageContent[] — add the pre-joined text string each parser may need.
  const pages: PageContent[] = body.pages.map(p => ({
    page: p.page,
    lines: p.lines,
    text: p.lines.join('\n'),
  }));

  try {
    const result = parseStatement(pages, body.bank);
    return NextResponse.json(result);
  } catch (err) {
    console.error('[POST /api/parse]', err);
    return NextResponse.json({ error: 'Failed to parse statement' }, { status: 500 });
  }
}
