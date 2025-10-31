import * as pdfjsLib from "pdfjs-dist";
pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

export async function checkIsPasswordProtected(file: File): Promise<boolean> {
  // 🧱 Prevent execution in Node.js (SSR)
  if (typeof window === "undefined") {
    return false;
  }

  try {
    const buffer = await file.arrayBuffer();
    await pdfjsLib.getDocument({ data: buffer }).promise;
    return false;
  } catch (error: any) {
    return error?.message?.toLowerCase().includes("password");
  }
}

export async function parseLocalPdf(file: File, password?: string) {
  const buffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: buffer, password }).promise;

  const lines: string[] = [];

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const content = await page.getTextContent();

    // Group text by vertical position (Y)
    const rows: Record<number, string[]> = {};
    (content.items as any[]).forEach((item) => {
      const y = Math.round(item.transform[5]);
      if (!rows[y]) rows[y] = [];
      rows[y].push(item.str);
    });

    const sorted = Object.keys(rows)
      .map(Number)
      .sort((a, b) => b - a)
      .map((y) => rows[y].join(" ").trim());

    lines.push(...sorted);
  }

  return {
    pageCount: pdf.numPages,
    lines,
  };
}
