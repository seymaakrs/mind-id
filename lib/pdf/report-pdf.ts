import {
  REPORT_TYPE_LABELS,
  type Report,
  type SeoReport,
  type SwotReport,
  type InstagramReport,
  type CustomReport,
  type Block,
} from "@/types/reports";
import {
  createPdfDoc,
  addSectionTitle,
  addScoreSection,
  addTableSection,
  addListSection,
  addKeyValueSection,
  addParagraph,
  savePdf,
} from "./pdf-utils";
import type jsPDF from "jspdf";

// Type guards
const isSeoReport = (r: Report): r is SeoReport => r.type === "seo";
const isSwotReport = (r: Report): r is SwotReport => r.type === "swot";
const isInstagramReport = (r: Report): r is InstagramReport => r.type === "instagram_weekly";
const isCustomReport = (r: Report): r is CustomReport => r.type === "custom";

// ─── SEO Report ──────────────────────────────────────────
function renderSeoReport(doc: jsPDF, report: SeoReport, startY: number): number {
  let y = startY;

  // Overall score
  y = addScoreSection(
    doc,
    [{ label: "Genel SEO Skoru", value: report.overall_score }],
    y
  );

  // Summary
  if (report.summary) {
    y = addSectionTitle(doc, "Ozet", y);
    y = addParagraph(doc, report.summary, y);
  }

  // Website Analysis
  const analysis = report.business_website_analysis;
  if (analysis) {
    y = addSectionTitle(doc, "Web Sitesi Analizi", y);

    const siteScore = [{ label: "Site SEO Skoru", value: analysis.seo_score }];
    y = addScoreSection(doc, siteScore, y);

    // Meta Tags
    if (analysis.meta_tags) {
      const mt = analysis.meta_tags;
      y = addKeyValueSection(doc, [
        { label: "Title", value: mt.title || "Yok" },
        { label: "Title Uzunlugu", value: `${mt.title_length} karakter` },
        { label: "Description", value: mt.description ? "Var" : "Yok" },
        { label: "Description Uzunlugu", value: `${mt.description_length} karakter` },
        { label: "Canonical", value: mt.canonical ? "Var" : "Yok" },
        { label: "OG Tags", value: mt.og_title ? "Var" : "Yok" },
      ], y);
    }

    // Headings
    if (analysis.headings) {
      const h = analysis.headings;
      y = addKeyValueSection(doc, [
        { label: "H1 Sayisi", value: `${h.h1_count} ${h.has_single_h1 ? "(OK)" : "(Uyari)"}` },
        { label: "H2 Sayisi", value: `${h.h2?.length ?? 0}` },
        { label: "H3 Sayisi", value: `${h.h3?.length ?? 0}` },
      ], y);
    }

    // Images
    if (analysis.images) {
      const img = analysis.images;
      y = addKeyValueSection(doc, [
        { label: "Toplam Gorsel", value: `${img.total_images}` },
        { label: "Alt Metinli", value: `${img.images_with_alt}` },
        { label: "Alt Metinsiz", value: `${img.images_without_alt}` },
      ], y);
    }

    // Links
    if (analysis.links) {
      const l = analysis.links;
      y = addKeyValueSection(doc, [
        { label: "Toplam Link", value: `${l.total_links}` },
        { label: "Ic Linkler", value: `${l.internal_links}` },
        { label: "Dis Linkler", value: `${l.external_links}` },
        { label: "Nofollow", value: `${l.nofollow_links}` },
      ], y);
    }

    // Schema & Word Count
    y = addKeyValueSection(doc, [
      { label: "Kelime Sayisi", value: `${analysis.word_count}` },
      { label: "Schema Markup", value: analysis.schema_markup?.has_schema ? "Var" : "Yok" },
      {
        label: "Schema Turleri",
        value: (analysis.schema_markup?.schema_types?.length ?? 0) > 0
          ? analysis.schema_markup!.schema_types.join(", ")
          : "Yok",
      },
    ], y);
  }

  // Competitors
  if (report.competitors && report.competitors.length > 0) {
    y = addSectionTitle(doc, `Rakip Analizi (${report.competitors.length} rakip)`, y);
    const headers = ["Domain", "SEO Skoru", "Kelime", "Schema"];
    const rows = report.competitors.map((c) => [
      c.domain,
      `${c.seo_score ?? 0}`,
      `${c.word_count ?? 0}`,
      c.has_schema ? "Var" : "Yok",
    ]);
    y = addTableSection(doc, headers, rows, y);
  }

  // Keyword Recommendations
  if (report.keyword_recommendations && report.keyword_recommendations.length > 0) {
    y = addSectionTitle(doc, `Anahtar Kelime Onerileri (${report.keyword_recommendations.length})`, y);
    const catLabels: Record<string, string> = { primary: "Birincil", secondary: "Ikincil", long_tail: "Uzun Kuyruk", local: "Yerel" };
    const priLabels: Record<string, string> = { high: "Yuksek", medium: "Orta", low: "Dusuk" };
    const intentLabels: Record<string, string> = { informational: "Bilgi", transactional: "Islem", navigational: "Navigasyon" };

    const headers = ["Anahtar Kelime", "Kategori", "Oncelik", "Amac", "Rakip", "Not"];
    const rows = report.keyword_recommendations.map((kw) => [
      kw.keyword,
      catLabels[kw.category] || kw.category,
      priLabels[kw.priority] || kw.priority,
      intentLabels[kw.search_intent] || kw.search_intent,
      `${kw.competitor_usage}`,
      kw.notes || "-",
    ]);
    y = addTableSection(doc, headers, rows, y, {
      columnStyles: { 0: { cellWidth: 35 }, 5: { cellWidth: 40 } },
    });
  }

  // Technical Issues
  if (report.technical_issues && report.technical_issues.length > 0) {
    y = addSectionTitle(doc, `Teknik Sorunlar (${report.technical_issues.length})`, y);
    const typeLabels: Record<string, string> = { error: "Hata", warning: "Uyari", info: "Bilgi" };
    const headers = ["Tip", "Sorun", "Oneri"];
    const rows = report.technical_issues.map((issue) => [
      typeLabels[issue.type] || issue.type,
      issue.issue,
      issue.recommendation,
    ]);
    y = addTableSection(doc, headers, rows, y, {
      columnStyles: { 0: { cellWidth: 18 }, 1: { cellWidth: 70 } },
    });
  }

  // Content Recommendations
  if (report.content_recommendations && report.content_recommendations.length > 0) {
    y = addListSection(doc, "Icerik Onerileri", report.content_recommendations, y, {
      bulletColor: [34, 197, 94],
    });
  }

  // GEO Analysis
  if (report.geo_readiness_score != null && report.geo_analysis) {
    y = addSectionTitle(doc, "GEO Hazirlik Analizi", y);
    y = addScoreSection(doc, [{ label: "GEO Hazirlik Skoru", value: report.geo_readiness_score }], y);

    const geo = report.geo_analysis;
    y = addKeyValueSection(doc, [
      { label: "AI Bot Erisimi", value: `${geo.ai_crawler_access.score} / ${geo.ai_crawler_access.max}` },
      { label: "Icerik Yapisi", value: `${geo.content_structure.score} / ${geo.content_structure.max}` },
      { label: "Alinti Verileri", value: `${geo.citation_data.score} / ${geo.citation_data.max}` },
      { label: "AI Kesfedilebilirlik", value: `${geo.ai_discovery.score} / ${geo.ai_discovery.max}` },
    ], y);
  }

  return y;
}

