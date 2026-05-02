import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { normalizeTransactions, detectCurrency } from '@/lib/pdf/utils';
import type { ParserConfigData } from '@/lib/parsers/configParser';

export const runtime = 'nodejs';

const SYSTEM_PROMPT = `You are a bank statement parser expert. You are given N statement samples from THE SAME bank/card. Analyze ALL samples together and identify patterns that are consistent across them.

Return ONLY valid JSON — no markdown, no explanation, no code fences.

For these five fields — rowPattern, fromPattern, toPattern, issuedDatePattern, dueDatePattern — return a pattern object instead of a plain string:
{ "primary": "regex string", "alternatives": ["fallback1", "fallback2"], "confidence": 0.9 }
where confidence = fraction of samples where the primary pattern would match (0.0 to 1.0).
If a field doesn't apply, return null.

All other fields follow the standard format below.

{
  "bankName": "Full Bank Name",
  "cardType": "credit" or "debit",
  "currency": "ISO 4217 code (AED, INR, USD, etc.)",
  "cardVariant": "Titanium Credit Card" | null,

  "identification": {
    "keywords": ["2-4 unique lowercase words/phrases that identify this bank — do NOT include card type words like 'credit' or 'debit'"],
    "sampleLines": ["up to 3 actual lines from the statement that contain these keywords"]
  },

  "statementPeriod": {
    "fromDate": "YYYY-MM-DD or null",
    "toDate": "YYYY-MM-DD or null",
    "issuedDate": "YYYY-MM-DD or null",
    "dueDate": "YYYY-MM-DD or null",
    "fromPattern": { "primary": "JS regex group 1 = from-date string", "alternatives": [], "confidence": 0.9 } | null,
    "toPattern": { "primary": "...", "alternatives": [], "confidence": 0.9 } | null,
    "issuedDatePattern": { "primary": "...", "alternatives": [], "confidence": 0.9 } | null,
    "dueDatePattern": { "primary": "...", "alternatives": [], "confidence": 0.9 } | null,
    "sampleLines": ["actual lines from the statement that contain these dates"]
  },

  "summaryFields": {
    "cardVariantPattern": { "primary": "label-anchor or same-line capture — see lineWindow rules below", "alternatives": [], "confidence": 0.9, "lineWindow": null } | null,
    "creditLimit": 50000.00 | null,
    "creditLimitPattern": { "primary": "label-anchor or same-line capture — see lineWindow rules below", "alternatives": [], "confidence": 0.9, "lineWindow": null } | null,
    "availableCredit": 32500.00 | null,
    "availableCreditPattern": { "primary": "label-anchor or same-line capture — see lineWindow rules below", "alternatives": [], "confidence": 0.9, "lineWindow": null } | null,
    "minPaymentDue": 250.00 | null,
    "minPaymentPattern": { "primary": "label-anchor or same-line capture — see lineWindow rules below", "alternatives": [], "confidence": 0.9, "lineWindow": null } | null,
    "totalOutstanding": 17500.00 | null,
    "totalOutstandingPattern": { "primary": "label-anchor or same-line capture — see lineWindow rules below", "alternatives": [], "confidence": 0.9, "lineWindow": null } | null,
    "totalAmountDue": 17500.00 | null,
    "totalAmountDuePattern": { "primary": "label-anchor or same-line capture — see lineWindow rules below", "alternatives": [], "confidence": 0.9, "lineWindow": null } | null,
    "sampleLines": ["actual lines from the statement containing these summary values"]
  },

  "transactionStructure": {
    "rowPattern": { "primary": "JS regex matching ONE transaction line with capture groups", "alternatives": ["alt if layout varies across samples"], "confidence": 1.0 },
    "transactionStartPattern": "JS regex anchored at ^ matching the FIRST line of a multi-line transaction (e.g. a date prefix like ^\\\\d{2}[A-Z]{3}\\\\d{2}\\\\s+). When set, lines are accumulated into a block until the next match, then rowPattern is applied to the joined block. Set to null for single-line statements.",
    "groups": { "date": 1, "description": 2, "amount": 3, "creditFlag": 4 },
    "dateFormat": "DD/MM/YYYY or DD-MMM-YYYY etc.",
    "sampleMatchedLines": ["up to 3 actual transaction lines that the primary rowPattern matches"],
    "sampleUnmatchedLines": ["up to 2 non-transaction lines that rowPattern must NOT match"]
  },

  "creditDebitRules": {
    "creditFlag": "token marking a credit (e.g. CR) — null if unused",
    "creditKeywords": ["description keywords meaning money coming IN"],
    "sampleCreditLines": ["up to 2 actual credit transaction lines"],
    "sampleDebitLines": ["up to 2 actual debit/purchase transaction lines"]
  },

  "columnHeaders": ["Date", "Description", "Amount (AED)", "..."],

  "transactions": [
    { "transaction_date": "YYYY-MM-DD", "description": "text", "debit": 0.00, "credit": 0.00, "fx_currency": null, "fx_amount": null }
  ],

  "overallConfidence": 0.92
}

CRITICAL RULES:
- All regex strings must be valid JavaScript regex with NO forward-slash delimiters
- If creditFlag group is not in rowPattern, omit creditFlag from groups entirely
- debit: money going OUT (positive, credit must be 0); credit: money coming IN (positive, debit must be 0)
- identification.keywords must NOT include card type words ("credit", "debit", "card")
- Amounts as plain decimals — no currency symbols, no commas
- transactions array should include representative samples from the FIRST sample only (up to 20)
- For patterns with confidence < 1.0, provide at least one alternative that covers the remaining samples
- summaryFields lineWindow rules — READ CAREFULLY:
  Each pattern is matched against ONE LINE AT A TIME. NEVER use \\n, [\\s\\S], or any multi-line construct in a summary field pattern.
  Determine lineWindow by inspecting the sampleLines:
  • lineWindow = null  → label and value are on the SAME line. The primary regex must capture the value in group 1.
      Label line example: "Credit Limit  AED 50,000.00"
      CORRECT: { "primary": "Credit Limit.*?([\\d,]+\\.\\d{2})", "lineWindow": null }
  • lineWindow = 1     → value is on the NEXT line after the label. The primary regex is a label-only anchor — group 1 is NOT needed or used.
      Label line example: "Total Amount Due* ﻟ ﻠ ﺪ ﻓ ﻊ..."   Next line: "12,483.50"
      CORRECT: { "primary": "Total Amount Due\\*", "lineWindow": 1 }
      WRONG:   { "primary": "Total Amount Due\\*[\\s\\S]*?\\n([\\d,]+\\.\\d{2})", "lineWindow": 1 }
  • lineWindow = -1    → value is on the PREVIOUS line. Same rule: label-only anchor, no group 1.
  • lineWindow = 2     → value is 2 lines after the label, and so on.`;

