"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { FormSection, SelectField } from "@/components/shared";
import { PROMO_FREQUENCY_OPTIONS } from "@/lib/constants";

type Props = {
  avoidTopics: string;
  seasonalContent: boolean;
  promoFrequency: string;
  disabled?: boolean;
  onAvoidTopicsChange: (value: string) => void;
  onSeasonalContentChange: (value: boolean) => void;
  onPromoFrequencyChange: (value: string) => void;
};

export function RulesSection({
  avoidTopics,
  seasonalContent,
  promoFrequency,
  disabled = false,
  onAvoidTopicsChange,
  onSeasonalContentChange,
  onPromoFrequencyChange,
}: Props) {
  return (
    <FormSection title="Kurallar">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Kaçınılacak Konular</Label>
          <Input
            placeholder="virgülle ayırın: politika, din"
            value={avoidTopics}
            onChange={(e) => onAvoidTopicsChange(e.target.value)}
            disabled={disabled}
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <Label>Mevsimsel İçerik</Label>
              <p className="text-xs text-muted-foreground">Mevsimsel içerikler üretilsin mi?</p>
            </div>
            <Switch
              checked={seasonalContent}
              onCheckedChange={onSeasonalContentChange}
              disabled={disabled}
            />
          </div>
          <SelectField
            label="Promosyon Sıklığı"
            value={promoFrequency}
            onChange={onPromoFrequencyChange}
            options={PROMO_FREQUENCY_OPTIONS}
            disabled={disabled}
          />
        </div>
      </div>
    </FormSection>
  );
}
