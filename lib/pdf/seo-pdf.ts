import type { SeoSummary, SeoKeywords } from "@/types/firebase";
import {
  createPdfDoc,
  addSectionTitle,
  addScoreSection,
  addTableSection,
  addListSection,
  addKeyValueSection,
  savePdf,
} from "./pdf-utils";

const CATEGORY_LABELS: Record<string, string> = {
  primary: "Birincil",
  secondary: "Ikincil",
  long_tail: "Uzun Kuyruk",
  local: "Yerel",
};

const PRIORITY_LABELS: Record<string, string> = {
  high: "Yuksek",
  medium: "Orta",
  low: "Dusuk",
};

const INTENT_LABELS: Record<string, string> = {
  informational: "Bilgi",
  transactional: "Islem",
  navigational: "Navigasyon",
};

export async function exportSeoPdf(
  summary: SeoSummary | null,
  keywords: SeoKeywords | null,
  businessName: string
): Promise<void> {
  const title = `${businessName} - SEO Analiz Raporu`;
  const doc = await createPdfDoc(title);
  let y = 35;

  // Score cards
  if (summary) {
    const scores = [
      { label: "Genel SEO Skoru", value: summary.overall_score },
      { label: "Site Skoru", value: summary.business_seo_score },
      { label: "Rakip Ortalamasi", value: summary.competitor_avg_score },
    ];

    if (summary.geo_readiness_score != null) {
      scores.push({ label: "GEO Hazirlik", value: summary.geo_readiness_score });
    }

    y = addScoreSection(doc, scores, y);

    // GEO Analysis Details
    if (summary.geo_analysis) {
      y = addSectionTitle(doc, "GEO Analiz Detaylari", y);

      const geo = summary.geo_analysis;

      // AI Crawler Access
      const crawlerItems: { label: string; value: string }[] = [
        { label: "AI Bot Erisimi Skoru", value: `${geo.ai_crawler_access.score} / ${geo.ai_crawler_access.max}` },
      ];
      if (geo.ai_crawler_access.bots_allowed.length > 0) {
        crawlerItems.push({ label: "Izin Verilen Botlar", value: geo.ai_crawler_access.bots_allowed.join(", ") });
      }
      if (geo.ai_crawler_access.bots_blocked.length > 0) {
        crawlerItems.push({ label: "Engellenen Botlar", value: geo.ai_crawler_access.bots_blocked.join(", ") });
      }
      if (geo.ai_crawler_access.bots_not_mentioned.length > 0) {
        crawlerItems.push({ label: "Belirtilmemis Botlar", value: geo.ai_crawler_access.bots_not_mentioned.join(", ") });
      }
      y = addKeyValueSection(doc, crawlerItems, y);

      // Content Structure
      y += 2;
      const contentItems: { label: string; value: string }[] = [
        { label: "Icerik Yapisi Skoru", value: `${geo.content_structure.score} / ${geo.content_structure.max}` },
        { label: "FAQ Bolumu", value: geo.content_structure.has_faq_section ? "Var" : "Yok" },
        { label: "FAQ Schema", value: geo.content_structure.faq_schema ? "Var" : "Yok" },
        { label: "Tablo Sayisi", value: `${geo.content_structure.tables_count}` },
        { label: "Liste Sayisi", value: `${geo.content_structure.lists_count}` },
        { label: "Soru Basliklari", value: `${geo.content_structure.question_headings_count}` },
      ];
      y = addKeyValueSection(doc, contentItems, y);

      // Citation Data
      y += 2;
      const citationItems: { label: string; value: string }[] = [
        { label: "Alinti Verileri Skoru", value: `${geo.citation_data.score} / ${geo.citation_data.max}` },
        { label: "Dis Alinti", value: `${geo.citation_data.external_citations}` },
        { label: "Alinti Yogunlugu (1K)", value: geo.citation_data.citation_density_per_1k.toFixed(1) },
        { label: "Istatistik Sayisi", value: `${geo.citation_data.statistics_count}` },
        { label: "Istatistik Yogunlugu (1K)", value: geo.citation_data.statistics_density_per_1k.toFixed(1) },
      ];
      y = addKeyValueSection(doc, citationItems, y);

      // AI Discovery
      y += 2;
      const discoveryItems: { label: string; value: string }[] = [
        { label: "AI Kesfedilebilirlik Skoru", value: `${geo.ai_discovery.score} / ${geo.ai_discovery.max}` },
        { label: "llms.txt", value: geo.ai_discovery.has_llms_txt ? "Var" : "Yok" },
      ];
      if (geo.ai_discovery.geo_schema_types_present.length > 0) {
        discoveryItems.push({ label: "Mevcut Schema", value: geo.ai_discovery.geo_schema_types_present.join(", ") });
      }
      if (geo.ai_discovery.geo_schema_types_missing.length > 0) {
        discoveryItems.push({ label: "Eksik Schema", value: geo.ai_discovery.geo_schema_types_missing.join(", ") });
      }
      if (geo.ai_discovery.freshness_signals.length > 0) {
        discoveryItems.push({ label: "Guncellik Sinyalleri", value: geo.ai_discovery.freshness_signals.join(", ") });
      }
      y = addKeyValueSection(doc, discoveryItems, y);
    }

    // Top Keywords
    if (summary.top_keywords && summary.top_keywords.length > 0) {
      y = addListSection(doc, "En Onemli Anahtar Kelimeler", summary.top_keywords, y);
    }

    // Main Issues
    if (summary.main_issues && summary.main_issues.length > 0) {
      y = addListSection(doc, "Duzeltilmesi Gereken Sorunlar", summary.main_issues, y, {
        bulletColor: [234, 179, 8],
      });
    }
  }

  // Keywords Table
  if (keywords && keywords.items && keywords.items.length > 0) {
    y = addSectionTitle(doc, `Anahtar Kelime Analizi (${keywords.total_count} adet)`, y);

    const headers = ["Anahtar Kelime", "Kategori", "Arama Amaci", "Oncelik", "Rakip", "Notlar"];
    const rows = keywords.items.map((item) => [
      item.keyword,
      CATEGORY_LABELS[item.category] || item.category,
      INTENT_LABELS[item.search_intent] || item.search_intent,
      PRIORITY_LABELS[item.priority] || item.priority,
      `${item.competitor_usage}`,
      item.notes || "-",
    ]);

    y = addTableSection(doc, headers, rows, y, {
      columnStyles: {
        0: { cellWidth: 40 },
        5: { cellWidth: 45 },
      },
    });
  }

  // Save
  const safeName = businessName.replace(/[^a-zA-Z0-9_-]/g, "_");
  savePdf(doc, `${safeName}_SEO_Analiz.pdf`, businessName);
}
