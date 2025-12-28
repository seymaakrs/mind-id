import { useState, useCallback } from "react";
import { getBusinessMedia, addBusinessMedia } from "@/lib/firebase/firestore";
import { uploadBusinessMedia } from "@/lib/firebase/storage";
import type { BusinessMedia } from "@/types/firebase";

type MediaFilter = "all" | "image" | "video";

type UseBusinessMediaReturn = {
  media: BusinessMedia[];
  filteredMedia: BusinessMedia[];
  loading: boolean;
  error: string | null;
  filter: MediaFilter;
  imageCount: number;
  videoCount: number;
  setFilter: (filter: MediaFilter) => void;
  loadMedia: (businessId: string) => Promise<void>;
  uploadMedia: (
    file: File,
    businessId: string,
    type: "image" | "video",
    description?: string
  ) => Promise<boolean>;
  clearMedia: () => void;
};

export function useBusinessMedia(): UseBusinessMediaReturn {
  const [media, setMedia] = useState<BusinessMedia[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<MediaFilter>("all");

  const loadMedia = useCallback(async (businessId: string) => {
    if (!businessId) {
      setMedia([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await getBusinessMedia(businessId);
      // Sort by date (newest first)
      const sorted = data.sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      setMedia(sorted);
    } catch (err) {
      console.error("Medyalar yüklenirken hata:", err);
      setError("İçerikler yüklenirken bir hata oluştu.");
    } finally {
      setLoading(false);
    }
  }, []);

  const uploadMedia = useCallback(
    async (
      file: File,
      businessId: string,
      type: "image" | "video",
      description?: string
    ): Promise<boolean> => {
      try {
        // Upload to storage
        const { url, storagePath, fileName } = await uploadBusinessMedia(
          file,
          businessId,
          type
        );

        // Save to Firestore
        const mediaData: Omit<BusinessMedia, "id"> = {
          type,
          storage_path: storagePath,
          public_url: url,
          file_name: fileName,
          created_at: new Date().toISOString(),
          prompt_summary: description?.trim() || "",
        };

        await addBusinessMedia(businessId, mediaData);

        // Reload media list
        await loadMedia(businessId);
        return true;
      } catch (err) {
        console.error("İçerik yüklenirken hata:", err);
        setError("İçerik yüklenirken bir hata oluştu.");
        return false;
      }
    },
    [loadMedia]
  );

  const clearMedia = useCallback(() => {
    setMedia([]);
    setFilter("all");
    setError(null);
  }, []);

  // Computed values
  const filteredMedia = filter === "all" ? media : media.filter((m) => m.type === filter);
  const imageCount = media.filter((m) => m.type === "image").length;
  const videoCount = media.filter((m) => m.type === "video").length;

  return {
    media,
    filteredMedia,
    loading,
    error,
    filter,
    imageCount,
    videoCount,
    setFilter,
    loadMedia,
    uploadMedia,
    clearMedia,
  };
}
