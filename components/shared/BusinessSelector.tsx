"use client";

import { Building2, Loader2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Business } from "@/types/firebase";

type Props = {
  businesses: Business[];
  loading: boolean;
  selectedId: string;
  onSelect: (id: string) => void;
  disabled?: boolean;
  placeholder?: string;
  showPreview?: boolean;
  className?: string;
};

export function BusinessSelector({
  businesses,
  loading,
  selectedId,
  onSelect,
  disabled = false,
  placeholder = "Bir işletme seçin",
  showPreview = false,
  className = "w-[300px]",
}: Props) {
  const selectedBusiness = businesses.find((b) => b.id === selectedId);

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span className="text-sm">İşletmeler yükleniyor...</span>
      </div>
    );
  }

  if (businesses.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Henüz işletme bulunmuyor. Önce bir işletme ekleyin.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      <Select value={selectedId} onValueChange={onSelect} disabled={disabled}>
        <SelectTrigger className={className}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {businesses.map((business) => (
            <SelectItem key={business.id} value={business.id}>
              <div className="flex items-center gap-2">
                {business.logo && (
                  <img
                    src={business.logo}
                    alt=""
                    className="w-5 h-5 rounded object-contain"
                  />
                )}
                {business.name}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {showPreview && selectedBusiness && (
        <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
          <div className="w-10 h-10 bg-background rounded flex items-center justify-center overflow-hidden border">
            {selectedBusiness.logo ? (
              <img
                src={selectedBusiness.logo}
                alt={selectedBusiness.name}
                className="w-full h-full object-contain"
              />
            ) : (
              <Building2 className="w-5 h-5 text-muted-foreground" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate">{selectedBusiness.name}</p>
            {selectedBusiness.colors && selectedBusiness.colors.length > 0 && (
              <div className="flex gap-1 mt-1">
                {selectedBusiness.colors.slice(0, 5).map((color, index) => (
                  <div
                    key={index}
                    className="w-4 h-4 rounded-full border"
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
