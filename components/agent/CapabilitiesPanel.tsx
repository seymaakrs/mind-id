"use client";

import { useState, useEffect } from "react";
import { ChevronDown, ChevronUp, Sparkles, Loader2 } from "lucide-react";

interface Feature {
  id: string;
  name: string;
  description: string;
  engine?: string;
  examples?: string[];
}

interface Category {
  id: string;
  name: string;
  icon: string;
  features: Feature[];
}

interface CapabilitiesData {
  version: string;
  categories: Category[];
}

interface CapabilitiesPanelProps {
  onExampleClick?: (example: string) => void;
}

export function CapabilitiesPanel({ onExampleClick }: CapabilitiesPanelProps) {
  const [open, setOpen] = useState(false);
  const [data, setData] = useState<CapabilitiesData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  useEffect(() => {
    if (!open || data) return;

    const fetchCapabilities = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/capabilities");
        if (!res.ok) throw new Error("Yetenekler yuklenemedi");
        const json: CapabilitiesData = await res.json();
        setData(json);
        if (json.categories?.length > 0) {
          setExpandedCategory(json.categories[0].id);
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "Bilinmeyen hata");
      } finally {
        setLoading(false);
      }
    };

    fetchCapabilities();
  }, [open, data]);

  return (
    <div className="relative shrink-0">
      {/* Toggle button */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs rounded-lg border transition-all ${
          open
            ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-400"
            : "border-border/50 hover:border-border bg-muted/30 hover:bg-muted/60 text-muted-foreground hover:text-foreground"
        }`}
      >
        <Sparkles className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
        <span className="font-medium hidden sm:inline">Neler yapabilirim?</span>
        {open ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
      </button>

      {/* Backdrop to close on outside click */}
      {open && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Dropdown - absolute, overlays content below */}
      {open && (
        <div className="absolute left-0 top-full mt-2 w-80 border border-border rounded-xl bg-card shadow-xl z-50 overflow-hidden">
          {loading && (
            <div className="flex items-center justify-center gap-2 py-6 text-xs text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />
              Yukleniyor...
            </div>
          )}

          {error && (
            <div className="py-4 px-4 text-xs text-destructive text-center">
              {error}
            </div>
          )}

          {data && (
            <div className="divide-y divide-border max-h-[420px] overflow-y-auto">
              {data.categories.map((cat) => (
                <div key={cat.id}>
                  {/* Category header */}
                  <button
                    type="button"
                    onClick={() =>
                      setExpandedCategory((prev) => (prev === cat.id ? null : cat.id))
                    }
                    className="flex items-center gap-2.5 w-full px-4 py-2.5 hover:bg-muted/50 transition-colors text-left"
                  >
                    <span className="text-base leading-none">{cat.icon}</span>
                    <span className="text-sm font-medium flex-1">{cat.name}</span>
                    <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">
                      {cat.features.length}
                    </span>
                    {expandedCategory === cat.id ? (
                      <ChevronUp className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                    )}
                  </button>

                  {/* Features */}
                  {expandedCategory === cat.id && (
                    <div className="px-4 pb-3 space-y-3 bg-muted/20">
                      {cat.features.map((feat) => (
                        <div key={feat.id} className="pt-3">
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <span className="text-xs font-semibold">{feat.name}</span>
                            {feat.engine && (
                              <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded shrink-0">
                                {feat.engine}
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-muted-foreground leading-relaxed mb-2">
                            {feat.description}
                          </p>
                          {feat.examples && feat.examples.length > 0 && (
                            <div className="flex flex-wrap gap-1.5">
                              {feat.examples.map((ex, i) => (
                                <button
                                  key={i}
                                  type="button"
                                  onClick={() => {
                                    onExampleClick?.(ex);
                                    setOpen(false);
                                  }}
                                  className="text-[10px] px-2 py-1 rounded-full border border-border hover:bg-primary hover:text-primary-foreground hover:border-primary transition-colors text-muted-foreground"
                                >
                                  {ex}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
