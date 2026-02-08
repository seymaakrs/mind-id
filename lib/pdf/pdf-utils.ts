import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// Layout constants
const LEFT = 14;
const RIGHT = 196;
const CONTENT_WIDTH = RIGHT - LEFT; // 182mm usable width
const BOTTOM_MARGIN = 20;

const FONT_NAME = "Roboto";

// Colors
const COLORS = {
  primary: [30, 64, 175] as [number, number, number],
  green: [34, 197, 94] as [number, number, number],
  yellow: [234, 179, 8] as [number, number, number],
  orange: [249, 115, 22] as [number, number, number],
  red: [239, 68, 68] as [number, number, number],
  gray: [107, 114, 128] as [number, number, number],
  darkGray: [55, 65, 81] as [number, number, number],
  lightGray: [229, 231, 235] as [number, number, number],
  white: [255, 255, 255] as [number, number, number],
  black: [17, 24, 39] as [number, number, number],
};

// ─── Font Loading ────────────────────────────────────────
async function loadFont(doc: jsPDF, url: string, fontName: string, style: string): Promise<void> {
  const response = await fetch(url);
  const buffer = await response.arrayBuffer();

  // Convert ArrayBuffer to base64
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  const base64 = btoa(binary);

  const fileName = `${fontName}-${style}.ttf`;
  doc.addFileToVFS(fileName, base64);
  doc.addFont(fileName, fontName, style);
}

async function registerFonts(doc: jsPDF): Promise<void> {
  await Promise.all([
    loadFont(doc, "/fonts/Roboto-Regular.ttf", FONT_NAME, "normal"),
    loadFont(doc, "/fonts/Roboto-Bold.ttf", FONT_NAME, "bold"),
  ]);
}

// ─── Helpers ─────────────────────────────────────────────
function pageH(doc: jsPDF): number {
  return doc.internal.pageSize.getHeight();
}

function ensureSpace(doc: jsPDF, y: number, needed: number): number {
  if (y + needed > pageH(doc) - BOTTOM_MARGIN) {
    doc.addPage();
    return 15;
  }
  return y;
}

export function getScoreRgb(score: number): [number, number, number] {
  if (score >= 80) return COLORS.green;
  if (score >= 60) return COLORS.yellow;
  if (score >= 40) return COLORS.orange;
  return COLORS.red;
}

