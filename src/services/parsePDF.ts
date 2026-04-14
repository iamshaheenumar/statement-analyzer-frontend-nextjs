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

/**
 * Extract layout-preserving text lines from every page of a PDF.
 * Text items are grouped by their Y coordinate (same approach as pdfplumber).
 * Runs in the browser only — pdfjs-dist requires a DOM environment.
 */
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

    const rows: Record<number, string[]> = {};
    for (const item of content.items as any[]) {
      const str: string = item.str ?? "";
      if (!str.trim()) continue;
      const y = Math.round(item.transform[5]);
      if (!rows[y]) rows[y] = [];
      rows[y].push(str);
    }

    const lines = Object.keys(rows)
      .map(Number)
      .sort((a, b) => b - a)
      .map((y) => rows[y].join(" ").trim())
      .filter(Boolean);

    pages.push({ page: pageNum, lines });
  }

  return pages;
}
