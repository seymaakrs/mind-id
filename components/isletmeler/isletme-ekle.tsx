"use client";

import { useState, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2, Building2, Loader2, Upload, X, Palette } from "lucide-react";
import { addBusiness } from "@/lib/firebase/firestore";
import { uploadBusinessLogo } from "@/lib/firebase/storage";
import type { BusinessProfile } from "@/types/firebase";

type ExtraField = {
  key: string;
  value: string;
};

type Status = "bosta" | "kaydediliyor" | "basarili" | "hata";

// Array alanları için yardımcı: virgülle ayrılmış string'i array'e çevir
const stringToArray = (str: string): string[] => {
  return str.split(",").map(s => s.trim()).filter(s => s.length > 0);
};

export default function IsletmeEkleComponent() {
  const [status, setStatus] = useState<Status>("bosta");
  const [hata, setHata] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Temel Bilgiler
  const [isletmeAdi, setIsletmeAdi] = useState("");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [colors, setColors] = useState<string[]>([]);
  const [newColor, setNewColor] = useState("#3b82f6");
  const [instagramAccountId, setInstagramAccountId] = useState("");
  const [instagramAccessToken, setInstagramAccessToken] = useState("");

  // Kimlik
  const [slogan, setSlogan] = useState("");
  const [industry, setIndustry] = useState("");
  const [subCategory, setSubCategory] = useState("");
  const [marketPosition, setMarketPosition] = useState("");
  const [locationCity, setLocationCity] = useState("");

  // Marka Sesi
  const [tone, setTone] = useState("");
  const [language, setLanguage] = useState("tr");
  const [formality, setFormality] = useState("");
  const [emojiUsage, setEmojiUsage] = useState("");
  const [captionStyle, setCaptionStyle] = useState("");

  // Görsel
  const [aesthetic, setAesthetic] = useState("");
  const [photographyStyle, setPhotographyStyle] = useState("");
  const [colorMood, setColorMood] = useState("");
  const [visualMood, setVisualMood] = useState("");

  // Hedef Kitle
  const [targetAgeRange, setTargetAgeRange] = useState("");
  const [targetGender, setTargetGender] = useState("");
  const [targetDescription, setTargetDescription] = useState("");
  const [targetInterests, setTargetInterests] = useState("");

  // Değerler
  const [brandValues, setBrandValues] = useState("");
  const [uniquePoints, setUniquePoints] = useState("");
  const [brandStoryShort, setBrandStoryShort] = useState("");

  // Sosyal Medya
  const [hashtagsBrand, setHashtagsBrand] = useState("");
  const [hashtagsIndustry, setHashtagsIndustry] = useState("");
  const [hashtagsLocation, setHashtagsLocation] = useState("");
  const [contentPillars, setContentPillars] = useState("");

  // Kurallar
  const [avoidTopics, setAvoidTopics] = useState("");
  const [seasonalContent, setSeasonalContent] = useState(true);
  const [promoFrequency, setPromoFrequency] = useState("");

  // Extras
  const [extraFields, setExtraFields] = useState<ExtraField[]>([]);

  // Logo seçme
  const handleLogoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setHata("Lütfen geçerli bir resim dosyası seçin.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setHata("Logo dosyası 5MB'dan küçük olmalıdır.");
      return;
    }

    setLogoFile(file);
    setHata(null);

    const reader = new FileReader();
    reader.onloadend = () => setLogoPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleLogoClear = () => {
    setLogoFile(null);
    setLogoPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Renk işlemleri
  const handleAddColor = () => {
    if (!colors.includes(newColor)) {
      setColors([...colors, newColor]);
    }
  };

  const handleRemoveColor = (index: number) => {
    setColors(colors.filter((_, i) => i !== index));
  };

  // Extra alan işlemleri
  const handleAddExtra = () => {
    setExtraFields([...extraFields, { key: "", value: "" }]);
  };

  const handleRemoveExtra = (index: number) => {
    setExtraFields(extraFields.filter((_, i) => i !== index));
  };

  const handleExtraChange = (index: number, field: "key" | "value", newValue: string) => {
    const updated = [...extraFields];
    updated[index][field] = newValue;
    setExtraFields(updated);
  };

  // Formu sıfırla
  const resetForm = () => {
    setIsletmeAdi("");
    setLogoFile(null);
    setLogoPreview(null);
    setColors([]);
    setNewColor("#3b82f6");
    setInstagramAccountId("");
    setInstagramAccessToken("");
    setSlogan("");
    setIndustry("");
    setSubCategory("");
    setMarketPosition("");
    setLocationCity("");
    setTone("");
    setLanguage("tr");
    setFormality("");
    setEmojiUsage("");
    setCaptionStyle("");
    setAesthetic("");
    setPhotographyStyle("");
    setColorMood("");
    setVisualMood("");
    setTargetAgeRange("");
    setTargetGender("");
    setTargetDescription("");
    setTargetInterests("");
    setBrandValues("");
    setUniquePoints("");
    setBrandStoryShort("");
    setHashtagsBrand("");
    setHashtagsIndustry("");
    setHashtagsLocation("");
    setContentPillars("");
    setAvoidTopics("");
    setSeasonalContent(true);
    setPromoFrequency("");
    setExtraFields([]);
    setHata(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Kaydet
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Zorunlu alan validasyonları
    if (!isletmeAdi.trim()) {
      setHata("İşletme adı zorunludur.");
      return;
    }

    if (!logoFile) {
      setHata("Logo yüklemek zorunludur.");
      return;
    }

    if (colors.length === 0) {
      setHata("En az bir renk eklemeniz zorunludur.");
      return;
    }

    if (!instagramAccountId.trim()) {
      setHata("Instagram Account ID zorunludur.");
      return;
    }

    if (!instagramAccessToken.trim()) {
      setHata("Instagram Access Token zorunludur.");
      return;
    }

    // Extras objesine dönüştür
    const extras: Record<string, string> = {};
    extraFields.forEach((field) => {
      if (field.key.trim()) {
        extras[field.key.trim()] = field.value;
      }
    });

    // Profile objesi oluştur
    const profile: BusinessProfile = {
      // Kimlik
      ...(slogan && { slogan }),
      ...(industry && { industry }),
      ...(subCategory && { sub_category: subCategory }),
      ...(marketPosition && { market_position: marketPosition }),
      ...(locationCity && { location_city: locationCity }),

      // Marka Sesi
      ...(tone && { tone }),
      ...(language && { language }),
      ...(formality && { formality }),
      ...(emojiUsage && { emoji_usage: emojiUsage }),
      ...(captionStyle && { caption_style: captionStyle }),

      // Görsel
      ...(aesthetic && { aesthetic }),
      ...(photographyStyle && { photography_style: photographyStyle }),
      ...(colorMood && { color_mood: colorMood }),
      ...(visualMood && { visual_mood: visualMood }),

      // Hedef Kitle
      ...(targetAgeRange && { target_age_range: targetAgeRange }),
      ...(targetGender && { target_gender: targetGender }),
      ...(targetDescription && { target_description: targetDescription }),
      ...(targetInterests && { target_interests: stringToArray(targetInterests) }),

      // Değerler
      ...(brandValues && { brand_values: stringToArray(brandValues) }),
      ...(uniquePoints && { unique_points: stringToArray(uniquePoints) }),
      ...(brandStoryShort && { brand_story_short: brandStoryShort }),

      // Sosyal Medya
      ...(hashtagsBrand && { hashtags_brand: stringToArray(hashtagsBrand) }),
      ...(hashtagsIndustry && { hashtags_industry: stringToArray(hashtagsIndustry) }),
      ...(hashtagsLocation && { hashtags_location: stringToArray(hashtagsLocation) }),
      ...(contentPillars && { content_pillars: stringToArray(contentPillars) }),

      // Kurallar
      ...(avoidTopics && { avoid_topics: stringToArray(avoidTopics) }),
      seasonal_content: seasonalContent,
      ...(promoFrequency && { promo_frequency: promoFrequency }),

      // Extras
      ...(Object.keys(extras).length > 0 && { extras }),
    };

    setStatus("kaydediliyor");
    setHata(null);

    try {
      const tempId = Date.now().toString();
      const logoUrl = await uploadBusinessLogo(logoFile, tempId);

      await addBusiness({
        name: isletmeAdi.trim(),
        logo: logoUrl,
        colors,
        instagram_account_id: instagramAccountId.trim(),
        instagram_access_token: instagramAccessToken.trim(),
        profile,
      });

      setStatus("basarili");
      resetForm();
      setTimeout(() => setStatus("bosta"), 3000);
    } catch (error) {
      console.error("İşletme kaydetme hatası:", error);
      setHata("İşletme kaydedilirken bir hata oluştu.");
      setStatus("hata");
    }
  };

  const isDisabled = status === "kaydediliyor";

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Building2 className="w-8 h-8" />
        <div>
          <h2 className="text-2xl font-bold">İşletme Ekle</h2>
          <p className="text-muted-foreground">Yeni bir işletme kaydı oluşturun</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Temel Bilgiler */}
        <Card>
          <CardHeader>
            <CardTitle>Temel Bilgiler</CardTitle>
            <CardDescription>İşletme adı, logo ve Instagram bilgileri</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* İşletme Adı */}
            <div className="space-y-2">
              <Label htmlFor="isletme-adi">
                İşletme Adı <span className="text-destructive">*</span>
              </Label>
              <Input
                id="isletme-adi"
                placeholder="Örn: Kahve Durağı"
                value={isletmeAdi}
                onChange={(e) => setIsletmeAdi(e.target.value)}
                disabled={isDisabled}
              />
            </div>

            {/* Logo */}
            <div className="space-y-2">
              <Label>Logo <span className="text-destructive">*</span></Label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleLogoSelect}
                className="hidden"
              />

              {!logoPreview ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isDisabled}
                  className="w-full h-24 border-dashed flex flex-col gap-1"
                >
                  <Upload className="w-6 h-6" />
                  <span className="text-sm">Logo yükle (max 5MB)</span>
                </Button>
              ) : (
                <div className="relative border rounded-lg p-3 flex items-center gap-4">
                  <img src={logoPreview} alt="Logo" className="w-16 h-16 object-contain rounded" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{logoFile?.name}</p>
                    <p className="text-xs text-muted-foreground">{logoFile && (logoFile.size / 1024).toFixed(1)} KB</p>
                  </div>
                  <Button type="button" variant="ghost" size="icon" onClick={handleLogoClear} disabled={isDisabled}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>

            {/* Renk Paleti */}
            <div className="space-y-2">
              <Label>
                <div className="flex items-center gap-2">
                  <Palette className="w-4 h-4" />
                  Renk Paleti <span className="text-destructive">*</span>
                </div>
              </Label>
              <div className="flex gap-2 items-center">
                <Input type="color" value={newColor} onChange={(e) => setNewColor(e.target.value)} disabled={isDisabled} className="w-12 h-9 p-1 cursor-pointer" />
                <Input type="text" value={newColor} onChange={(e) => setNewColor(e.target.value)} disabled={isDisabled} className="w-24 font-mono text-sm" />
                <Button type="button" variant="outline" size="sm" onClick={handleAddColor} disabled={isDisabled}>
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              {colors.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {colors.map((color, index) => (
                    <div key={index} className="flex items-center gap-1 bg-muted rounded px-2 py-1">
                      <div className="w-4 h-4 rounded border" style={{ backgroundColor: color }} />
                      <span className="font-mono text-xs">{color}</span>
                      <Button type="button" variant="ghost" size="icon" onClick={() => handleRemoveColor(index)} disabled={isDisabled} className="w-5 h-5">
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Instagram Bilgileri */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="instagram-id">Instagram Account ID <span className="text-destructive">*</span></Label>
                <Input id="instagram-id" placeholder="17841400000000000" value={instagramAccountId} onChange={(e) => setInstagramAccountId(e.target.value)} disabled={isDisabled} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="instagram-token">Instagram Access Token <span className="text-destructive">*</span></Label>
                <Input id="instagram-token" type="password" placeholder="Access token" value={instagramAccessToken} onChange={(e) => setInstagramAccessToken(e.target.value)} disabled={isDisabled} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Kimlik */}
        <Card>
          <CardHeader>
            <CardTitle>Kimlik</CardTitle>
            <CardDescription>Marka kimliği ve konumlandırma bilgileri</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="slogan">Slogan</Label>
                <Input id="slogan" placeholder="Her yudumda mutluluk" value={slogan} onChange={(e) => setSlogan(e.target.value)} disabled={isDisabled} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="industry">Sektör</Label>
                <Input id="industry" placeholder="cafe, restaurant, retail..." value={industry} onChange={(e) => setIndustry(e.target.value)} disabled={isDisabled} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sub-category">Alt Kategori</Label>
                <Input id="sub-category" placeholder="specialty coffee, fast food..." value={subCategory} onChange={(e) => setSubCategory(e.target.value)} disabled={isDisabled} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="market-position">Pazar Konumu</Label>
                <Select value={marketPosition} onValueChange={setMarketPosition} disabled={isDisabled}>
                  <SelectTrigger><SelectValue placeholder="Seçin" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="budget">Budget</SelectItem>
                    <SelectItem value="mid-range">Mid-range</SelectItem>
                    <SelectItem value="premium">Premium</SelectItem>
                    <SelectItem value="luxury">Luxury</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="location">Şehir / Konum</Label>
                <Input id="location" placeholder="İstanbul, Kadıköy" value={locationCity} onChange={(e) => setLocationCity(e.target.value)} disabled={isDisabled} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Marka Sesi */}
        <Card>
          <CardHeader>
            <CardTitle>Marka Sesi</CardTitle>
            <CardDescription>İletişim tonu ve stil tercihleri</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tone">Ses Tonu</Label>
                <Select value={tone} onValueChange={setTone} disabled={isDisabled}>
                  <SelectTrigger><SelectValue placeholder="Seçin" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="friendly">Samimi</SelectItem>
                    <SelectItem value="professional">Profesyonel</SelectItem>
                    <SelectItem value="playful">Eğlenceli</SelectItem>
                    <SelectItem value="inspirational">İlham Verici</SelectItem>
                    <SelectItem value="authoritative">Otoriter</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="language">Dil</Label>
                <Select value={language} onValueChange={setLanguage} disabled={isDisabled}>
                  <SelectTrigger><SelectValue placeholder="Seçin" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tr">Türkçe</SelectItem>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="tr-en">Türkçe + English</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="formality">Resmiyet Düzeyi</Label>
                <Select value={formality} onValueChange={setFormality} disabled={isDisabled}>
                  <SelectTrigger><SelectValue placeholder="Seçin" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="formal">Resmi</SelectItem>
                    <SelectItem value="semi-formal">Yarı Resmi</SelectItem>
                    <SelectItem value="informal">Samimi</SelectItem>
                    <SelectItem value="casual">Günlük</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="emoji-usage">Emoji Kullanımı</Label>
                <Select value={emojiUsage} onValueChange={setEmojiUsage} disabled={isDisabled}>
                  <SelectTrigger><SelectValue placeholder="Seçin" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Yok</SelectItem>
                    <SelectItem value="minimal">Minimal</SelectItem>
                    <SelectItem value="moderate">Orta</SelectItem>
                    <SelectItem value="heavy">Yoğun</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="caption-style">Caption Stili</Label>
                <Select value={captionStyle} onValueChange={setCaptionStyle} disabled={isDisabled}>
                  <SelectTrigger><SelectValue placeholder="Seçin" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="storytelling">Hikaye Anlatımı</SelectItem>
                    <SelectItem value="informative">Bilgilendirici</SelectItem>
                    <SelectItem value="question">Soru Soran</SelectItem>
                    <SelectItem value="call-to-action">Aksiyon Çağrısı</SelectItem>
                    <SelectItem value="minimal">Minimal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Görsel */}
        <Card>
          <CardHeader>
            <CardTitle>Görsel Tercihler</CardTitle>
            <CardDescription>Görsel stil ve estetik tercihleri</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="aesthetic">Estetik</Label>
                <Select value={aesthetic} onValueChange={setAesthetic} disabled={isDisabled}>
                  <SelectTrigger><SelectValue placeholder="Seçin" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="modern">Modern</SelectItem>
                    <SelectItem value="minimalist">Minimalist</SelectItem>
                    <SelectItem value="vintage">Vintage</SelectItem>
                    <SelectItem value="rustic">Rustik</SelectItem>
                    <SelectItem value="luxurious">Lüks</SelectItem>
                    <SelectItem value="playful">Eğlenceli</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="photography-style">Fotoğraf Stili</Label>
                <Select value={photographyStyle} onValueChange={setPhotographyStyle} disabled={isDisabled}>
                  <SelectTrigger><SelectValue placeholder="Seçin" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bright">Aydınlık</SelectItem>
                    <SelectItem value="dark">Karanlık</SelectItem>
                    <SelectItem value="natural">Doğal</SelectItem>
                    <SelectItem value="studio">Stüdyo</SelectItem>
                    <SelectItem value="lifestyle">Yaşam Tarzı</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="color-mood">Renk Havası</Label>
                <Select value={colorMood} onValueChange={setColorMood} disabled={isDisabled}>
                  <SelectTrigger><SelectValue placeholder="Seçin" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="warm">Sıcak</SelectItem>
                    <SelectItem value="cool">Soğuk</SelectItem>
                    <SelectItem value="neutral">Nötr</SelectItem>
                    <SelectItem value="vibrant">Canlı</SelectItem>
                    <SelectItem value="muted">Pastel</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="visual-mood">Görsel Hava</Label>
                <Select value={visualMood} onValueChange={setVisualMood} disabled={isDisabled}>
                  <SelectTrigger><SelectValue placeholder="Seçin" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cozy">Sıcak/Samimi</SelectItem>
                    <SelectItem value="energetic">Enerjik</SelectItem>
                    <SelectItem value="calm">Sakin</SelectItem>
                    <SelectItem value="elegant">Zarif</SelectItem>
                    <SelectItem value="edgy">Keskin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Hedef Kitle */}
        <Card>
          <CardHeader>
            <CardTitle>Hedef Kitle</CardTitle>
            <CardDescription>Hedef kitlenizin demografik bilgileri</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="target-age">Yaş Aralığı</Label>
                <Input id="target-age" placeholder="25-34" value={targetAgeRange} onChange={(e) => setTargetAgeRange(e.target.value)} disabled={isDisabled} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="target-gender">Cinsiyet</Label>
                <Select value={targetGender} onValueChange={setTargetGender} disabled={isDisabled}>
                  <SelectTrigger><SelectValue placeholder="Seçin" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tümü</SelectItem>
                    <SelectItem value="male">Erkek</SelectItem>
                    <SelectItem value="female">Kadın</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="target-desc">Hedef Kitle Açıklaması</Label>
              <Textarea id="target-desc" placeholder="Kaliteli kahve arayan şehirli profesyoneller..." value={targetDescription} onChange={(e) => setTargetDescription(e.target.value)} disabled={isDisabled} rows={2} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="target-interests">İlgi Alanları</Label>
              <Input id="target-interests" placeholder="kahve, sanat, müzik (virgülle ayırın)" value={targetInterests} onChange={(e) => setTargetInterests(e.target.value)} disabled={isDisabled} />
              <p className="text-xs text-muted-foreground">Virgülle ayırarak birden fazla ekleyin</p>
            </div>
          </CardContent>
        </Card>

        {/* Değerler */}
        <Card>
          <CardHeader>
            <CardTitle>Marka Değerleri</CardTitle>
            <CardDescription>Markanızın değerleri ve benzersiz noktaları</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="brand-values">Marka Değerleri</Label>
              <Input id="brand-values" placeholder="quality, sustainability, community (virgülle ayırın)" value={brandValues} onChange={(e) => setBrandValues(e.target.value)} disabled={isDisabled} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="unique-points">Benzersiz Noktalar</Label>
              <Input id="unique-points" placeholder="Özel kavrum, Organik çekirdek (virgülle ayırın)" value={uniquePoints} onChange={(e) => setUniquePoints(e.target.value)} disabled={isDisabled} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="brand-story">Kısa Marka Hikayesi</Label>
              <Textarea id="brand-story" placeholder="2015'te kahve tutkusuyla başladık..." value={brandStoryShort} onChange={(e) => setBrandStoryShort(e.target.value)} disabled={isDisabled} rows={3} />
            </div>
          </CardContent>
        </Card>

        {/* Sosyal Medya */}
        <Card>
          <CardHeader>
            <CardTitle>Sosyal Medya</CardTitle>
            <CardDescription>Hashtag ve içerik stratejisi</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="hashtags-brand">Marka Hashtagleri</Label>
                <Input id="hashtags-brand" placeholder="#KahveDuragi (virgülle ayırın)" value={hashtagsBrand} onChange={(e) => setHashtagsBrand(e.target.value)} disabled={isDisabled} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="hashtags-industry">Sektör Hashtagleri</Label>
                <Input id="hashtags-industry" placeholder="#kahve, #coffee (virgülle ayırın)" value={hashtagsIndustry} onChange={(e) => setHashtagsIndustry(e.target.value)} disabled={isDisabled} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="hashtags-location">Konum Hashtagleri</Label>
                <Input id="hashtags-location" placeholder="#kadikoy, #istanbul (virgülle ayırın)" value={hashtagsLocation} onChange={(e) => setHashtagsLocation(e.target.value)} disabled={isDisabled} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="content-pillars">İçerik Direkleri</Label>
              <Input id="content-pillars" placeholder="product_showcase, behind_scenes, tips_education (virgülle ayırın)" value={contentPillars} onChange={(e) => setContentPillars(e.target.value)} disabled={isDisabled} />
            </div>
          </CardContent>
        </Card>

        {/* Kurallar */}
        <Card>
          <CardHeader>
            <CardTitle>Kurallar</CardTitle>
            <CardDescription>İçerik kuralları ve kısıtlamalar</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="avoid-topics">Kaçınılacak Konular</Label>
              <Input id="avoid-topics" placeholder="politik, dini (virgülle ayırın)" value={avoidTopics} onChange={(e) => setAvoidTopics(e.target.value)} disabled={isDisabled} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <Label htmlFor="seasonal">Mevsimsel İçerik</Label>
                  <p className="text-xs text-muted-foreground">Mevsimsel içerikler üretilsin mi?</p>
                </div>
                <Switch id="seasonal" checked={seasonalContent} onCheckedChange={setSeasonalContent} disabled={isDisabled} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="promo-freq">Promosyon Sıklığı</Label>
                <Select value={promoFrequency} onValueChange={setPromoFrequency} disabled={isDisabled}>
                  <SelectTrigger><SelectValue placeholder="Seçin" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="never">Hiç</SelectItem>
                    <SelectItem value="rare">Nadiren</SelectItem>
                    <SelectItem value="occasional">Ara Sıra</SelectItem>
                    <SelectItem value="frequent">Sık</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Ekstra Alanlar */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Ekstra Alanlar</CardTitle>
                <CardDescription>Özel bilgiler ekleyin</CardDescription>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={handleAddExtra} disabled={isDisabled}>
                <Plus className="w-4 h-4 mr-2" />
                Alan Ekle
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {extraFields.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center border border-dashed rounded-lg">
                Ekstra alan bulunmuyor. &quot;Alan Ekle&quot; butonuna tıklayarak başlayın.
              </p>
            ) : (
              <div className="space-y-3">
                {extraFields.map((field, index) => (
                  <div key={index} className="flex gap-3 items-start">
                    <Input placeholder="Alan adı" value={field.key} onChange={(e) => handleExtraChange(index, "key", e.target.value)} disabled={isDisabled} className="w-1/3" />
                    <Input placeholder="Değer" value={field.value} onChange={(e) => handleExtraChange(index, "value", e.target.value)} disabled={isDisabled} className="flex-1" />
                    <Button type="button" variant="ghost" size="icon" onClick={() => handleRemoveExtra(index)} disabled={isDisabled} className="text-destructive">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Hata / Başarı Mesajları */}
        {hata && <p className="text-sm text-destructive">{hata}</p>}
        {status === "basarili" && <p className="text-sm text-green-500">İşletme başarıyla kaydedildi!</p>}

        {/* Butonlar */}
        <div className="flex gap-3">
          <Button type="submit" disabled={isDisabled} className="flex-1">
            {status === "kaydediliyor" ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Kaydediliyor...
              </>
            ) : (
              "Kaydet"
            )}
          </Button>
          <Button type="button" variant="outline" onClick={resetForm} disabled={isDisabled}>
            Temizle
          </Button>
        </div>
      </form>
    </div>
  );
}
