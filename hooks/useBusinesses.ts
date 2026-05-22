import { useState, useEffect, useCallback } from "react";
import {
  getBusinesses,
  getBusiness,
  addBusiness,
  updateBusiness,
  softDeleteBusiness,
  restoreBusiness as restoreBusinessDoc,
} from "@/lib/firebase/firestore";
import { Timestamp } from "firebase/firestore";
import { uploadBusinessLogo } from "@/lib/firebase/storage";
import type { Business, BusinessProfile } from "@/types/firebase";

type BusinessInput = {
  name: string;
  logo: string;
  colors: string[];
  late_profile_id?: string;
  zernio_profile_id?: string;
  profile: BusinessProfile;
};

type UseBusinessesReturn = {
  businesses: Business[]; // Veri Hazinesi'ndekiler (silinmiş) HARİÇ - normal kullanım
  allBusinesses: Business[]; // ham liste, silinmişler dahil (sadece İşletme Listesi sekmeleri için)
  loading: boolean;
  error: string | null;
  selectedBusiness: Business | null;
  loadBusinesses: () => Promise<void>;
  loadBusiness: (id: string) => Promise<Business | null>;
  createBusiness: (data: BusinessInput) => Promise<string | null>;
  editBusiness: (id: string, data: Partial<Business>) => Promise<boolean>;
  removeBusiness: (id: string) => Promise<boolean>;
  restoreBusiness: (id: string) => Promise<boolean>;
  selectBusiness: (business: Business | null) => void;
  uploadLogo: (file: File, businessId: string) => Promise<string | null>;
};

export function useBusinesses(): UseBusinessesReturn {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null);

  const loadBusinesses = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getBusinesses();
      setBusinesses(data);
    } catch (err) {
      console.error("İşletmeler yüklenirken hata:", err);
      setError("İşletmeler yüklenirken bir hata oluştu.");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadBusiness = useCallback(async (id: string): Promise<Business | null> => {
    try {
      const business = await getBusiness(id);
      return business;
    } catch (err) {
      console.error("İşletme yüklenirken hata:", err);
      setError("İşletme yüklenirken bir hata oluştu.");
      return null;
    }
  }, []);

  const createBusiness = useCallback(async (data: BusinessInput): Promise<string | null> => {
    try {
      const id = await addBusiness(data);
      await loadBusinesses();
      return id;
    } catch (err) {
      console.error("İşletme eklenirken hata:", err);
      setError("İşletme eklenirken bir hata oluştu.");
      return null;
    }
  }, [loadBusinesses]);

  const editBusiness = useCallback(
    async (id: string, data: Partial<Business>): Promise<boolean> => {
      try {
        await updateBusiness(id, data);
        await loadBusinesses();
        return true;
      } catch (err) {
        console.error("İşletme güncellenirken hata:", err);
        setError("İşletme güncellenirken bir hata oluştu.");
        return false;
      }
    },
    [loadBusinesses]
  );

  // "Sil" = yumuşak silme. İşletme silinmez, Veri Hazinesi'ne taşınır.
  const removeBusiness = useCallback(
    async (id: string): Promise<boolean> => {
      try {
        await softDeleteBusiness(id);
        setBusinesses((prev) =>
          prev.map((b) =>
            b.id === id
              ? { ...b, status: "deleted", deletedAt: Timestamp.now() }
              : b
          )
        );
        if (selectedBusiness?.id === id) {
          setSelectedBusiness(null);
        }
        return true;
      } catch (err) {
        console.error("İşletme veri hazinesine taşınırken hata:", err);
        setError("İşletme veri hazinesine taşınırken bir hata oluştu.");
        return false;
      }
    },
    [selectedBusiness]
  );

  const restoreBusiness = useCallback(
    async (id: string): Promise<boolean> => {
      try {
        await restoreBusinessDoc(id);
        setBusinesses((prev) =>
          prev.map((b) =>
            b.id === id
              ? { ...b, status: "approved", deletedAt: undefined }
              : b
          )
        );
        return true;
      } catch (err) {
        console.error("İşletme geri yüklenirken hata:", err);
        setError("İşletme geri yüklenirken bir hata oluştu.");
        return false;
      }
    },
    []
  );

  const selectBusiness = useCallback((business: Business | null) => {
    setSelectedBusiness(business);
  }, []);

  const uploadLogo = useCallback(
    async (file: File, businessId: string): Promise<string | null> => {
      try {
        const url = await uploadBusinessLogo(file, businessId);
        return url;
      } catch (err) {
        console.error("Logo yüklenirken hata:", err);
        setError("Logo yüklenirken bir hata oluştu.");
        return null;
      }
    },
    []
  );

  useEffect(() => {
    loadBusinesses();
  }, [loadBusinesses]);

  return {
    businesses: businesses.filter((b) => b.status !== "deleted"),
    allBusinesses: businesses,
    loading,
    error,
    selectedBusiness,
    loadBusinesses,
    loadBusiness,
    createBusiness,
    editBusiness,
    removeBusiness,
    restoreBusiness,
    selectBusiness,
    uploadLogo,
  };
}
