import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { normalizeTransactions, detectCurrency } from '@/lib/pdf/utils';
import type { ParserConfigData } from '@/lib/parsers/configParser';

export const runtime = 'nodejs';

const SYSTEM_PROMPT = `You are a bank statement parser expert. Deeply analyze this bank statement and identify every structural element needed to build a regex-based parser.

Return ONLY valid JSON — no markdown, no explanation, no code fences.

{
  "bankName": "Full Bank Name",
  "cardType": "credit" or "debit",
  "currency": "ISO 4217 code (AED, INR, USD, etc.)",

  "identification": {
    "keywords": ["2-4 unique lowercase words/phrases that identify this bank and statement type"],
    "sampleLines": ["up to 3 actual lines from the statement that contain these keywords"]
  },

  "statementPeriod": {
    "fromDate": "YYYY-MM-DD or null",
    "toDate": "YYYY-MM-DD or null",
    "dueDate": "YYYY-MM-DD or null — the payment due date if present",
    "fromPattern": "JavaScript regex with group 1 capturing the from-date string, or null",
    "toPattern": "JavaScript regex with group 1 capturing the to-date string, or null",
    "dueDatePattern": "JavaScript regex with group 1 capturing the due-date string, or null",
    "sampleLines": ["actual lines from the statement that contain these dates"]
  },

  "transactionStructure": {
    "rowPattern": "JavaScript regex (no delimiters) matching ONE transaction line with capture groups",
    "groups": {
      "date": 1,
      "description": 2,
      "amount": 3,
      "creditFlag": 4
    },
    "dateFormat": "format like DD/MM/YYYY or DD-MMM-YYYY or MM/DD/YYYY",
    "sampleMatchedLines": ["up to 3 actual transaction lines that the rowPattern matches"],
    "sampleUnmatchedLines": ["up to 2 non-transaction lines (headers, totals) that rowPattern must NOT match"]
  },

  "creditDebitRules": {
    "creditFlag": "token in the line marking a credit (e.g. CR) — null if unused",
    "creditKeywords": ["description keywords that mean money coming IN — payments, refunds, reversals"],
    "sampleCreditLines": ["up to 2 actual credit transaction lines"],
    "sampleDebitLines": ["up to 2 actual debit/purchase transaction lines"]
  },

  "columnHeaders": ["Date", "Description", "Amount (AED)", "..."],

  "transactions": [
    {
      "transaction_date": "YYYY-MM-DD",
      "description": "merchant or description text",
      "debit": 0.00,
      "credit": 0.00,
      "fx_currency": "ISO code or null",
      "fx_amount": 0.00
    }
  ]
}

CRITICAL RULES:
- rowPattern must be a valid JavaScript regex string with NO forward-slash delimiters
- If creditFlag group is not in rowPattern, omit creditFlag from groups object entirely
- debit: money going OUT (positive number, credit must be 0)
- credit: money coming IN (positive number, debit must be 0)
- Extract ALL transactions: purchases, payments, fees, interest, reversals
- All dates in YYYY-MM-DD format
- Amounts as plain decimals — no currency symbols, no commas
- sampleMatchedLines and sampleUnmatchedLines must be copied verbatim from the statement text
- columnHeaders: the exact column header names as they appear in the statement's transaction table (e.g. ["Date", "Transaction Description", "Transaction Currency", "Transaction Amount", "FX Rate", "Total Amount (AED)"])`;