// ─── SWOT Report ─────────────────────────────────────────
function renderSwotReport(doc: jsPDF, report: SwotReport, startY: number): number {
  let y = startY;

  // Summary
  if (report.summary) {
    y = addSectionTitle(doc, "Ozet", y);
    y = addParagraph(doc, report.summary, y);
  }

  // SWOT Sections
  const sections: { title: string; items: { title: string; description: string }[] }[] = [
    { title: "Guclu Yonler", items: report.strengths },
    { title: "Zayif Yonler", items: report.weaknesses },
    { title: "Firsatlar", items: report.opportunities },
    { title: "Tehditler", items: report.threats },
  ];

  for (const section of sections) {
    if (section.items && section.items.length > 0) {
      y = addSectionTitle(doc, section.title, y);
      const formatted = section.items.map((item) => `${item.title}: ${item.description}`);
      y = addListSection(doc, "", formatted, y - 6); // -6 because addListSection adds its own title spacing
    }
  }

  // Recommendations
  if (report.recommendations && report.recommendations.length > 0) {
    y = addListSection(doc, "Stratejik Oneriler", report.recommendations, y, {
      bulletColor: [234, 179, 8],
    });
  }

  return y;
}

// ─── Instagram Report ────────────────────────────────────
function renderInstagramReport(doc: jsPDF, report: InstagramReport, startY: number): number {
  let y = startY;

  // Date Range
  if (report.date_range) {
    y = addParagraph(doc, `Tarih Araligi: ${report.date_range}`, y);
  }

  // Overall Stats Table
  y = addSectionTitle(doc, "Genel Istatistikler", y);
  y = addTableSection(
    doc,
    ["Metrik", "Deger"],
    [
      ["Toplam Erisim", `${report.totals.reach}`],
      ["Goruntulenme", `${report.totals.views}`],
      ["Etkilesim", `${report.totals.interactions}`],
      ["Paylasim", `${report.totals.shares}`],
      ["Kaydetme", `${report.totals.saved}`],
      ["Toplam Post", `${report.total_posts}`],
    ],
    y
  );

  // Content Format Breakdown
  y = addSectionTitle(doc, "Format Performansi", y);
  const formatHeaders = ["Format", "Adet", "Erisim", "Goruntulenme", "Etkilesim"];
  const formatRows = [
    ["Reels", `${report.by_type.reels.count}`, `${report.by_type.reels.reach}`, `${report.by_type.reels.views}`, `${report.by_type.reels.interactions}`],
    ["Image", `${report.by_type.image.count}`, `${report.by_type.image.reach}`, `${report.by_type.image.views}`, `${report.by_type.image.interactions}`],
    ["Carousel", `${report.by_type.carousel.count}`, `${report.by_type.carousel.reach}`, `${report.by_type.carousel.views}`, `${report.by_type.carousel.interactions}`],
  ];
  y = addTableSection(doc, formatHeaders, formatRows, y);

  // Top Posts
  if (report.top_posts && report.top_posts.length > 0) {
    y = addSectionTitle(doc, "En Iyi Postlar", y);
    const postHeaders = ["Tip", "Erisim", "Goruntulenme"];
    const postRows = report.top_posts.map((p) => [
      p.type,
      `${p.reach}`,
      `${p.views}`,
    ]);
    y = addTableSection(doc, postHeaders, postRows, y);
  }

  // Insights
  if (report.insights && report.insights.length > 0) {
    y = addListSection(doc, "Gozlemler & Icgoru", report.insights, y, {
      bulletColor: [59, 130, 246],
    });
  }

  // Recommendations
  if (report.recommendations && report.recommendations.length > 0) {
    y = addListSection(doc, "Oneriler", report.recommendations, y, {
      bulletColor: [34, 197, 94],
    });
  }

  // Best posting time
  if (report.best_posting_time) {
    y = addParagraph(doc, `En iyi paylasim saati: ${report.best_posting_time}`, y);
  }

  return y;
}