// ─── Document Creation ───────────────────────────────────
export async function createPdfDoc(title: string): Promise<jsPDF> {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  // Load custom fonts for Turkish character support
  await registerFonts(doc);

  // Title
  doc.setFont(FONT_NAME, "bold");
  doc.setFontSize(18);
  doc.setTextColor(...COLORS.black);
  const titleLines: string[] = doc.splitTextToSize(title, CONTENT_WIDTH);
  doc.text(titleLines, LEFT, 20);
  const titleEndY = 20 + (titleLines.length - 1) * 7;

  // Date
  const now = new Date();
  const dateStr = now.toLocaleDateString("tr-TR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
  doc.setFont(FONT_NAME, "normal");
  doc.setFontSize(9);
  doc.setTextColor(...COLORS.gray);
  doc.text(`Olusturulma: ${dateStr}`, LEFT, titleEndY + 7);

  // Separator line
  doc.setDrawColor(...COLORS.lightGray);
  doc.setLineWidth(0.5);
  doc.line(LEFT, titleEndY + 10, RIGHT, titleEndY + 10);

  return doc;
}

// ─── Section Title ───────────────────────────────────────
export function addSectionTitle(doc: jsPDF, title: string, y: number): number {
  y = ensureSpace(doc, y, 15);
  doc.setFont(FONT_NAME, "bold");
  doc.setFontSize(13);
  doc.setTextColor(...COLORS.black);
  const lines: string[] = doc.splitTextToSize(title, CONTENT_WIDTH);
  doc.text(lines, LEFT, y);
  const lastLineY = y + (lines.length - 1) * 6;
  doc.setDrawColor(...COLORS.primary);
  doc.setLineWidth(0.3);
  doc.line(LEFT, lastLineY + 1.5, 80, lastLineY + 1.5);
  doc.setFont(FONT_NAME, "normal");
  return lastLineY + 8;
}

// ─── Score Section ───────────────────────────────────────
export function addScoreSection(
  doc: jsPDF,
  scores: { label: string; value: number; max?: number }[],
  y: number
): number {
  y = ensureSpace(doc, y, 20);

  const colWidth = CONTENT_WIDTH / scores.length;

  scores.forEach((score, i) => {
    const x = LEFT + i * colWidth;
    const color = getScoreRgb(score.value);

    // Score box background — light tint
    const tint = (c: number) => Math.round(c + (255 - c) * 0.85);
    doc.setFillColor(tint(color[0]), tint(color[1]), tint(color[2]));
    doc.roundedRect(x + 1, y, colWidth - 3, 16, 2, 2, "F");

    // Score value
    doc.setFont(FONT_NAME, "bold");
    doc.setFontSize(16);
    doc.setTextColor(...color);
    doc.text(`${score.value}`, x + colWidth / 2, y + 8, { align: "center" });

    // Max
    if (score.max) {
      doc.setFont(FONT_NAME, "normal");
      doc.setFontSize(8);
      doc.setTextColor(...COLORS.gray);
      doc.text(`/ ${score.max}`, x + colWidth / 2 + 8, y + 8);
    }

    // Label — wrap inside box width
    doc.setFont(FONT_NAME, "normal");
    doc.setFontSize(7);
    doc.setTextColor(...COLORS.gray);
    const labelMaxW = colWidth - 6;
    const labelLines: string[] = doc.splitTextToSize(score.label, labelMaxW);
    doc.text(labelLines[0], x + colWidth / 2, y + 14, { align: "center" });
  });

  doc.setFont(FONT_NAME, "normal");
  return y + 22;
}

// ─── Table Section ───────────────────────────────────────
export function addTableSection(
  doc: jsPDF,
  headers: string[],
  rows: (string | number)[][],
  y: number,
  options?: {
    columnStyles?: Record<number, Record<string, unknown>>;
    headStyles?: Record<string, unknown>;
  }
): number {
  y = ensureSpace(doc, y, 15);

  autoTable(doc, {
    startY: y,
    head: [headers],
    body: rows,
    margin: { left: LEFT, right: LEFT },
    styles: {
      font: FONT_NAME,
      fontSize: 8,
      cellPadding: 3,
      textColor: COLORS.darkGray,
      lineColor: COLORS.lightGray,
      lineWidth: 0.1,
      overflow: "linebreak",
    },
    headStyles: {
      font: FONT_NAME,
      fillColor: [241, 245, 249],
      textColor: COLORS.black,
      fontStyle: "bold",
      fontSize: 8,
      ...options?.headStyles,
    },
    alternateRowStyles: {
      fillColor: [249, 250, 251],
    },
    columnStyles: options?.columnStyles,
    tableWidth: "auto",
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return ((doc as any).lastAutoTable?.finalY ?? y + 15) + 6;
}

// ─── List Section ────────────────────────────────────────
export function addListSection(
  doc: jsPDF,
  title: string,
  items: string[],
  y: number,
  options?: { bulletColor?: [number, number, number] }
): number {
  if (items.length === 0) return y;

  if (title) {
    y = addSectionTitle(doc, title, y);
  }
  const bulletColor = options?.bulletColor || COLORS.gray;
  const bulletX = LEFT + 2;
  const textX = LEFT + 7;
  const textMaxW = RIGHT - textX - 2;

  items.forEach((item) => {
    doc.setFont(FONT_NAME, "normal");
    doc.setFontSize(8);
    const lines: string[] = doc.splitTextToSize(item, textMaxW);
    const itemHeight = lines.length * 4 + 2;

    y = ensureSpace(doc, y, itemHeight);

    doc.setTextColor(...bulletColor);
    doc.text("\u2022", bulletX, y);
    doc.setTextColor(...COLORS.darkGray);
    doc.text(lines, textX, y);
    y += itemHeight;
  });

  return y + 2;
}

// ─── Key-Value Section ───────────────────────────────────
export function addKeyValueSection(
  doc: jsPDF,
  items: { label: string; value: string }[],
  y: number
): number {
  const labelX = LEFT + 2;
  const valueX = 70;
  const valueMaxW = RIGHT - valueX - 2;

  items.forEach((item) => {
    doc.setFont(FONT_NAME, "normal");
    doc.setFontSize(8);
    const valueLines: string[] = doc.splitTextToSize(item.value, valueMaxW);
    const itemHeight = Math.max(valueLines.length * 4, 5);

    y = ensureSpace(doc, y, itemHeight);

    doc.setFont(FONT_NAME, "bold");
    doc.setTextColor(...COLORS.gray);
    doc.text(item.label + ":", labelX, y);
    doc.setFont(FONT_NAME, "normal");
    doc.setTextColor(...COLORS.darkGray);
    doc.text(valueLines, valueX, y);
    y += itemHeight + 1;
  });

  return y + 2;
}

// ─── Paragraph ───────────────────────────────────────────
export function addParagraph(doc: jsPDF, text: string, y: number, maxWidth?: number): number {
  const w = maxWidth ?? CONTENT_WIDTH;

  doc.setFont(FONT_NAME, "normal");
  doc.setFontSize(9);
  doc.setTextColor(...COLORS.darkGray);
  const lines: string[] = doc.splitTextToSize(text, w);

  lines.forEach((line: string) => {
    y = ensureSpace(doc, y, 5);
    doc.text(line, LEFT, y);
    y += 4.5;
  });

  return y + 2;
}

// ─── Footer & Save ───────────────────────────────────────
export function addFooter(doc: jsPDF, businessName: string): void {
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    const ph = pageH(doc);
    doc.setFont(FONT_NAME, "normal");
    doc.setFontSize(7);
    doc.setTextColor(...COLORS.gray);
    doc.text(`${businessName} - MindID`, LEFT, ph - 8);
    doc.text(`Sayfa ${i} / ${pageCount}`, RIGHT, ph - 8, { align: "right" });
  }
}

export function savePdf(doc: jsPDF, filename: string, businessName: string): void {
  addFooter(doc, businessName);
  doc.save(filename);
}
