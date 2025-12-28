"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormSection, SelectField } from "@/components/shared";
import { MARKET_POSITION_OPTIONS } from "@/lib/constants";

type Props = {
  slogan: string;
  industry: string;
  subCategory: string;
  marketPosition: string;
  locationCity: string;
  disabled?: boolean;
  onSloganChange: (value: string) => void;
  onIndustryChange: (value: string) => void;
  onSubCategoryChange: (value: string) => void;
  onMarketPositionChange: (value: string) => void;
  onLocationCityChange: (value: string) => void;
};

export function IdentitySection({
  slogan,
  industry,
  subCategory,
  marketPosition,
  locationCity,
  disabled = false,
  onSloganChange,
  onIndustryChange,
  onSubCategoryChange,
  onMarketPositionChange,
  onLocationCityChange,
}: Props) {
  return (
    <FormSection title="Kimlik">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Slogan</Label>
          <Input
            placeholder="Marka sloganı"
            value={slogan}
            onChange={(e) => onSloganChange(e.target.value)}
            disabled={disabled}
          />
        </div>
        <div className="space-y-2">
          <Label>Sektör</Label>
          <Input
            placeholder="Örn: Kahve, Teknoloji"
            value={industry}
            onChange={(e) => onIndustryChange(e.target.value)}
            disabled={disabled}
          />
        </div>
        <div className="space-y-2">
          <Label>Alt Kategori</Label>
          <Input
            placeholder="Örn: Specialty Coffee"
            value={subCategory}
            onChange={(e) => onSubCategoryChange(e.target.value)}
            disabled={disabled}
          />
        </div>
        <SelectField
          label="Pazar Konumu"
          value={marketPosition}
          onChange={onMarketPositionChange}
          options={MARKET_POSITION_OPTIONS}
          disabled={disabled}
        />
        <div className="space-y-2 md:col-span-2">
          <Label>Şehir / Konum</Label>
          <Input
            placeholder="Örn: İstanbul, Kadıköy"
            value={locationCity}
            onChange={(e) => onLocationCityChange(e.target.value)}
            disabled={disabled}
          />
        </div>
      </div>
    </FormSection>
  );
}
