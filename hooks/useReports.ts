import { useState, useCallback } from "react";
import {
    getBusinessReports,
    addBusinessReport,
    deleteBusinessReport,
} from "@/lib/firebase/firestore";
import type { Report, CreateReportData } from "@/types/reports";

type UseReportsReturn = {
    reports: Report[];
    loading: boolean;
    error: string | null;
    fetchReports: (businessId: string) => Promise<void>;
    createReport: (businessId: string, data: CreateReportData) => Promise<string | null>;
    removeReport: (businessId: string, reportId: string) => Promise<boolean>;
    reset: () => void;
};

export function useReports(): UseReportsReturn {
    const [reports, setReports] = useState<Report[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Helper to convert various date formats to timestamp for sorting
    const getTimeValue = (createdAt: unknown): number => {
        if (!createdAt) return 0;
        if (typeof createdAt === "object" && "toMillis" in createdAt && typeof (createdAt as { toMillis: () => number }).toMillis === "function") {
            return (createdAt as { toMillis: () => number }).toMillis();
        }
        if (typeof createdAt === "object" && "seconds" in createdAt) {
            return (createdAt as { seconds: number }).seconds * 1000;
        }
        if (typeof createdAt === "string" || createdAt instanceof Date) {
            return new Date(createdAt as string | Date).getTime();
        }
        return 0;
    };

    const fetchReports = useCallback(async (businessId: string) => {
        if (!businessId) return;

        setLoading(true);
        setError(null);

        try {
            const fetchedReports = await getBusinessReports(businessId);

            // Sort by createdAt descending
            fetchedReports.sort((a, b) => {
                const aTime = getTimeValue(a.createdAt);
                const bTime = getTimeValue(b.createdAt);
                return bTime - aTime;
            });

            setReports(fetchedReports);
        } catch (err) {
            console.error("Reports fetch error:", err);
            setError("Raporlar yuklenirken hata olustu.");
        } finally {
            setLoading(false);
        }
    }, []);

    const createReport = useCallback(
        async (businessId: string, data: CreateReportData): Promise<string | null> => {
            if (!businessId) {
                setError("Isletme ID'si gerekli.");
                return null;
            }

            setLoading(true);
            setError(null);

            try {
                const reportId = await addBusinessReport(businessId, data);
                // Refresh reports list
                await fetchReports(businessId);
                return reportId;
            } catch (err) {
                console.error("Report create error:", err);
                setError("Rapor olusturulurken hata olustu.");
                return null;
            } finally {
                setLoading(false);
            }
        },
        [fetchReports]
    );

    const removeReport = useCallback(
        async (businessId: string, reportId: string): Promise<boolean> => {
            try {
                await deleteBusinessReport(businessId, reportId);
                setReports((prev) => prev.filter((r) => r.id !== reportId));
                return true;
            } catch (err) {
                console.error("Report delete error:", err);
                setError("Rapor silinirken hata olustu.");
                return false;
            }
        },
        []
    );

    const reset = useCallback(() => {
        setReports([]);
        setLoading(false);
        setError(null);
    }, []);

    return {
        reports,
        loading,
        error,
        fetchReports,
        createReport,
        removeReport,
        reset,
    };
}
