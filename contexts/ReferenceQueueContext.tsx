"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { toast } from "sonner";
import type { ReferenceItem, ReferenceType } from "@/types/references";

const MAX_REFERENCES = 20;

interface ReferenceQueueContextType {
  references: ReferenceItem[];
  addReference: (ref: ReferenceItem) => void;
  addReferences: (refs: ReferenceItem[]) => void;
  removeReference: (type: ReferenceType, id: string) => void;
  clearReferences: () => void;
  clearBusinessReferences: (businessId: string) => void;
  hasReference: (type: ReferenceType, id: string) => boolean;
  referenceCount: number;
  getBusinessReferences: (businessId: string) => ReferenceItem[];
}

const ReferenceQueueContext = createContext<ReferenceQueueContextType | null>(null);

export function ReferenceQueueProvider({ children }: { children: React.ReactNode }) {
  const [references, setReferences] = useState<ReferenceItem[]>([]);

  const addReference = useCallback((ref: ReferenceItem) => {
    setReferences((prev) => {
      const isDuplicate = prev.some((r) => r.type === ref.type && r.id === ref.id);
      if (isDuplicate) return prev;
      if (prev.length >= MAX_REFERENCES) {
        toast.warning(`En fazla ${MAX_REFERENCES} referans eklenebilir.`);
        return prev;
      }
      return [...prev, ref];
    });
  }, []);

  const addReferences = useCallback((refs: ReferenceItem[]) => {
    setReferences((prev) => {
      const newRefs: ReferenceItem[] = [];
      for (const ref of refs) {
        const isDuplicate = prev.some((r) => r.type === ref.type && r.id === ref.id)
          || newRefs.some((r) => r.type === ref.type && r.id === ref.id);
        if (!isDuplicate) newRefs.push(ref);
      }
      if (prev.length + newRefs.length > MAX_REFERENCES) {
        const available = MAX_REFERENCES - prev.length;
        if (available <= 0) {
          toast.warning(`En fazla ${MAX_REFERENCES} referans eklenebilir.`);
          return prev;
        }
        toast.warning(`En fazla ${MAX_REFERENCES} referans eklenebilir. Ilk ${available} eklendi.`);
        return [...prev, ...newRefs.slice(0, available)];
      }
      return [...prev, ...newRefs];
    });
  }, []);

  const removeReference = useCallback((type: ReferenceType, id: string) => {
    setReferences((prev) => prev.filter((r) => !(r.type === type && r.id === id)));
  }, []);

  const clearReferences = useCallback(() => {
    setReferences([]);
  }, []);

  const clearBusinessReferences = useCallback((businessId: string) => {
    setReferences((prev) => prev.filter((r) => r.businessId !== businessId));
  }, []);

  const hasReference = useCallback(
    (type: ReferenceType, id: string) => {
      return references.some((r) => r.type === type && r.id === id);
    },
    [references]
  );

  const getBusinessReferences = useCallback(
    (businessId: string) => references.filter((r) => r.businessId === businessId),
    [references]
  );

  return (
    <ReferenceQueueContext.Provider
      value={{
        references,
        addReference,
        addReferences,
        removeReference,
        clearReferences,
        clearBusinessReferences,
        hasReference,
        referenceCount: references.length,
        getBusinessReferences,
      }}
    >
      {children}
    </ReferenceQueueContext.Provider>
  );
}

export function useReferenceQueue(): ReferenceQueueContextType {
  const ctx = useContext(ReferenceQueueContext);
  if (!ctx) throw new Error("useReferenceQueue must be used inside ReferenceQueueProvider");
  return ctx;
}
