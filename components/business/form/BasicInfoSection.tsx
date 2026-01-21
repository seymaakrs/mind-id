"use client";

import { useRef } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Building2, Upload, Palette, Plus, X } from "lucide-react";
import { FormSection } from "@/components/shared";

type Props = {
  name: string;
  logoPreview: string | null;
  existingLogo?: string;
  colors: string[];
  newColor: string;
  instagramId: string;
  instagramToken: string;
  facebookAppId: string;
  facebookAppSecret: string;
  disabled?: boolean;
  onNameChange: (value: string) => void;
  onLogoSelect: (file: File) => void;
  onColorAdd: () => void;
  onColorRemove: (index: number) => void;
  onNewColorChange: (value: string) => void;
  onInstagramIdChange: (value: string) => void;
  onInstagramTokenChange: (value: string) => void;
  onFacebookAppIdChange: (value: string) => void;
  onFacebookAppSecretChange: (value: string) => void;
  logoFileName?: string;
  showLogoRequiredMark?: boolean;
};

export function BasicInfoSection({
  name,
  logoPreview,
  existingLogo,
  colors,
  newColor,
  instagramId,
  instagramToken,
  facebookAppId,
  facebookAppSecret,
  disabled = false,
  onNameChange,
  onLogoSelect,
  onColorAdd,
  onColorRemove,
  onNewColorChange,
  onInstagramIdChange,
  onInstagramTokenChange,
  onFacebookAppIdChange,
  onFacebookAppSecretChange,
  logoFileName,
  showLogoRequiredMark = true,
}: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onLogoSelect(file);
  };

  const displayLogo = logoPreview || existingLogo;

  return (
    <FormSection title="Temel Bilgiler" description="İşletmenin temel bilgilerini girin">
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="isletme-adi">
              İşletme Adı <span className="text-destructive">*</span>
            </Label>
            <Input
              id="isletme-adi"
              placeholder="Örn: Kahve Durağı"
              value={name}
              onChange={(e) => onNameChange(e.target.value)}
              disabled={disabled}
            />
          </div>
          <div className="space-y-2">
            <Label>
              Logo{showLogoRequiredMark && <span className="text-destructive"> *</span>}
            </Label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
            <div className="flex gap-3 items-center">
              <div className="w-16 h-16 bg-muted rounded flex items-center justify-center overflow-hidden border">
                {displayLogo ? (
                  <img src={displayLogo} alt="Logo" className="w-full h-full object-contain" />
                ) : (
                  <Building2 className="w-6 h-6 text-muted-foreground" />
                )}
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={disabled}
              >
                <Upload className="w-4 h-4 mr-1" />
                {existingLogo ? "Değiştir" : "Logo Seç"}
              </Button>
              {logoFileName && (
                <span className="text-sm text-muted-foreground truncate max-w-[150px]">
                  {logoFileName}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Label>
            <Palette className="w-4 h-4 inline mr-1" />
            Renk Paleti <span className="text-destructive">*</span>
          </Label>
          <div className="flex gap-2 items-center">
            <Input
              type="color"
              value={newColor}
              onChange={(e) => onNewColorChange(e.target.value)}
              disabled={disabled}
              className="w-12 h-9 p-1"
            />
            <Input
              type="text"
              value={newColor}
              onChange={(e) => onNewColorChange(e.target.value)}
              disabled={disabled}
              className="w-24 font-mono text-sm"
            />
            <Button type="button" variant="outline" size="sm" onClick={onColorAdd} disabled={disabled}>
              <Plus className="w-4 h-4" />
            </Button>
          </div>
          {colors.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {colors.map((color, index) => (
                <div key={index} className="flex items-center gap-1 bg-muted rounded px-2 py-1">
                  <div className="w-4 h-4 rounded border" style={{ backgroundColor: color }} />
                  <span className="font-mono text-xs">{color}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => onColorRemove(index)}
                    disabled={disabled}
                    className="w-5 h-5"
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="instagram-id">Instagram Account ID</Label>
            <Input
              id="instagram-id"
              placeholder="Instagram hesap ID'si"
              value={instagramId}
              onChange={(e) => onInstagramIdChange(e.target.value)}
              disabled={disabled}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="instagram-token">Instagram Access Token</Label>
            <Input
              id="instagram-token"
              type="password"
              placeholder="Instagram erişim token'ı"
              value={instagramToken}
              onChange={(e) => onInstagramTokenChange(e.target.value)}
              disabled={disabled}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="facebook-app-id">Facebook App ID</Label>
            <Input
              id="facebook-app-id"
              placeholder="Facebook uygulama ID'si"
              value={facebookAppId}
              onChange={(e) => onFacebookAppIdChange(e.target.value)}
              disabled={disabled}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="facebook-app-secret">Facebook App Secret</Label>
            <Input
              id="facebook-app-secret"
              type="password"
              placeholder="Facebook uygulama secret'ı"
              value={facebookAppSecret}
              onChange={(e) => onFacebookAppSecretChange(e.target.value)}
              disabled={disabled}
            />
          </div>
        </div>
      </div>
    </FormSection>
  );
}
