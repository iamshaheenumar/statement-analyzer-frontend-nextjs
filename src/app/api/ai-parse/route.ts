import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import type { PageContent } from '@/lib/pdf/types';
import { normalizeTransactions, summarizeTransactions, detectCurrency } from '@/lib/pdf/utils';
import type { ParserConfigData } from '@/lib/parsers/configParser';

export const runtime = 'nodejs';

const SYSTEM_PROMPT = `You are a bank statement parser. Extract all transactions from bank statement text and return ONLY valid JSON — no markdown, no explanation.

Return this exact structure:
{
  "bank": "Full Bank Name",
  "card_type": "credit" | "debit",
  "currency": "AED",
  "from_date": "YYYY-MM-DD" | null,
  "to_date": "YYYY-MM-DD" | null,
  "transactions": [
    {
      "transaction_date": "YYYY-MM-DD",
      "description": "MERCHANT OR DESCRIPTION",
      "debit": 0.00,
      "credit": 0.00,
      "fx_currency": "USD",
      "fx_amount": 0.00
    }
  ],
  "parserConfig": {
    "bankName": "Full Bank Name",
    "cardType": "credit" | "debit",
    "keywords": ["lowercase keyword1", "lowercase keyword2"],
    "rowPattern": "regex pattern string matching one transaction line",
    "groups": { "date": 1, "description": 2, "amount": 3, "creditFlag": 4 },
    "dateFormat": "DD-MM-YYYY",
    "creditKeywords": ["PAYMENT RECEIVED", "REFUND"],
    "creditFlag": "CR",
    "periodFrom": "regex with group 1 capturing from-date string",
    "periodTo": "regex with group 1 capturing to-date string"
  }
}

Rules:
- debit: money going OUT (purchases, fees) — positive number, credit must be 0
- credit: money coming IN (payments, refunds) — positive number, debit must be 0
- All dates in YYYY-MM-DD ISO format
- Amounts as plain decimals — no currency symbols, no commas
- Include ALL rows: purchases, payments, fees, interest, reversals
- currency: the statement's settlement/base currency (e.g. "AED", "INR", "USD")
- fx_currency/fx_amount: only when a transaction was made in a different currency from the statement currency
- parserConfig.rowPattern must be a valid JavaScript regex string`;

interface AiParseRequest {
  pages: { page: number; lines: string[] }[];
}

export async function POST(request: NextRequest) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: 'AI parsing is not configured (missing ANTHROPIC_API_KEY)' }, { status: 503 });
  }

  let body: AiParseRequest;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  if (!Array.isArray(body?.pages) || body.pages.length === 0) {
    return NextResponse.json({ error: 'pages array is required' }, { status: 400 });
  }

  // Send first 3 pages max to keep token usage reasonable
  const samplePages = body.pages.slice(0, 3);
  const statementText = samplePages
    .map(p => `--- PAGE ${p.page} ---\n${p.lines.join('\n')}`)
    .join('\n\n');

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  let raw: string;
  try {
    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: `Parse this bank statement:\n\n${statementText}` }],
    });
    raw = message.content[0].type === 'text' ? message.content[0].text : '';
  } catch (err: any) {
    console.error('[ai-parse] Claude error:', err?.message);
    return NextResponse.json({ error: 'AI parsing failed. Please try again.' }, { status: 502 });
  }

  // Strip markdown fences if Claude wrapped the JSON
  const jsonStr = raw.replace(/^```(?:json)?\n?/m, '').replace(/\n?```$/m, '').trim();

  let parsed: any;
  try {
    parsed = JSON.parse(jsonStr);
  } catch {
    console.error('[ai-parse] Invalid JSON from Claude:', raw.slice(0, 300));
    return NextResponse.json({ error: 'AI returned invalid data. Please try again.' }, { status: 502 });
  }

  const pages: PageContent[] = body.pages.map(p => ({
    page: p.page,
    lines: p.lines,
    text: p.lines.join('\n'),
  }));

  // Normalize transactions through our standard pipeline
  const rawTxns = (parsed.transactions || []).map((t: any) => ({
    transaction_date: t.transaction_date || null,
    description: t.description || null,
    debit: Number(t.debit) || 0,
    credit: Number(t.credit) || 0,
    amount: Number(t.debit || t.credit) || 0,
    ...(t.fx_currency && { fx_currency: t.fx_currency }),
    ...(t.fx_amount && { fx_amount: Number(t.fx_amount) }),
    ...(t.fx_rate && { fx_rate: Number(t.fx_rate) }),
  }));

  const cardType: 'credit' | 'debit' =
    parsed.card_type === 'debit' ? 'debit' : 'credit';

  // Detect currency: prefer AI response, then scan the text
  const allText = body.pages.map(p => p.lines.join('\n')).join('\n');
  const currency: string = parsed.currency || detectCurrency(allText);

  const normalized = normalizeTransactions(rawTxns, parsed.bank || 'Unknown', cardType, currency);
  const summary = summarizeTransactions(normalized, currency);

  const suggestedConfig: ParserConfigData | null = parsed.parserConfig
    ? {
        bankName: parsed.parserConfig.bankName || parsed.bank || 'Unknown',
        cardType,
        currency,
        keywords: parsed.parserConfig.keywords || [],
        rowPattern: parsed.parserConfig.rowPattern || '',
        groups: parsed.parserConfig.groups || { date: 1, description: 2, amount: 3 },
        dateFormat: parsed.parserConfig.dateFormat || '',
        creditKeywords: parsed.parserConfig.creditKeywords,
        creditFlag: parsed.parserConfig.creditFlag,
        periodFrom: parsed.parserConfig.periodFrom,
        periodTo: parsed.parserConfig.periodTo,
      }
    : null;

  return NextResponse.json({
    bank: parsed.bank || 'Unknown',
    card_type: cardType,
    currency,
    from_date: parsed.from_date || null,
    to_date: parsed.to_date || null,
    summary,
    transactions: normalized,
    parsedBy: 'ai',
    suggestedConfig,
  });
}