// ─── Custom Report ───────────────────────────────────────
function renderCustomReport(doc: jsPDF, report: CustomReport, startY: number): number {
  let y = startY;

  // Summary
  if (report.summary) {
    y = addSectionTitle(doc, "Ozet", y);
    y = addParagraph(doc, report.summary, y);
  }

  // Blocks
  for (const block of report.blocks) {
    y = renderBlock(doc, block, y);
  }

  // Tags
  if (report.tags && report.tags.length > 0) {
    y = addParagraph(doc, `Etiketler: ${report.tags.join(", ")}`, y);
  }

  // Sources
  if (report.sources && report.sources.length > 0) {
    y = addListSection(doc, "Kaynaklar", report.sources, y);
  }

  return y;
}

function renderBlock(doc: jsPDF, block: Block, y: number): number {
  const pageHeight = doc.internal.pageSize.getHeight();

  switch (block.type) {
    case "text":
      return addParagraph(doc, block.content, y);

    case "heading": {
      const sizes = { 1: 14, 2: 12, 3: 10 };
      doc.setFontSize(sizes[block.level] || 10);
      doc.setTextColor(17, 24, 39);
      const headingLines: string[] = doc.splitTextToSize(block.content, 182);
      const headingH = headingLines.length * (block.level === 1 ? 6 : 5) + 4;
      if (y + headingH > pageHeight - 20) {
        doc.addPage();
        y = 15;
      }
      doc.text(headingLines, 14, y);
      return y + headingH;
    }

    case "list": {
      const items = block.items.map((item, i) =>
        block.ordered ? `${i + 1}. ${item}` : item
      );
      return addListSection(doc, "", items, y - 2);
    }

    case "table":
      return addTableSection(doc, block.headers, block.rows, y);

    case "quote": {
      doc.setFontSize(9);
      const quoteLines: string[] = doc.splitTextToSize(block.content, 165);
      const quoteH = quoteLines.length * 4.5 + 4;
      if (y + quoteH > pageHeight - 20) {
        doc.addPage();
        y = 15;
      }
      doc.setDrawColor(107, 114, 128);
      doc.setLineWidth(0.5);
      doc.line(16, y - 2, 16, y + quoteH - 4);
      doc.setTextColor(107, 114, 128);
      doc.text(quoteLines, 20, y);
      return y + quoteH;
    }

    case "code": {
      if (y + 10 > pageHeight - 20) {
        doc.addPage();
        y = 15;
      }
      doc.setFillColor(241, 245, 249);
      const codeLines = doc.splitTextToSize(block.content, 170);
      const codeHeight = codeLines.length * 4 + 6;
      doc.roundedRect(14, y - 3, 182, codeHeight, 1, 1, "F");
      doc.setFontSize(8);
      doc.setTextColor(55, 65, 81);
      doc.text(codeLines, 16, y + 1);
      return y + codeHeight + 3;
    }

    case "divider": {
      if (y + 6 > pageHeight - 20) {
        doc.addPage();
        y = 15;
      }
      doc.setDrawColor(229, 231, 235);
      doc.setLineWidth(0.3);
      doc.line(14, y, 196, y);
      return y + 6;
    }

    default:
      return y;
  }
}

// ─── Main Export Function ────────────────────────────────
export async function exportReportPdf(report: Report, businessName: string): Promise<void> {
  const reportTitle = report.title || REPORT_TYPE_LABELS[report.type] || report.type;
  const title = `${businessName} - ${reportTitle}`;
  const doc = await createPdfDoc(title);
  let y = 35;

  if (isSeoReport(report)) {
    renderSeoReport(doc, report, y);
  } else if (isSwotReport(report)) {
    renderSwotReport(doc, report, y);
  } else if (isInstagramReport(report)) {
    renderInstagramReport(doc, report, y);
  } else if (isCustomReport(report)) {
    renderCustomReport(doc, report, y);
  } else {
    // Generic fallback
    if (report.content) {
      y = addSectionTitle(doc, "Icerik", y);
      addParagraph(doc, report.content, y);
    }
  }

  const safeName = businessName.replace(/[^a-zA-Z0-9_-]/g, "_");
  const typeLabel = report.type.replace(/[^a-zA-Z0-9]/g, "_");
  savePdf(doc, `${safeName}_${typeLabel}_Rapor.pdf`, businessName);
}
