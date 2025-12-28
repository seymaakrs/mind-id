"use client";

import { FormSection, SelectField } from "@/components/shared";
import {
  TONE_OPTIONS,
  LANGUAGE_OPTIONS,
  FORMALITY_OPTIONS,
  EMOJI_USAGE_OPTIONS,
  CAPTION_STYLE_OPTIONS,
} from "@/lib/constants";

type Props = {
  tone: string;
  language: string;
  formality: string;
  emojiUsage: string;
  captionStyle: string;
  disabled?: boolean;
  onToneChange: (value: string) => void;
  onLanguageChange: (value: string) => void;
  onFormalityChange: (value: string) => void;
  onEmojiUsageChange: (value: string) => void;
  onCaptionStyleChange: (value: string) => void;
};

export function BrandVoiceSection({
  tone,
  language,
  formality,
  emojiUsage,
  captionStyle,
  disabled = false,
  onToneChange,
  onLanguageChange,
  onFormalityChange,
  onEmojiUsageChange,
  onCaptionStyleChange,
}: Props) {
  return (
    <FormSection title="Marka Sesi">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <SelectField
          label="Ses Tonu"
          value={tone}
          onChange={onToneChange}
          options={TONE_OPTIONS}
          disabled={disabled}
        />
        <SelectField
          label="Dil"
          value={language}
          onChange={onLanguageChange}
          options={LANGUAGE_OPTIONS}
          disabled={disabled}
        />
        <SelectField
          label="Resmiyet Düzeyi"
          value={formality}
          onChange={onFormalityChange}
          options={FORMALITY_OPTIONS}
          disabled={disabled}
        />
        <SelectField
          label="Emoji Kullanımı"
          value={emojiUsage}
          onChange={onEmojiUsageChange}
          options={EMOJI_USAGE_OPTIONS}
          disabled={disabled}
        />
        <SelectField
          label="Caption Stili"
          value={captionStyle}
          onChange={onCaptionStyleChange}
          options={CAPTION_STYLE_OPTIONS}
          disabled={disabled}
        />
      </div>
    </FormSection>
  );
}
