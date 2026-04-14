import { NextRequest, NextResponse } from 'next/server';
import type { PreviewResult } from '@/lib/pdf/types';

export const runtime = 'nodejs';

interface PreviewRequestBody {
  pages: { page: number; lines: string[] }[];
}

/**
 * POST /api/preview
 *
 * Returns the raw extracted text per page — useful for debugging parser
 * issues and inspecting PDF structure.
 *
 * Body: application/json
 *   pages  { page: number; lines: string[] }[]  required
 */
export async function POST(request: NextRequest) {
  let body: PreviewRequestBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  if (!Array.isArray(body?.pages) || body.pages.length === 0) {
    return NextResponse.json({ error: 'pages array is required' }, { status: 400 });
  }

  const result: PreviewResult = {
    pages: body.pages.map(p => ({
      page: p.page,
      lines: p.lines.map((line: string, i: number) => ({ i: i + 1, line })),
    })),
  };

  return NextResponse.json(result);
}
