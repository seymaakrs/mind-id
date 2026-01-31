import { useState, useCallback } from "react";
import { getSeoSummary, getSeoKeywords } from "@/lib/firebase/firestore";
import type { SeoSummary, SeoKeywords } from "@/types/firebase";

type UseSeoReturn = {
    summary: SeoSummary | null;
    keywords: SeoKeywords | null;
    loading: boolean;
    error: string | null;
    fetchSeoData: (businessId: string) => Promise<void>;
    reset: () => void;
};

export function useSeo(): UseSeoReturn {
    const [summary, setSummary] = useState<SeoSummary | null>(null);
    const [keywords, setKeywords] = useState<SeoKeywords | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchSeoData = useCallback(async (businessId: string) => {
        if (!businessId) return;

        setLoading(true);
        setError(null);

        try {
            const [summaryData, keywordsData] = await Promise.all([
                getSeoSummary(businessId),
                getSeoKeywords(businessId),
            ]);

            setSummary(summaryData);
            setKeywords(keywordsData);
        } catch (err) {
            console.error("SEO data fetch error:", err);
            setError("SEO verileri yuklenirken hata olustu.");
        } finally {
            setLoading(false);
        }
    }, []);

    const reset = useCallback(() => {
        setSummary(null);
        setKeywords(null);
        setLoading(false);
        setError(null);
    }, []);

    return {
        summary,
        keywords,
        loading,
        error,
        fetchSeoData,
        reset,
    };
}
