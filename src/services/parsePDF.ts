import * as pdfjsLib from "pdfjs-dist";

// Worker is only needed in the browser; the path is served from /public.
if (typeof window !== "undefined") {
  pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
}

export async function checkIsPasswordProtected(file: File): Promise<boolean> {
  if (typeof window === "undefined") return false;
  try {
    const buffer = await file.arrayBuffer();
    await pdfjsLib.getDocument({ data: buffer }).promise;
    return false;
  } catch (error: any) {
    return error?.message?.toLowerCase().includes("password");
  }
}

export interface PdfPage {
  page: number;
  lines: string[];
}

// Horizontal gap (PDF units) that separates distinct columns.
const COLUMN_GAP = 40;
// Max vertical gap for a row to be treated as a wrapped continuation line.
const CONTINUATION_Y_GAP = 30;

// Returns the right edge of the leftmost column (the date/anchor column).
function anchorBoundary(xValues: number[]): number {
  if (xValues.length === 0) return 0;
  const sorted = [...xValues].sort((a, b) => a - b);
  let boundary = sorted[0];
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i] - sorted[i - 1] > COLUMN_GAP) break;
    boundary = sorted[i];
  }
  return boundary + 10; // small tolerance
}

// Rows without an anchor-column item that sit within CONTINUATION_Y_GAP of
// the previous row are merged into it (handles wrapped description lines).
export async function extractPdfPages(
  file: File,
  password?: string
): Promise<PdfPage[]> {
  const buffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: buffer, password }).promise;

  const pages: PdfPage[] = [];

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const content = await page.getTextContent();

    const items: { x: number; y: number; text: string }[] = [];
    for (const item of content.items as any[]) {
      const text: string = item.str ?? "";
      if (!text.trim()) continue;
      items.push({
        x: Math.round(item.transform[4]),
        y: Math.round(item.transform[5]),
        text,
      });
    }

    const rowMap = new Map<number, { x: number; text: string }[]>();
    for (const item of items) {
      if (!rowMap.has(item.y)) rowMap.set(item.y, []);
      rowMap.get(item.y)!.push({ x: item.x, text: item.text });
    }

    const anchor = anchorBoundary(items.map((i) => i.x));

    const sortedYs = [...rowMap.keys()].sort((a, b) => b - a);

    const lines: string[] = [];
    let lastY: number | null = null;

    for (const y of sortedYs) {
      const cells = rowMap.get(y)!.sort((a, b) => a.x - b.x);
      const text = cells.map((c) => c.text).join(" ").trim();
      if (!text) continue;

      const hasAnchor = cells.some((c) => c.x <= anchor);
      const isContinuation =
        !hasAnchor &&
        lines.length > 0 &&
        lastY !== null &&
        lastY - y <= CONTINUATION_Y_GAP;

      if (isContinuation) {
        lines[lines.length - 1] += " " + text;
      } else {
        lines.push(text);
      }
      lastY = y;
    }

    pages.push({ page: pageNum, lines });
  }

  return pages;
}
