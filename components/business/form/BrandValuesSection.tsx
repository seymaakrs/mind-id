"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FormSection } from "@/components/shared";

type Props = {
  brandValues: string;
  uniquePoints: string;
  brandStoryShort: string;
  disabled?: boolean;
  onBrandValuesChange: (value: string) => void;
  onUniquePointsChange: (value: string) => void;
  onBrandStoryShortChange: (value: string) => void;
};

export function BrandValuesSection({
  brandValues,
  uniquePoints,
  brandStoryShort,
  disabled = false,
  onBrandValuesChange,
  onUniquePointsChange,
  onBrandStoryShortChange,
}: Props) {
  return (
    <FormSection title="Marka Değerleri">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Marka Değerleri</Label>
          <Input
            placeholder="virgülle ayırın: kalite, sürdürülebilirlik"
            value={brandValues}
            onChange={(e) => onBrandValuesChange(e.target.value)}
            disabled={disabled}
          />
        </div>
        <div className="space-y-2">
          <Label>Benzersiz Noktalar</Label>
          <Input
            placeholder="virgülle ayırın: el yapımı, organik"
            value={uniquePoints}
            onChange={(e) => onUniquePointsChange(e.target.value)}
            disabled={disabled}
          />
        </div>
        <div className="space-y-2">
          <Label>Kısa Marka Hikayesi</Label>
          <Textarea
            placeholder="Markanızın kısa hikayesi..."
            value={brandStoryShort}
            onChange={(e) => onBrandStoryShortChange(e.target.value)}
            disabled={disabled}
            rows={3}
          />
        </div>
      </div>
    </FormSection>
  );
}
