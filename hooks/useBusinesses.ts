import { useState, useEffect, useCallback } from "react";
import {
  getBusinesses,
  getBusiness,
  addBusiness,
  updateBusiness,
  deleteBusiness,
} from "@/lib/firebase/firestore";
import { uploadBusinessLogo } from "@/lib/firebase/storage";
import type { Business, BusinessProfile } from "@/types/firebase";

type BusinessInput = {
  name: string;
  logo: string;
  colors: string[];
  instagram_account_id: string;
  instagram_access_token: string;
  profile: BusinessProfile;
};

type UseBusinessesReturn = {
  businesses: Business[];
  loading: boolean;
  error: string | null;
  selectedBusiness: Business | null;
  loadBusinesses: () => Promise<void>;
  loadBusiness: (id: string) => Promise<Business | null>;
  createBusiness: (data: BusinessInput) => Promise<string | null>;
  editBusiness: (id: string, data: Partial<Business>) => Promise<boolean>;
  removeBusiness: (id: string) => Promise<boolean>;
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

  const removeBusiness = useCallback(
    async (id: string): Promise<boolean> => {
      try {
        await deleteBusiness(id);
        setBusinesses((prev) => prev.filter((b) => b.id !== id));
        if (selectedBusiness?.id === id) {
          setSelectedBusiness(null);
        }
        return true;
      } catch (err) {
        console.error("İşletme silinirken hata:", err);
        setError("İşletme silinirken bir hata oluştu.");
        return false;
      }
    },
    [selectedBusiness]
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
    businesses,
    loading,
    error,
    selectedBusiness,
    loadBusinesses,
    loadBusiness,
    createBusiness,
    editBusiness,
    removeBusiness,
    selectBusiness,
    uploadLogo,
  };
}
