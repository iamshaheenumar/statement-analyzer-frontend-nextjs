import { NextRequest, NextResponse } from 'next/server';
import { parseStatement } from '@/lib/parsers';
import type { PageContent } from '@/lib/pdf/types';
import type { ParserConfigData } from '@/lib/parsers/configParser';
import prisma from '@/services/prisma';

export const runtime = 'nodejs';

interface ParseRequestBody {
  pages: { page: number; lines: string[] }[];
  bankHint?: { configId?: string; bank?: string; cardType?: string };
}

function buildPageText(cfg: ParserConfigData, pages: PageContent[]): string {
  const scoped = cfg.keywordsPage != null ? pages.filter(p => p.page === cfg.keywordsPage) : pages;
  return scoped.flatMap(p => p.lines).join(' ').toLowerCase();
}

function matchesKeywords(cfg: ParserConfigData, pageText: string): boolean {
  return cfg.keywords.every(k => pageText.includes(k.toLowerCase()));
}

function matchesCardType(cfg: ParserConfigData, allText: string): boolean {
  const lower = allText.toLowerCase();
  if (cfg.cardType === 'credit') {
    return lower.includes('credit limit') || lower.includes('credit card') ||
           lower.includes('outstanding balance') || lower.includes('minimum payment') ||
           lower.includes('total amount due') || lower.includes('available credit');
  }
  // debit
  return lower.includes('debit card') || lower.includes('savings account') ||
         lower.includes('current account') || lower.includes('available balance');
}

function matchesCardVariant(cfg: ParserConfigData, allText: string): boolean {
  if (!cfg.cardVariant) return false;
  return allText.toLowerCase().includes(cfg.cardVariant.toLowerCase());
}

function matchesColumnHeaders(cfg: ParserConfigData, text: string): boolean {
  if (!cfg.columnHeaders?.length) return true;
  const lower = text.toLowerCase();
  return cfg.columnHeaders.every(h => lower.includes(h.toLowerCase().trim()));
}

function findBestConfig(configs: any[], pages: PageContent[], allText: string): ParserConfigData | null {
  // Tier 1: cardVariant + keywords + cardType + columnHeaders (most specific)
  let matched = configs.find(c => {
    const cfg = c.config as ParserConfigData;
    if (!cfg.cardVariant) return false;
    const pageText = buildPageText(cfg, pages);
    return matchesKeywords(cfg, pageText) && matchesCardType(cfg, allText)
      && matchesCardVariant(cfg, allText) && matchesColumnHeaders(cfg, allText);
  });

  // Tier 2: cardVariant + keywords + cardType
  if (!matched) {
    matched = configs.find(c => {
      const cfg = c.config as ParserConfigData;
      if (!cfg.cardVariant) return false;
      const pageText = buildPageText(cfg, pages);
      return matchesKeywords(cfg, pageText) && matchesCardType(cfg, allText)
        && matchesCardVariant(cfg, allText);
    });
  }

  // Tier 3: keywords + cardType + columnHeaders
  if (!matched) {
    matched = configs.find(c => {
      const cfg = c.config as ParserConfigData;
      const pageText = buildPageText(cfg, pages);
      return matchesKeywords(cfg, pageText) && matchesCardType(cfg, allText)
        && matchesColumnHeaders(cfg, allText);
    });
  }

  // Tier 4: keywords + cardType
  if (!matched) {
    matched = configs.find(c => {
      const cfg = c.config as ParserConfigData;
      const pageText = buildPageText(cfg, pages);
      return matchesKeywords(cfg, pageText) && matchesCardType(cfg, allText);
    });
  }

  // Tier 5: keywords + columnHeaders
  if (!matched) {
    matched = configs.find(c => {
      const cfg = c.config as ParserConfigData;
      const pageText = buildPageText(cfg, pages);
      return matchesKeywords(cfg, pageText) && matchesColumnHeaders(cfg, allText);
    });
  }

  // Tier 6: keywords only (pure fallback)
  if (!matched) {
    matched = configs.find(c => {
      const cfg = c.config as ParserConfigData;
      const pageText = buildPageText(cfg, pages);
      return matchesKeywords(cfg, pageText);
    });
  }

  return matched ? (matched.config as ParserConfigData) : null;
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

  const allText = pages.flatMap(p => p.lines).join(' ');
  const { bankHint } = body;

  let dbConfig: ParserConfigData | null = null;
  try {
    if (bankHint?.configId) {
      // Direct lookup — user selected a specific parser
      const record = await prisma.parserConfig.findFirst({
        where: { id: bankHint.configId, active: true, status: 'approved' },
      });
      if (record) dbConfig = record.config as ParserConfigData;
    }

    if (!dbConfig) {
      // Full config list, optionally pre-filtered by hint
      const allConfigs = await prisma.parserConfig.findMany({
        where: { active: true, status: 'approved' },
        orderBy: { createdAt: 'desc' },
      });

      let candidates = allConfigs;

      if (bankHint?.bank) {
        const bankLower = bankHint.bank.toLowerCase();
        const filtered = allConfigs.filter(c => {
          const cfg = c.config as ParserConfigData;
          const name = (cfg.bankName || c.bank || '').toLowerCase();
          return name === bankLower;
        });
        if (filtered.length > 0) {
          candidates = bankHint?.cardType
            ? filtered.filter(c => (c.config as ParserConfigData).cardType === bankHint.cardType)
            : filtered;
          // If the hint filter left nothing, fall back to full list
          if (candidates.length === 0) candidates = filtered;
        }
      }

      dbConfig = findBestConfig(candidates, pages, allText);

      // If hint-filtered candidates yielded no match, retry with full list
      if (!dbConfig && bankHint?.bank && candidates !== allConfigs) {
        dbConfig = findBestConfig(allConfigs, pages, allText);
      }
    }
  } catch {
    // DB unavailable — fall through to generic
  }

  try {
    const result = parseStatement(pages, dbConfig);
    return NextResponse.json({ ...result, rawPageContent: pages });
  } catch (err) {
    console.error('[POST /api/parse]', err);
    return NextResponse.json({ error: 'Failed to parse statement' }, { status: 500 });
  }
}