export async function POST(request: NextRequest) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: 'AI parsing not configured (missing ANTHROPIC_API_KEY)' }, { status: 503 });
  }

  let body: { pages: { page: number; lines: string[] }[] };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  if (!Array.isArray(body?.pages) || body.pages.length === 0) {
    return NextResponse.json({ error: 'pages array is required' }, { status: 400 });
  }

  const samplePages = body.pages.slice(0, 3);
  const statementText = samplePages
    .map(p => `--- PAGE ${p.page} ---\n${p.lines.join('\n')}`)
    .join('\n\n');

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  let raw: string;
  try {
    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 8192,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: `Analyze this bank statement:\n\n${statementText}` }],
    });
    raw = message.content[0].type === 'text' ? message.content[0].text : '';
  } catch (err: any) {
    console.error('[ai-parse-guided] Claude error:', err?.message);
    return NextResponse.json({ error: 'AI analysis failed. Please try again.' }, { status: 502 });
  }

  const jsonStr = raw.replace(/^```(?:json)?\n?/m, '').replace(/\n?```$/m, '').trim();

  let parsed: any;
  try {
    parsed = JSON.parse(jsonStr);
  } catch {
    console.error('[ai-parse-guided] Invalid JSON:', raw.slice(0, 400));
    return NextResponse.json({ error: 'AI returned invalid data. Please try again.' }, { status: 502 });
  }

  const allText = body.pages.map(p => p.lines.join('\n')).join('\n');
  const currency: string = parsed.currency || detectCurrency(allText);
  const cardType: 'credit' | 'debit' = parsed.cardType === 'debit' ? 'debit' : 'credit';

  const rawTxns = (parsed.transactions || []).map((t: any) => ({
    transaction_date: t.transaction_date || null,
    description: t.description || null,
    debit: Number(t.debit) || 0,
    credit: Number(t.credit) || 0,
    amount: Number(t.debit || t.credit) || 0,
    ...(t.fx_currency && { fx_currency: t.fx_currency }),
    ...(t.fx_amount && { fx_amount: Number(t.fx_amount) }),
  }));
  const transactions = normalizeTransactions(rawTxns, parsed.bankName || 'Unknown', cardType, currency);

  const ts = parsed.transactionStructure || {};
  const cr = parsed.creditDebitRules || {};
  const sp = parsed.statementPeriod || {};
  const id = parsed.identification || {};

  const columnHeaders: string[] = Array.isArray(parsed.columnHeaders) ? parsed.columnHeaders : [];

  const suggestedConfig: ParserConfigData = {
    bankName: parsed.bankName || 'Unknown',
    cardType,
    currency,
    keywords: id.keywords || [],
    rowPattern: ts.rowPattern || '',
    groups: ts.groups || { date: 1, description: 2, amount: 3 },
    dateFormat: ts.dateFormat || '',
    creditKeywords: cr.creditKeywords?.length ? cr.creditKeywords : undefined,
    creditFlag: cr.creditFlag || undefined,
    periodFrom: sp.fromPattern || undefined,
    periodTo: sp.toPattern || undefined,
    dueDatePattern: sp.dueDatePattern || undefined,
    columnHeaders: columnHeaders.length ? columnHeaders : undefined,
  };

  return NextResponse.json({
    bankName: parsed.bankName || 'Unknown',
    cardType,
    currency,
    identification: {
      keywords: id.keywords || [],
      sampleLines: id.sampleLines || [],
    },
    statementPeriod: {
      fromDate: sp.fromDate || null,
      toDate: sp.toDate || null,
      dueDate: sp.dueDate || null,
      fromPattern: sp.fromPattern || null,
      toPattern: sp.toPattern || null,
      dueDatePattern: sp.dueDatePattern || null,
      sampleLines: sp.sampleLines || [],
    },
    transactionStructure: {
      rowPattern: ts.rowPattern || '',
      groups: ts.groups || { date: 1, description: 2, amount: 3 },
      dateFormat: ts.dateFormat || '',
      sampleMatchedLines: ts.sampleMatchedLines || [],
      sampleUnmatchedLines: ts.sampleUnmatchedLines || [],
    },
    creditDebitRules: {
      creditFlag: cr.creditFlag || null,
      creditKeywords: cr.creditKeywords || [],
      sampleCreditLines: cr.sampleCreditLines || [],
      sampleDebitLines: cr.sampleDebitLines || [],
    },
    transactions,
    suggestedConfig,
    columnHeaders,
  });
}
