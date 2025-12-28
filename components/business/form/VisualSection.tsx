"use client";

import { FormSection, SelectField } from "@/components/shared";
import {
  AESTHETIC_OPTIONS,
  PHOTOGRAPHY_STYLE_OPTIONS,
  COLOR_MOOD_OPTIONS,
  VISUAL_MOOD_OPTIONS,
} from "@/lib/constants";

type Props = {
  aesthetic: string;
  photographyStyle: string;
  colorMood: string;
  visualMood: string;
  disabled?: boolean;
  onAestheticChange: (value: string) => void;
  onPhotographyStyleChange: (value: string) => void;
  onColorMoodChange: (value: string) => void;
  onVisualMoodChange: (value: string) => void;
};

export function VisualSection({
  aesthetic,
  photographyStyle,
  colorMood,
  visualMood,
  disabled = false,
  onAestheticChange,
  onPhotographyStyleChange,
  onColorMoodChange,
  onVisualMoodChange,
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
      </div>
    </FormSection>
  );
}
