"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FormSection, SelectField } from "@/components/shared";
import { GENDER_OPTIONS } from "@/lib/constants";

type Props = {
  targetAgeRange: string;
  targetGender: string;
  targetDescription: string;
  targetInterests: string;
  disabled?: boolean;
  onTargetAgeRangeChange: (value: string) => void;
  onTargetGenderChange: (value: string) => void;
  onTargetDescriptionChange: (value: string) => void;
  onTargetInterestsChange: (value: string) => void;
};

export function TargetAudienceSection({
  targetAgeRange,
  targetGender,
  targetDescription,
  targetInterests,
  disabled = false,
  onTargetAgeRangeChange,
  onTargetGenderChange,
  onTargetDescriptionChange,
  onTargetInterestsChange,
}: Props) {
  return (
    <FormSection title="Hedef Kitle">
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>Yaş Aralığı</Label>
            <Input
              placeholder="Örn: 25-34"
              value={targetAgeRange}
              onChange={(e) => onTargetAgeRangeChange(e.target.value)}
              disabled={disabled}
            />
          </div>
          <SelectField
            label="Cinsiyet"
            value={targetGender}
            onChange={onTargetGenderChange}
            options={GENDER_OPTIONS}
            disabled={disabled}
          />
        </div>
        <div className="space-y-2">
          <Label>Hedef Kitle Açıklaması</Label>
          <Textarea
            placeholder="Hedef kitlenizi tanımlayın..."
            value={targetDescription}
            onChange={(e) => onTargetDescriptionChange(e.target.value)}
            disabled={disabled}
            rows={2}
          />
        </div>
        <div className="space-y-2">
          <Label>İlgi Alanları</Label>
          <Input
            placeholder="virgülle ayırın: kahve, sanat, müzik"
            value={targetInterests}
            onChange={(e) => onTargetInterestsChange(e.target.value)}
            disabled={disabled}
          />
        </div>
      </div>
    </FormSection>
  );
}
