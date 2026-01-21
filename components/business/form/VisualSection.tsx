"use client";

import { FormSection, SelectField } from "@/components/shared";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AESTHETIC_OPTIONS,
  PHOTOGRAPHY_STYLE_OPTIONS,
  COLOR_MOOD_OPTIONS,
  VISUAL_MOOD_OPTIONS,
  FONT_OPTIONS,
} from "@/lib/constants";

type Props = {
  aesthetic: string;
  photographyStyle: string;
  colorMood: string;
  visualMood: string;
  font: string;
  customFont: string;
  disabled?: boolean;
  onAestheticChange: (value: string) => void;
  onPhotographyStyleChange: (value: string) => void;
  onColorMoodChange: (value: string) => void;
  onVisualMoodChange: (value: string) => void;
  onFontChange: (value: string) => void;
  onCustomFontChange: (value: string) => void;
};

export function VisualSection({
  aesthetic,
  photographyStyle,
  colorMood,
  visualMood,
  font,
  customFont,
  disabled = false,
  onAestheticChange,
  onPhotographyStyleChange,
  onColorMoodChange,
  onVisualMoodChange,
  onFontChange,
  onCustomFontChange,
}: Props) {
  return (
    <FormSection title="Görsel Tercihler">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <SelectField
          label="Estetik"
          value={aesthetic}
          onChange={onAestheticChange}
          options={AESTHETIC_OPTIONS}
          disabled={disabled}
        />
        <SelectField
          label="Fotoğraf Stili"
          value={photographyStyle}
          onChange={onPhotographyStyleChange}
          options={PHOTOGRAPHY_STYLE_OPTIONS}
          disabled={disabled}
        />
        <SelectField
          label="Renk Havası"
          value={colorMood}
          onChange={onColorMoodChange}
          options={COLOR_MOOD_OPTIONS}
          disabled={disabled}
        />
        <SelectField
          label="Görsel Hava"
          value={visualMood}
          onChange={onVisualMoodChange}
          options={VISUAL_MOOD_OPTIONS}
          disabled={disabled}
        />
        <SelectField
          label="Yazı Fontu"
          value={font}
          onChange={onFontChange}
          options={FONT_OPTIONS}
          disabled={disabled}
        />
        {font === "custom" && (
          <div className="space-y-2">
            <Label htmlFor="custom-font">Özel Font Adı</Label>
            <Input
              id="custom-font"
              placeholder="Örn: Bebas Neue, Futura, etc."
              value={customFont}
              onChange={(e) => onCustomFontChange(e.target.value)}
              disabled={disabled}
            />
          </div>
        )}
      </div>
    </FormSection>
  );
}
