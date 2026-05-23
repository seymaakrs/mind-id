"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Building2, Palette as PaletteIcon, Eye } from "lucide-react";
import type { BrandIdentity } from "@/lib/brandIdentity";

interface BusinessPreviewCardProps {
  identity: BrandIdentity;
  logoUrl?: string | null;
}

/**
 * Kullanıcı kaydetmeden ÖNCE işletmesinin liste kartında nasıl
 * görüneceğini canlı önizler. business-list.tsx BusinessCard yapısını
 * aynen taklit eder (logo + isim + renk şeridi + marka skoru).
 */
export function BusinessPreviewCard({ identity, logoUrl }: BusinessPreviewCardProps) {
  const colors = identity.visual?.primary_colors || [];
  const name = identity.basics?.name || "İşletme adı";

  // Marka doluluk yüzdesi (useBusinessSummary ile aynı mantık — 6 bölüm)
  const sections = [
    identity.basics,
    identity.visual,
    identity.voice,
    identity.audience,
    identity.content_strategy,
    identity.business_context,
  ];
  let filled = 0;
  for (const s of sections) {
    if (!s || typeof s !== "object") continue;
    const hasValue = Object.values(s).some((v) => {
      if (v == null) return false;
      if (typeof v === "string") return v.trim().length > 0;
      if (Array.isArray(v)) return v.length > 0;
      if (typeof v === "object") return Object.keys(v).length > 0;
      return true;
    });
    if (hasValue) filled += 1;
  }
  const completeness = Math.round((filled / sections.length) * 100);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Eye className="w-4 h-4" />
        <span>Liste kartında böyle görünecek</span>
      </div>

      <div className="max-w-xs">
        <Card className="group relative overflow-hidden border-border/60 bg-gradient-to-b from-card to-card/40">
          <CardContent className="p-4 space-y-3">
            <div className="w-full aspect-[4/3] bg-gradient-to-br from-muted/60 to-muted/20 rounded-xl flex items-center justify-center overflow-hidden border border-border/40">
              {logoUrl ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={logoUrl}
                  alt={name}
                  className="w-full h-full object-contain p-3"
                />
              ) : (
                <Building2 className="w-12 h-12 text-muted-foreground/60" />
              )}
            </div>
            <div className="space-y-1">
              <h3
                className="font-semibold truncate text-center"
                title={name}
              >
                {name}
              </h3>
            </div>
            {colors.length > 0 && (
              <div className="flex justify-center gap-1.5">
                {colors.slice(0, 6).map((color, index) => (
                  <div
                    key={index}
                    className="w-4 h-4 rounded-full border border-border/60 ring-1 ring-background"
                    style={{ backgroundColor: color }}
                    title={color}
                  />
                ))}
                {colors.length > 6 && (
                  <span className="text-xs text-muted-foreground ml-1 self-center">
                    +{colors.length - 6}
                  </span>
                )}
              </div>
            )}

            <div className="pt-2 mt-1 border-t border-border/40 space-y-1.5">
              <div className="flex items-center gap-2">
                <PaletteIcon className="w-3 h-3 text-muted-foreground shrink-0" />
                <span className="text-[11px] text-muted-foreground shrink-0">
                  Marka
                </span>
                <div className="flex-1 h-1.5 bg-muted rounded overflow-hidden">
                  <div
                    className={`h-full rounded transition-all ${
                      completeness >= 80
                        ? "bg-emerald-500"
                        : completeness >= 50
                        ? "bg-amber-500"
                        : "bg-red-500/70"
                    }`}
                    style={{ width: `${completeness}%` }}
                  />
                </div>
                <span className="text-[11px] tabular-nums w-8 text-right">
                  {completeness}%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {completeness < 50 && (
        <p className="text-xs text-amber-600 dark:text-amber-400">
          ⚠️ Marka kimliği eksik (≥50% önerilir). Aşağıdaki alanları
          doldurarak skoru artırın — ajanlar markaya daha uygun üretim yapar.
        </p>
      )}
    </div>
  );
}
