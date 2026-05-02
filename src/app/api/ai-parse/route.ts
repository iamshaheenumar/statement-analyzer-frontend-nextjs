import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import type { PageContent } from "@/lib/pdf/types";
import {
  normalizeTransactions,
  summarizeTransactions,
  detectCurrency,
} from "@/lib/pdf/utils";
import type { ParserConfigData } from "@/lib/parsers/configParser";

export const runtime = "nodejs";

const MAX_PAGES = 50;

const SYSTEM_PROMPT = `You are a bank statement parser. Extract all transactions and summary fields from bank statement text and return ONLY valid JSON — no markdown, no explanation.

Return this exact structure:
{
  "bank": "Full Bank Name",
  "card_type": "credit" | "debit",
  "currency": "AED",
  "from_date": "YYYY-MM-DD" | null,
  "to_date": "YYYY-MM-DD" | null,
  "issued_date": "YYYY-MM-DD" | null,
  "card_variant": "Titanium Credit Card" | null,
  "credit_limit": 50000.00 | null,
  "available_credit": 32500.00 | null,
  "min_payment_due": 250.00 | null,
  "total_outstanding": 17500.00 | null,
  "total_amount_due": 17500.00 | null,
  "columnHeaders": ["Date", "Description", "Debit", "Credit", "Balance"],
  "transactions": [
    {
      "transaction_date": "YYYY-MM-DD",
      "description": "MERCHANT OR DESCRIPTION",
      "debit": 0.00,
      "credit": 0.00,
      "fx_currency": "USD",
      "fx_amount": 0.00,
      "rawCells": ["01/01/2025", "AMAZON.COM", "101.50", "", "5,432.10"]
    }
  ],
  "parserConfig": {
    "bankName": "Full Bank Name",
    "cardType": "credit" | "debit",
    "cardVariant": "titanium credit card",
    "keywords": ["lowercase keyword1", "lowercase keyword2"],
    "rowPattern": "regex pattern string matching one transaction line",
    "groups": { "date": 1, "description": 2, "amount": 3, "creditFlag": 4 },
    "dateFormat": "DD-MM-YYYY",
    "creditKeywords": ["PAYMENT RECEIVED", "REFUND"],
    "creditFlag": "CR",
    "periodFrom": "regex with group 1 capturing from-date string",
    "periodTo": "regex with group 1 capturing to-date string",
    "issuedDatePattern": "regex with group 1 capturing issued date",
    "cardVariantPattern": "regex with group 1 capturing card variant name",
    "creditLimitPattern": "regex with group 1 capturing credit limit amount",
    "availableCreditPattern": "regex with group 1 capturing available credit amount",
    "minPaymentPattern": "regex with group 1 capturing minimum payment due",
    "totalOutstandingPattern": "regex with group 1 capturing total outstanding balance",
    "totalAmountDuePattern": "regex with group 1 capturing total amount due",
    "columnHeaders": ["Date", "Description", "Amount", "..."]
  }
}

Rules:
- debit: money going OUT (purchases, fees) — positive number, credit must be 0
- credit: money coming IN (payments, refunds) — positive number, debit must be 0
- All dates in YYYY-MM-DD ISO format
- Amounts as plain decimals — no currency symbols, no commas
- Include ALL rows: purchases, payments, fees, interest, reversals
- currency: the statement's settlement/base currency (e.g. "AED", "INR", "USD")
- issued_date: the date the statement was generated/issued (not the period dates)
- card_variant: the specific card product name (e.g. "Titanium Credit Card", "VISA INFINITE", "Platinum Debit")
- credit_limit/available_credit: only for credit cards, null for debit
- fx_currency/fx_amount: only when a transaction was made in a different currency from the statement currency
- columnHeaders: the exact column names from the statement's table header row
- rawCells: MUST have exactly the same number of elements as columnHeaders, in the same column order — use "" for any column that is empty or not applicable for that row (e.g. a debit-only row gets "" in the Credit column, a carried-forward row gets "" in Debit and Credit columns)
- All regex patterns must be valid JavaScript regex strings (no forward-slash delimiters)`;

interface AiParseRequest {
  pages: { page: number; lines: string[] }[];
}

/**
 * Strip markdown code fences from Claude's response.
 * Tries to parse raw first; only strips fences if that fails.
 */
function extractJson(raw: string): string {
  const trimmed = raw.trim();

  // Happy path: already valid JSON
  try {
    JSON.parse(trimmed);
    return trimmed;
  } catch {
    // Fall through to fence stripping
  }

  // Strip ```json ... ``` or ``` ... ``` (case-insensitive, with optional whitespace)
  const fenceMatch = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  if (fenceMatch) return fenceMatch[1].trim();

  // Last resort: strip a leading fence and trailing fence separately
  return trimmed
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
}

/**
 * Build the suggestedConfig object from Claude's parsed output.
 */