interface PatternObj {
  primary: string;
  alternatives: string[];
  confidence: number;
  lineWindow?: number;
}

function extractPatternField(raw: unknown): PatternObj | null {
  if (!raw) return null;
  if (typeof raw === 'string') return { primary: raw, alternatives: [], confidence: 1.0 };
  if (typeof raw === 'object' && raw !== null) {
    const obj = raw as Record<string, unknown>;
    return {
      primary: String(obj.primary || ''),
      alternatives: Array.isArray(obj.alternatives) ? obj.alternatives.map(String) : [],
      confidence: typeof obj.confidence === 'number' ? obj.confidence : 1.0,
      lineWindow: typeof obj.lineWindow === 'number' ? obj.lineWindow : undefined,
    };
  }
  return null;
}

export async function POST(request: NextRequest) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: 'AI parsing not configured (missing ANTHROPIC_API_KEY)' }, { status: 503 });
  }

  let body: { samples: Array<{ filename: string; pages: { page: number; lines: string[] }[] }> };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  if (!Array.isArray(body?.samples) || body.samples.length === 0) {
    return NextResponse.json({ error: 'samples array is required' }, { status: 400 });
  }

  const statementText = body.samples
    .map((s, i) => {
      const pages = s.pages.slice(0, 2);
      const text = pages.map(p => `--- PAGE ${p.page} ---\n${p.lines.join('\n')}`).join('\n\n');
      return `=== SAMPLE ${i + 1} (${s.filename}) ===\n${text}`;
    })
    .join('\n\n');

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  let raw: string;
  try {
    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 8192,
      system: SYSTEM_PROMPT,
      messages: [{
        role: 'user',
        content: `Analyze these ${body.samples.length} bank statement sample(s) from the same bank:\n\n${statementText}`,
      }],
    });
    raw = message.content[0].type === 'text' ? message.content[0].text : '';
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    console.error('[ai-analyze-samples] Claude error:', msg);
    return NextResponse.json({ error: 'AI analysis failed. Please try again.' }, { status: 502 });
  }

  let jsonStr = raw.trim().replace(/^```[^\r\n]*\r?\n/, '').replace(/\r?\n```\s*$/, '').replace(/,(\s*[}\]])/g, '$1').trim();

  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(jsonStr);
  } catch {
    console.error('[ai-analyze-samples] Invalid JSON:', raw.slice(0, 400));
    return NextResponse.json({ error: 'AI returned invalid data. Please try again.' }, { status: 502 });
  }

  const allText = body.samples.flatMap(s => s.pages).map(p => p.lines.join('\n')).join('\n');
  const currency: string = (parsed.currency as string) || detectCurrency(allText);
  const cardType: 'credit' | 'debit' = parsed.cardType === 'debit' ? 'debit' : 'credit';

  const ts = (parsed.transactionStructure as Record<string, unknown>) || {};
  const cr = (parsed.creditDebitRules as Record<string, unknown>) || {};
  const sp = (parsed.statementPeriod as Record<string, unknown>) || {};
  const id = (parsed.identification as Record<string, unknown>) || {};
  const sf = (parsed.summaryFields as Record<string, unknown>) || {};

  const rowPat = extractPatternField(ts.rowPattern);
  const fromPat = extractPatternField(sp.fromPattern);
  const toPat = extractPatternField(sp.toPattern);
  const issuedPat = extractPatternField(sp.issuedDatePattern);
  const duePat = extractPatternField(sp.dueDatePattern);

  const cardVariantPat = extractPatternField(sf.cardVariantPattern);
  const creditLimitPat = extractPatternField(sf.creditLimitPattern);
  const availableCreditPat = extractPatternField(sf.availableCreditPattern);
  const minPaymentPat = extractPatternField(sf.minPaymentPattern);
  const totalOutstandingPat = extractPatternField(sf.totalOutstandingPattern);
  const totalAmountDuePat = extractPatternField(sf.totalAmountDuePattern);

  function toPatternField(pat: ReturnType<typeof extractPatternField>): string | string[] | undefined {
    if (!pat?.primary) return undefined;
    const all = [pat.primary, ...pat.alternatives].filter(Boolean);
    return all.length > 1 ? all : all[0];
  }

  const columnHeaders: string[] = Array.isArray(parsed.columnHeaders) ? (parsed.columnHeaders as string[]) : [];

  const groupsRaw = (ts.groups as Record<string, number>) || {};
  const groups: ParserConfigData['groups'] = {
    date: groupsRaw.date ?? 1,
    description: groupsRaw.description ?? 2,
    amount: groupsRaw.amount ?? 3,
  };
  if (groupsRaw.creditFlag) groups.creditFlag = groupsRaw.creditFlag;

  const suggestedConfig: ParserConfigData = {
    bankName: (parsed.bankName as string) || 'Unknown',
    cardType,
    currency,
    cardVariant: (parsed.cardVariant as string) || undefined,
    keywords: (id.keywords as string[]) || [],
    rowPattern: toPatternField(rowPat) || '',
    transactionStartPattern: typeof ts.transactionStartPattern === 'string' && ts.transactionStartPattern ? ts.transactionStartPattern : undefined,
    groups,
    dateFormat: (ts.dateFormat as string) || '',
    creditKeywords: Array.isArray(cr.creditKeywords) && (cr.creditKeywords as string[]).length ? (cr.creditKeywords as string[]) : undefined,
    creditFlag: (cr.creditFlag as string) || undefined,
    periodFrom: toPatternField(fromPat),
    periodTo: toPatternField(toPat),
    issuedDatePattern: toPatternField(issuedPat),
    dueDatePattern: toPatternField(duePat),
    cardVariantPattern: toPatternField(cardVariantPat),
    creditLimitPattern: toPatternField(creditLimitPat),
    availableCreditPattern: toPatternField(availableCreditPat),
    minPaymentPattern: toPatternField(minPaymentPat),
    totalOutstandingPattern: toPatternField(totalOutstandingPat),
    totalAmountDuePattern: toPatternField(totalAmountDuePat),
    cardVariantWindow: cardVariantPat?.lineWindow ?? undefined,
    creditLimitWindow: creditLimitPat?.lineWindow ?? undefined,
    availableCreditWindow: availableCreditPat?.lineWindow ?? undefined,
    minPaymentWindow: minPaymentPat?.lineWindow ?? undefined,
    totalOutstandingWindow: totalOutstandingPat?.lineWindow ?? undefined,
    totalAmountDueWindow: totalAmountDuePat?.lineWindow ?? undefined,
    columnHeaders: columnHeaders.length ? columnHeaders : undefined,
  };

  const baseConfidence: Record<string, number> = {
    rowPattern: rowPat?.confidence ?? 1.0,
    periodFrom: fromPat?.confidence ?? (fromPat ? 1.0 : 0),
    periodTo: toPat?.confidence ?? (toPat ? 1.0 : 0),
    issuedDate: issuedPat?.confidence ?? (issuedPat ? 1.0 : 0),
    ...(cardType === 'credit' ? {
      dueDate: duePat?.confidence ?? (duePat ? 1.0 : 0),
      creditLimit: creditLimitPat?.confidence ?? (creditLimitPat ? 1.0 : 0),
      availableCredit: availableCreditPat?.confidence ?? (availableCreditPat ? 1.0 : 0),
      minPayment: minPaymentPat?.confidence ?? (minPaymentPat ? 1.0 : 0),
      totalOutstanding: totalOutstandingPat?.confidence ?? (totalOutstandingPat ? 1.0 : 0),
      totalAmountDue: totalAmountDuePat?.confidence ?? (totalAmountDuePat ? 1.0 : 0),
    } : {}),
  };
  const fieldVals = Object.values(baseConfidence);
  const confidence = {
    ...baseConfidence,
    overall: fieldVals.length > 0
      ? fieldVals.reduce((a, b) => a + b, 0) / fieldVals.length
      : 1.0,
  };

  suggestedConfig._meta = { confidence, sampleCount: body.samples.length };

  const alternativePatterns: Record<string, string[]> = {};
  if (rowPat?.alternatives.length) alternativePatterns.rowPattern = rowPat.alternatives;
  if (fromPat?.alternatives.length) alternativePatterns.periodFrom = fromPat.alternatives;
  if (toPat?.alternatives.length) alternativePatterns.periodTo = toPat.alternatives;
  if (issuedPat?.alternatives.length) alternativePatterns.issuedDatePattern = issuedPat.alternatives;
  if (duePat?.alternatives.length) alternativePatterns.dueDatePattern = duePat.alternatives;
  if (creditLimitPat?.alternatives.length) alternativePatterns.creditLimitPattern = creditLimitPat.alternatives;
  if (availableCreditPat?.alternatives.length) alternativePatterns.availableCreditPattern = availableCreditPat.alternatives;
  if (minPaymentPat?.alternatives.length) alternativePatterns.minPaymentPattern = minPaymentPat.alternatives;
  if (totalOutstandingPat?.alternatives.length) alternativePatterns.totalOutstandingPattern = totalOutstandingPat.alternatives;
  if (totalAmountDuePat?.alternatives.length) alternativePatterns.totalAmountDuePattern = totalAmountDuePat.alternatives;

  const rawTxns = (Array.isArray(parsed.transactions) ? parsed.transactions : []).map((t: unknown) => {
    const tx = t as Record<string, unknown>;
    const out: Record<string, unknown> = {
      transaction_date: String(tx.transaction_date || ''),
      description: String(tx.description || ''),
      debit: Number(tx.debit) || 0,
      credit: Number(tx.credit) || 0,
      amount: Number(tx.debit || tx.credit) || 0,
    };
    if (tx.fx_currency) out.fx_currency = String(tx.fx_currency);
    if (tx.fx_amount) out.fx_amount = Number(tx.fx_amount);
    return out;
  });
  const transactions = normalizeTransactions(rawTxns, suggestedConfig.bankName, cardType, currency);

  return NextResponse.json({
    bankName: suggestedConfig.bankName,
    cardType,
    currency,
    cardVariant: suggestedConfig.cardVariant || null,
    identification: { keywords: (id.keywords as string[]) || [], sampleLines: (id.sampleLines as string[]) || [] },
    statementPeriod: {
      fromDate: (sp.fromDate as string) || null,
      toDate: (sp.toDate as string) || null,
      issuedDate: (sp.issuedDate as string) || null,
      dueDate: (sp.dueDate as string) || null,
      fromPattern: fromPat?.primary || null,
      toPattern: toPat?.primary || null,
      issuedDatePattern: issuedPat?.primary || null,
      dueDatePattern: duePat?.primary || null,
      sampleLines: (sp.sampleLines as string[]) || [],
    },
    summaryFields: {
      cardVariantPattern: sf.cardVariantPattern || null,
      creditLimit: sf.creditLimit ?? null,
      creditLimitPattern: sf.creditLimitPattern || null,
      availableCredit: sf.availableCredit ?? null,
      availableCreditPattern: sf.availableCreditPattern || null,
      minPaymentDue: sf.minPaymentDue ?? null,
      minPaymentPattern: sf.minPaymentPattern || null,
      totalOutstanding: sf.totalOutstanding ?? null,
      totalOutstandingPattern: sf.totalOutstandingPattern || null,
      totalAmountDue: sf.totalAmountDue ?? null,
      totalAmountDuePattern: sf.totalAmountDuePattern || null,
      sampleLines: (sf.sampleLines as string[]) || [],
    },
    transactionStructure: {
      rowPattern: rowPat?.primary || '',
      groups,
      dateFormat: (ts.dateFormat as string) || '',
      sampleMatchedLines: (ts.sampleMatchedLines as string[]) || [],
      sampleUnmatchedLines: (ts.sampleUnmatchedLines as string[]) || [],
    },
    creditDebitRules: {
      creditFlag: (cr.creditFlag as string) || null,
      creditKeywords: (cr.creditKeywords as string[]) || [],
      sampleCreditLines: (cr.sampleCreditLines as string[]) || [],
      sampleDebitLines: (cr.sampleDebitLines as string[]) || [],
    },
    transactions,
    suggestedConfig,
    columnHeaders,
    confidence,
    alternativePatterns,
    sampleHints: {
      matchedLines: (ts.sampleMatchedLines as string[]) || [],
      unmatchedLines: (ts.sampleUnmatchedLines as string[]) || [],
      creditLines: (cr.sampleCreditLines as string[]) || [],
      debitLines: (cr.sampleDebitLines as string[]) || [],
    },
  });
}
