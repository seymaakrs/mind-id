"use client";

import { useEffect } from "react";
import { FormSection, SelectField } from "@/components/shared";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AESTHETIC_OPTIONS,
  PHOTOGRAPHY_STYLE_OPTIONS,
  COLOR_MOOD_OPTIONS,
  VISUAL_MOOD_OPTIONS,
  FONT_OPTIONS,
} from "@/lib/constants";

// Google Fonts family name mapping for preview
const FONT_FAMILIES: Record<string, string> = {
  inter: "Inter",
  roboto: "Roboto",
  "open-sans": "Open Sans",
  montserrat: "Montserrat",
  poppins: "Poppins",
  "playfair-display": "Playfair Display",
  lora: "Lora",
  raleway: "Raleway",
  oswald: "Oswald",
  "bebas-neue": "Bebas Neue",
};

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
  // Load Google Fonts for preview
  useEffect(() => {
    const families = Object.values(FONT_FAMILIES).map((f) => f.replace(/ /g, "+")).join("&family=");
    const linkId = "google-fonts-preview";
    if (!document.getElementById(linkId)) {
      const link = document.createElement("link");
      link.id = linkId;
      link.rel = "stylesheet";
      link.href = `https://fonts.googleapis.com/css2?family=${families}&display=swap`;
      document.head.appendChild(link);
    }
  }, []);

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
        <div className="space-y-2">
          <Label>Yazı Fontu</Label>
          <Select value={font} onValueChange={onFontChange} disabled={disabled}>
            <SelectTrigger
              style={
                font && font !== "custom" && FONT_FAMILIES[font]
                  ? { fontFamily: `'${FONT_FAMILIES[font]}', sans-serif` }
                  : undefined
              }
            >
              <SelectValue placeholder="Seçin" />
            </SelectTrigger>
            <SelectContent>
              {FONT_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  <span
                    style={
                      FONT_FAMILIES[option.value]
                        ? { fontFamily: `'${FONT_FAMILIES[option.value]}', sans-serif` }
                        : undefined
                    }
                  >
                    {option.label}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
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