function buildParserConfig(
  parsed: any,
  cardType: "credit" | "debit",
  currency: string,
  columnHeaders: string[],
): ParserConfigData | null {
  const pc = parsed.parserConfig;
  if (!pc) return null;

  return {
    bankName: pc.bankName || parsed.bank || "Unknown",
    cardType,
    currency,
    cardVariant: pc.cardVariant || undefined,
    keywords: pc.keywords || [],
    rowPattern: pc.rowPattern || "",
    groups: pc.groups || { date: 1, description: 2, amount: 3 },
    dateFormat: pc.dateFormat || "",
    creditKeywords: pc.creditKeywords,
    creditFlag: pc.creditFlag,
    periodFrom: pc.periodFrom,
    periodTo: pc.periodTo,
    issuedDatePattern: pc.issuedDatePattern,
    cardVariantPattern: pc.cardVariantPattern,
    creditLimitPattern: pc.creditLimitPattern,
    availableCreditPattern: pc.availableCreditPattern,
    minPaymentPattern: pc.minPaymentPattern,
    totalOutstandingPattern: pc.totalOutstandingPattern,
    totalAmountDuePattern: pc.totalAmountDuePattern,
    columnHeaders: pc.columnHeaders?.length
      ? pc.columnHeaders
      : columnHeaders.length
        ? columnHeaders
        : undefined,
  };
}

export async function POST(request: NextRequest) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: "AI parsing is not configured (missing ANTHROPIC_API_KEY)" },
      { status: 503 },
    );
  }

  let body: AiParseRequest;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!Array.isArray(body?.pages) || body.pages.length === 0) {
    return NextResponse.json(
      { error: "pages array is required" },
      { status: 400 },
    );
  }

  // Guard against oversized payloads
  if (body.pages.length > MAX_PAGES) {
    return NextResponse.json(
      { error: `Too many pages (max ${MAX_PAGES})` },
      { status: 400 },
    );
  }

  const statementText = body.pages
    .map((p) => `--- PAGE ${p.page} ---\n${p.lines.join("\n")}`)
    .join("\n\n");

  // Client-level timeout so the request doesn't hang indefinitely
  const client = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
    timeout: 90_000, // 90 seconds
  });

  let raw: string;
  try {
    const message = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 16000,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: `Parse this bank statement:\n\n${statementText}`,
        },
      ],
    });

    // Safely find the first text block instead of blindly indexing
    const textBlock = message.content.find((b) => b.type === "text");
    raw = textBlock?.type === "text" ? textBlock.text : "";
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[ai-parse] Claude error:", message);
    return NextResponse.json(
      { error: "AI parsing failed. Please try again." },
      { status: 502 },
    );
  }

  if (!raw) {
    console.error("[ai-parse] Claude returned no text content");
    return NextResponse.json(
      { error: "AI returned empty response. Please try again." },
      { status: 502 },
    );
  }

  const jsonStr = extractJson(raw);

  let parsed: any;
  try {
    parsed = JSON.parse(jsonStr);
  } catch {
    console.error("[ai-parse] Invalid JSON from Claude:", raw.slice(0, 300));
    return NextResponse.json(
      { error: "AI returned invalid data. Please try again." },
      { status: 502 },
    );
  }

  const pages: PageContent[] = body.pages.map((p) => ({
    page: p.page,
    lines: p.lines,
    text: p.lines.join("\n"),
  }));

  const columnHeaders: string[] = Array.isArray(parsed.columnHeaders)
    ? parsed.columnHeaders
    : [];
  const rawRows: string[][] = [];

  const rawTxns = (parsed.transactions || []).map((t: any) => {
    if (Array.isArray(t.rawCells)) {
      const cells = t.rawCells.map(String);
      if (columnHeaders.length > 0) {
        while (cells.length < columnHeaders.length) cells.push("");
        cells.length = columnHeaders.length;
      }
      rawRows.push(cells);
    }

    const debit = parseFloat(t.debit) || 0;
    const credit = parseFloat(t.credit) || 0;

    return {
      transaction_date: t.transaction_date || null,
      description: t.description || null,
      debit,
      credit,
      // Prefer debit; fall back to credit (never double-count)
      amount: debit || credit,
      ...(t.fx_currency && { fx_currency: t.fx_currency }),
      ...(t.fx_amount != null && { fx_amount: parseFloat(t.fx_amount) }),
      ...(t.fx_rate != null && { fx_rate: parseFloat(t.fx_rate) }),
    };
  });

  const cardType: "credit" | "debit" =
    parsed.card_type === "debit" ? "debit" : "credit";

  const allText = body.pages.map((p) => p.lines.join("\n")).join("\n");
  const currency: string = parsed.currency || detectCurrency(allText);

  const normalized = normalizeTransactions(
    rawTxns,
    parsed.bank || "Unknown",
    cardType,
    currency,
  );
  const summary = summarizeTransactions(normalized, currency);
  const suggestedConfig = buildParserConfig(
    parsed,
    cardType,
    currency,
    columnHeaders,
  );

  return NextResponse.json({
    bank: parsed.bank || "Unknown",
    card_type: cardType,
    currency,
    from_date: parsed.from_date || null,
    to_date: parsed.to_date || null,
    issued_date: parsed.issued_date || null,
    card_variant: parsed.card_variant || null,
    credit_limit: parsed.credit_limit ?? null,
    available_credit: parsed.available_credit ?? null,
    min_payment_due: parsed.min_payment_due ?? null,
    total_outstanding: parsed.total_outstanding ?? null,
    total_amount_due: parsed.total_amount_due ?? null,
    summary,
    transactions: normalized,
    parsedBy: "ai",
    suggestedConfig,
    ...(columnHeaders.length && rawRows.length
      ? { originalHeaders: columnHeaders, rawRows }
      : {}),
  });
}
