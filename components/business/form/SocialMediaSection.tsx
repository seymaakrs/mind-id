"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormSection } from "@/components/shared";

type Props = {
  hashtagsBrand: string;
  hashtagsIndustry: string;
  hashtagsLocation: string;
  contentPillars: string;
  disabled?: boolean;
  onHashtagsBrandChange: (value: string) => void;
  onHashtagsIndustryChange: (value: string) => void;
  onHashtagsLocationChange: (value: string) => void;
  onContentPillarsChange: (value: string) => void;
};

export function SocialMediaSection({
  hashtagsBrand,
  hashtagsIndustry,
  hashtagsLocation,
  contentPillars,
  disabled = false,
  onHashtagsBrandChange,
  onHashtagsIndustryChange,
  onHashtagsLocationChange,
  onContentPillarsChange,
}: Props) {
  return (
    <FormSection title="Sosyal Medya">
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>Marka Hashtagleri</Label>
            <Input
              placeholder="virgülle ayırın"
              value={hashtagsBrand}
              onChange={(e) => onHashtagsBrandChange(e.target.value)}
              disabled={disabled}
            />
          </div>
          <div className="space-y-2">
            <Label>Sektör Hashtagleri</Label>
            <Input
              placeholder="virgülle ayırın"
              value={hashtagsIndustry}
              onChange={(e) => onHashtagsIndustryChange(e.target.value)}
              disabled={disabled}
            />
          </div>
          <div className="space-y-2">
            <Label>Konum Hashtagleri</Label>
            <Input
              placeholder="virgülle ayırın"
              value={hashtagsLocation}
              onChange={(e) => onHashtagsLocationChange(e.target.value)}
              disabled={disabled}
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label>İçerik Direkleri</Label>
          <Input
            placeholder="virgülle ayırın: ürün, lifestyle, behind-the-scenes"
            value={contentPillars}
            onChange={(e) => onContentPillarsChange(e.target.value)}
            disabled={disabled}
          />
        </div>
      </div>
    </FormSection>
  );
}
