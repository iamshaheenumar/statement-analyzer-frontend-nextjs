# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start dev server (Turbopack)
npm run build    # Production build
npm start        # Start production server
```

No lint or test scripts are configured.

## Architecture

This is a **Next.js 15 App Router** application for parsing bank statement PDFs and visualizing financial data. All parsing logic lives in-process — there is no separate backend service.

### Data Flow

1. User uploads a PDF on `/upload`
2. Browser extracts text with `pdfjs-dist` and POSTs `{ pages }` JSON to **`POST /api/parse`**
3. API route detects the bank and runs the correct parser — returns structured transaction data
4. Parsed statement data is staged in **IndexedDB** via `localforage` (database: `"BankDashboard"`, key: `"parsedStatements"`)
5. User reviews/edits transactions on `/view-parsed` — removals recalculate the summary in-place
6. User saves to cloud via a **Next.js Server Action** (`saveStatementAction`) which writes to **Supabase**
7. `/dashboard` and `/statements` read from Supabase for analytics

### Key Directories

- `src/app/` — App Router pages and API routes
- `src/app/api/parse/` — `POST /api/parse` — PDF parsing entry point
- `src/app/api/preview/` — `POST /api/preview` — raw text extraction for debugging
- `src/app/api/health/` — `GET /api/health` — liveness check
- `src/app/api/db/health/` — `GET /api/db/health` — DB connectivity check
- `src/app/api/transactions/` — month/available-months queries against Supabase
- `src/lib/pdf/` — foundational PDF layer (extract, utils, detectBank, types)
- `src/lib/parsers/` — one parser per bank + `index.ts` router
- `src/features/` — feature-scoped React components (`dashboard/`, `upload/`, `viewParsed/`, etc.)
- `src/services/` — Supabase client factory, localforage storage helpers
- `src/types/database.ts` — Supabase DB table types
- `src/utils/` — re-exports from `src/lib/` for backwards-compat

### PDF Parsing Layer (`src/lib/`)

```
src/lib/
  pdf/
    extract.ts      # PasswordError class (extraction runs client-side via pdfjs)
    utils.ts        # normalizeDate, normalizeTransactions, summarizeTransactions
    detectBank.ts   # detectBankFromText(lines) → bank key
    types.ts        # shared interfaces: Transaction, ParseResult, PageContent, etc.
  parsers/
    mashreq.ts      # Mashreq credit card
    enbd.ts         # Emirates NBD debit card
    emiratesislamic.ts
    rakbank.ts
    generic.ts      # fallback for unknown banks
    index.ts        # parseStatement(pages, bankOverride?) → ParseResult
```

PDF text extraction runs entirely in the browser — `pdfjs-dist` groups text items by Y coordinate to reconstruct layout-preserving lines (equivalent to pdfplumber). The API routes receive pre-extracted `{ pages: PageContent[] }` JSON and only run parser logic.

### Storage Layers

| Layer | Technology | Used For |
|---|---|---|
| Client-side | `localforage` (IndexedDB) | Staging parsed statements before cloud save |
| Server-side | Supabase (PostgreSQL) | Persisted statements and transactions |

### Database Schema (Supabase)

Two tables with a 1-to-many relationship (SQL in `supabase-setup.sql`):
- `statements` — summary fields: bank, date range, total_credit/debit, net_change, record_count
- `transactions` — individual rows linked to a statement via `statement_id` (cascade delete)

All server-side DB access goes through `createServerClient()` from `src/services/supabase.ts`, which uses the service role key and is **never imported in client components**.

### Environment Variables

```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...   # Server-side only, never NEXT_PUBLIC_
```

### Patterns to Know

- **Server Actions** are used for all database mutations (`saveStatementAction`, `deleteStatementAction` in `src/app/actions/`)
- **Suspense boundaries** wrap async server components on the dashboard
- **`@/*`** path alias maps to `src/*`
- `pdfjs-dist` is listed in `serverExternalPackages` in `next.config.ts` to avoid webpack bundling issues
- Client-side `src/services/parsePDF.ts` is kept only for browser-side PDF extraction and password detection
