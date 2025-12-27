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
import {
  ArrowLeft,
  Trash2,
  Loader2,
  ExternalLink,
  Palette,
  Building2,
  Pencil,
  X,
  Save,
  Plus,
  Upload,
} from "lucide-react";
import { deleteBusiness, updateBusiness } from "@/lib/firebase/firestore";
import { uploadBusinessLogo } from "@/lib/firebase/storage";
import type { Business, BusinessProfile } from "@/types/firebase";

type Props = {
  isletme: Business;
  onBack: () => void;
  onDeleted: (id: string) => void;
  onUpdated?: (updated: Business) => void;
};

type ExtraField = {
  key: string;
  value: string;
};

// Profil alanları için Türkçe etiketler
const profileLabels: Record<string, string> = {
  slogan: "Slogan",
  industry: "Sektör",
  sub_category: "Alt Kategori",
  market_position: "Pazar Konumu",
  location_city: "Şehir / Konum",
  tone: "Ses Tonu",
  language: "Dil",
  formality: "Resmiyet Düzeyi",
  emoji_usage: "Emoji Kullanımı",
  caption_style: "Caption Stili",
  aesthetic: "Estetik",
  photography_style: "Fotoğraf Stili",
  color_mood: "Renk Havası",
  visual_mood: "Görsel Hava",
  target_age_range: "Yaş Aralığı",
  target_gender: "Cinsiyet",
  target_description: "Hedef Kitle Açıklaması",
  target_interests: "İlgi Alanları",
  brand_values: "Marka Değerleri",
  unique_points: "Benzersiz Noktalar",
  brand_story_short: "Kısa Marka Hikayesi",
  hashtags_brand: "Marka Hashtagleri",
  hashtags_industry: "Sektör Hashtagleri",
  hashtags_location: "Konum Hashtagleri",
  content_pillars: "İçerik Direkleri",
  avoid_topics: "Kaçınılacak Konular",
  seasonal_content: "Mevsimsel İçerik",
  promo_frequency: "Promosyon Sıklığı",
  extras: "Ekstra Alanlar",
};

const stringifyProfileValue = (value: unknown): string => {
  if (value === null || value === undefined) return "";
  if (typeof value === "boolean") return value ? "Evet" : "Hayır";
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return value.join(", ");
  if (typeof value === "object") return JSON.stringify(value, null, 2);
  return String(value);
};

const getProfileLabel = (key: string): string => profileLabels[key] || key;

const arrayToString = (arr?: string[]): string => arr?.join(", ") || "";
const stringToArray = (str: string): string[] => str.split(",").map(s => s.trim()).filter(s => s.length > 0);

export default function IsletmeDetay({ isletme, onBack, onDeleted, onUpdated }: Props) {
  const [deleting, setDeleting] = useState(false);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [hata, setHata] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [currentIsletme, setCurrentIsletme] = useState(isletme);

  // Temel Bilgiler
  const [editName, setEditName] = useState("");
  const [editLogoFile, setEditLogoFile] = useState<File | null>(null);
  const [editLogoPreview, setEditLogoPreview] = useState<string | null>(null);
  const [editColors, setEditColors] = useState<string[]>([]);
  const [newColor, setNewColor] = useState("#3b82f6");
  const [editInstagramId, setEditInstagramId] = useState("");
  const [editInstagramToken, setEditInstagramToken] = useState("");

  // Profile alanları
  const [slogan, setSlogan] = useState("");
  const [industry, setIndustry] = useState("");
  const [subCategory, setSubCategory] = useState("");
  const [marketPosition, setMarketPosition] = useState("");
  const [locationCity, setLocationCity] = useState("");
  const [tone, setTone] = useState("");
  const [language, setLanguage] = useState("");
  const [formality, setFormality] = useState("");
  const [emojiUsage, setEmojiUsage] = useState("");
  const [captionStyle, setCaptionStyle] = useState("");
  const [aesthetic, setAesthetic] = useState("");
  const [photographyStyle, setPhotographyStyle] = useState("");
  const [colorMood, setColorMood] = useState("");
  const [visualMood, setVisualMood] = useState("");
  const [targetAgeRange, setTargetAgeRange] = useState("");
  const [targetGender, setTargetGender] = useState("");
  const [targetDescription, setTargetDescription] = useState("");
  const [targetInterests, setTargetInterests] = useState("");
  const [brandValues, setBrandValues] = useState("");
  const [uniquePoints, setUniquePoints] = useState("");
  const [brandStoryShort, setBrandStoryShort] = useState("");
  const [hashtagsBrand, setHashtagsBrand] = useState("");
  const [hashtagsIndustry, setHashtagsIndustry] = useState("");
  const [hashtagsLocation, setHashtagsLocation] = useState("");
  const [contentPillars, setContentPillars] = useState("");
  const [avoidTopics, setAvoidTopics] = useState("");
  const [seasonalContent, setSeasonalContent] = useState(true);
  const [promoFrequency, setPromoFrequency] = useState("");
  const [extraFields, setExtraFields] = useState<ExtraField[]>([]);

  const handleDelete = async () => {
    if (!confirm(`"${currentIsletme.name}" işletmesini silmek istediğinize emin misiniz?`)) return;
    setDeleting(true);
    try {
      await deleteBusiness(currentIsletme.id);
      onDeleted(currentIsletme.id);
    } catch (error) {
      console.error("İşletme silinirken hata:", error);
      alert("İşletme silinirken bir hata oluştu.");
    } finally {
      setDeleting(false);
    }
  };

  const startEditing = () => {
    const p = currentIsletme.profile || {};
    setEditName(currentIsletme.name);
    setEditLogoFile(null);
    setEditLogoPreview(null);
    setEditColors(currentIsletme.colors || []);
    setEditInstagramId(currentIsletme.instagram_account_id || "");
    setEditInstagramToken(currentIsletme.instagram_access_token || "");
    setSlogan(p.slogan || "");
    setIndustry(p.industry || "");
    setSubCategory(p.sub_category || "");
    setMarketPosition(p.market_position || "");
    setLocationCity(p.location_city || "");
    setTone(p.tone || "");
    setLanguage(p.language || "tr");
    setFormality(p.formality || "");
    setEmojiUsage(p.emoji_usage || "");
    setCaptionStyle(p.caption_style || "");
    setAesthetic(p.aesthetic || "");
    setPhotographyStyle(p.photography_style || "");
    setColorMood(p.color_mood || "");
    setVisualMood(p.visual_mood || "");
    setTargetAgeRange(p.target_age_range || "");
    setTargetGender(p.target_gender || "");
    setTargetDescription(p.target_description || "");
    setTargetInterests(arrayToString(p.target_interests));
    setBrandValues(arrayToString(p.brand_values));
    setUniquePoints(arrayToString(p.unique_points));
    setBrandStoryShort(p.brand_story_short || "");
    setHashtagsBrand(arrayToString(p.hashtags_brand));
    setHashtagsIndustry(arrayToString(p.hashtags_industry));
    setHashtagsLocation(arrayToString(p.hashtags_location));
    setContentPillars(arrayToString(p.content_pillars));
    setAvoidTopics(arrayToString(p.avoid_topics));
    setSeasonalContent(p.seasonal_content !== false);
    setPromoFrequency(p.promo_frequency || "");
    setExtraFields(
      Object.entries(p.extras || {}).map(([key, value]) => ({ key, value: String(value) }))
    );
    setHata(null);
    setEditing(true);
  };

  const cancelEditing = () => {
    setEditing(false);
    setHata(null);
  };

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
    setEditLogoFile(file);
    setHata(null);
    const reader = new FileReader();
    reader.onloadend = () => setEditLogoPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleAddColor = () => {
    if (!editColors.includes(newColor)) setEditColors([...editColors, newColor]);
  };

  const handleRemoveColor = (index: number) => {
    setEditColors(editColors.filter((_, i) => i !== index));
  };

  const handleAddExtra = () => setExtraFields([...extraFields, { key: "", value: "" }]);
  const handleRemoveExtra = (index: number) => setExtraFields(extraFields.filter((_, i) => i !== index));
  const handleExtraChange = (index: number, field: "key" | "value", newValue: string) => {
    const updated = [...extraFields];
    updated[index][field] = newValue;
    setExtraFields(updated);
  };

  const handleSave = async () => {
    if (!editName.trim()) {
      setHata("İşletme adı zorunludur.");
      return;
    }
    if (editColors.length === 0) {
      setHata("En az bir renk eklemeniz zorunludur.");
      return;
    }

    setSaving(true);
    setHata(null);

    try {
      let logoUrl = currentIsletme.logo;
      if (editLogoFile) {
        logoUrl = await uploadBusinessLogo(editLogoFile, currentIsletme.id);
      }

      const extras: Record<string, string> = {};
      extraFields.forEach((field) => {
        if (field.key.trim()) extras[field.key.trim()] = field.value;
      });

      const profile: BusinessProfile = {
        ...(slogan && { slogan }),
        ...(industry && { industry }),
        ...(subCategory && { sub_category: subCategory }),
        ...(marketPosition && { market_position: marketPosition }),
        ...(locationCity && { location_city: locationCity }),
        ...(tone && { tone }),
        ...(language && { language }),
        ...(formality && { formality }),
        ...(emojiUsage && { emoji_usage: emojiUsage }),
        ...(captionStyle && { caption_style: captionStyle }),
        ...(aesthetic && { aesthetic }),
        ...(photographyStyle && { photography_style: photographyStyle }),
        ...(colorMood && { color_mood: colorMood }),
        ...(visualMood && { visual_mood: visualMood }),
        ...(targetAgeRange && { target_age_range: targetAgeRange }),
        ...(targetGender && { target_gender: targetGender }),
        ...(targetDescription && { target_description: targetDescription }),
        ...(targetInterests && { target_interests: stringToArray(targetInterests) }),
        ...(brandValues && { brand_values: stringToArray(brandValues) }),
        ...(uniquePoints && { unique_points: stringToArray(uniquePoints) }),
        ...(brandStoryShort && { brand_story_short: brandStoryShort }),
        ...(hashtagsBrand && { hashtags_brand: stringToArray(hashtagsBrand) }),
        ...(hashtagsIndustry && { hashtags_industry: stringToArray(hashtagsIndustry) }),
        ...(hashtagsLocation && { hashtags_location: stringToArray(hashtagsLocation) }),
        ...(contentPillars && { content_pillars: stringToArray(contentPillars) }),
        ...(avoidTopics && { avoid_topics: stringToArray(avoidTopics) }),
        seasonal_content: seasonalContent,
        ...(promoFrequency && { promo_frequency: promoFrequency }),
        ...(Object.keys(extras).length > 0 && { extras }),
      };

      await updateBusiness(currentIsletme.id, {
        name: editName.trim(),
        logo: logoUrl,
        colors: editColors,
        instagram_account_id: editInstagramId.trim(),
        instagram_access_token: editInstagramToken.trim(),
        profile,
      });

      const updated: Business = {
        ...currentIsletme,
        name: editName.trim(),
        logo: logoUrl,
        colors: editColors,
        instagram_account_id: editInstagramId.trim(),
        instagram_access_token: editInstagramToken.trim(),
        profile,
      };
      setCurrentIsletme(updated);
      onUpdated?.(updated);
      setEditing(false);
    } catch (error) {
      console.error("İşletme güncellenirken hata:", error);
      setHata("İşletme güncellenirken bir hata oluştu.");
    } finally {
      setSaving(false);
    }
  };

  const isDisabled = saving;

  // Düzenleme modu
  if (editing) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={cancelEditing} disabled={isDisabled}>
              <X className="w-5 h-5" />
            </Button>
            <div>
              <h2 className="text-2xl font-bold">İşletme Düzenle</h2>
              <p className="text-muted-foreground">{currentIsletme.name}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={cancelEditing} disabled={isDisabled}>İptal</Button>
            <Button onClick={handleSave} disabled={isDisabled}>
              {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              Kaydet
            </Button>
          </div>
        </div>

        {hata && <p className="text-sm text-destructive">{hata}</p>}

        {/* Temel Bilgiler */}
        <Card>
          <CardHeader>
            <CardTitle>Temel Bilgiler</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>İşletme Adı <span className="text-destructive">*</span></Label>
                <Input value={editName} onChange={(e) => setEditName(e.target.value)} disabled={isDisabled} />
              </div>
              <div className="space-y-2">
                <Label>Logo</Label>
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleLogoSelect} className="hidden" />
                <div className="flex gap-3 items-center">
                  <div className="w-16 h-16 bg-muted rounded flex items-center justify-center overflow-hidden border">
                    {editLogoPreview ? (
                      <img src={editLogoPreview} alt="Logo" className="w-full h-full object-contain" />
                    ) : currentIsletme.logo ? (
                      <img src={currentIsletme.logo} alt="Logo" className="w-full h-full object-contain" />
                    ) : (
                      <Building2 className="w-6 h-6 text-muted-foreground" />
                    )}
                  </div>
                  <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={isDisabled}>
                    <Upload className="w-4 h-4 mr-1" /> Değiştir
                  </Button>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label><Palette className="w-4 h-4 inline mr-1" />Renk Paleti <span className="text-destructive">*</span></Label>
              <div className="flex gap-2 items-center">
                <Input type="color" value={newColor} onChange={(e) => setNewColor(e.target.value)} disabled={isDisabled} className="w-12 h-9 p-1" />
                <Input type="text" value={newColor} onChange={(e) => setNewColor(e.target.value)} disabled={isDisabled} className="w-24 font-mono text-sm" />
                <Button type="button" variant="outline" size="sm" onClick={handleAddColor} disabled={isDisabled}><Plus className="w-4 h-4" /></Button>
              </div>
              {editColors.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {editColors.map((color, index) => (
                    <div key={index} className="flex items-center gap-1 bg-muted rounded px-2 py-1">
                      <div className="w-4 h-4 rounded border" style={{ backgroundColor: color }} />
                      <span className="font-mono text-xs">{color}</span>
                      <Button type="button" variant="ghost" size="icon" onClick={() => handleRemoveColor(index)} disabled={isDisabled} className="w-5 h-5"><X className="w-3 h-3" /></Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Instagram Account ID</Label>
                <Input value={editInstagramId} onChange={(e) => setEditInstagramId(e.target.value)} disabled={isDisabled} />
              </div>
              <div className="space-y-2">
                <Label>Instagram Access Token</Label>
                <Input type="password" value={editInstagramToken} onChange={(e) => setEditInstagramToken(e.target.value)} disabled={isDisabled} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Kimlik */}
        <Card>
          <CardHeader><CardTitle>Kimlik</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Slogan</Label>
                <Input value={slogan} onChange={(e) => setSlogan(e.target.value)} disabled={isDisabled} />
              </div>
              <div className="space-y-2">
                <Label>Sektör</Label>
                <Input value={industry} onChange={(e) => setIndustry(e.target.value)} disabled={isDisabled} />
              </div>
              <div className="space-y-2">
                <Label>Alt Kategori</Label>
                <Input value={subCategory} onChange={(e) => setSubCategory(e.target.value)} disabled={isDisabled} />
              </div>
              <div className="space-y-2">
                <Label>Pazar Konumu</Label>
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
                <Label>Şehir / Konum</Label>
                <Input value={locationCity} onChange={(e) => setLocationCity(e.target.value)} disabled={isDisabled} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Marka Sesi */}
        <Card>
          <CardHeader><CardTitle>Marka Sesi</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Ses Tonu</Label>
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
                <Label>Dil</Label>
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
                <Label>Resmiyet Düzeyi</Label>
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
                <Label>Emoji Kullanımı</Label>
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
                <Label>Caption Stili</Label>
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
          <CardHeader><CardTitle>Görsel Tercihler</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Estetik</Label>
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
                <Label>Fotoğraf Stili</Label>
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
                <Label>Renk Havası</Label>
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
                <Label>Görsel Hava</Label>
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
          <CardHeader><CardTitle>Hedef Kitle</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Yaş Aralığı</Label>
                <Input placeholder="25-34" value={targetAgeRange} onChange={(e) => setTargetAgeRange(e.target.value)} disabled={isDisabled} />
              </div>
              <div className="space-y-2">
                <Label>Cinsiyet</Label>
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
              <Label>Hedef Kitle Açıklaması</Label>
              <Textarea value={targetDescription} onChange={(e) => setTargetDescription(e.target.value)} disabled={isDisabled} rows={2} />
            </div>
            <div className="space-y-2">
              <Label>İlgi Alanları</Label>
              <Input placeholder="virgülle ayırın" value={targetInterests} onChange={(e) => setTargetInterests(e.target.value)} disabled={isDisabled} />
            </div>
          </CardContent>
        </Card>

        {/* Değerler */}
        <Card>
          <CardHeader><CardTitle>Marka Değerleri</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Marka Değerleri</Label>
              <Input placeholder="virgülle ayırın" value={brandValues} onChange={(e) => setBrandValues(e.target.value)} disabled={isDisabled} />
            </div>
            <div className="space-y-2">
              <Label>Benzersiz Noktalar</Label>
              <Input placeholder="virgülle ayırın" value={uniquePoints} onChange={(e) => setUniquePoints(e.target.value)} disabled={isDisabled} />
            </div>
            <div className="space-y-2">
              <Label>Kısa Marka Hikayesi</Label>
              <Textarea value={brandStoryShort} onChange={(e) => setBrandStoryShort(e.target.value)} disabled={isDisabled} rows={3} />
            </div>
          </CardContent>
        </Card>

        {/* Sosyal Medya */}
        <Card>
          <CardHeader><CardTitle>Sosyal Medya</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Marka Hashtagleri</Label>
                <Input placeholder="virgülle ayırın" value={hashtagsBrand} onChange={(e) => setHashtagsBrand(e.target.value)} disabled={isDisabled} />
              </div>
              <div className="space-y-2">
                <Label>Sektör Hashtagleri</Label>
                <Input placeholder="virgülle ayırın" value={hashtagsIndustry} onChange={(e) => setHashtagsIndustry(e.target.value)} disabled={isDisabled} />
              </div>
              <div className="space-y-2">
                <Label>Konum Hashtagleri</Label>
                <Input placeholder="virgülle ayırın" value={hashtagsLocation} onChange={(e) => setHashtagsLocation(e.target.value)} disabled={isDisabled} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>İçerik Direkleri</Label>
              <Input placeholder="virgülle ayırın" value={contentPillars} onChange={(e) => setContentPillars(e.target.value)} disabled={isDisabled} />
            </div>
          </CardContent>
        </Card>

        {/* Kurallar */}
        <Card>
          <CardHeader><CardTitle>Kurallar</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Kaçınılacak Konular</Label>
              <Input placeholder="virgülle ayırın" value={avoidTopics} onChange={(e) => setAvoidTopics(e.target.value)} disabled={isDisabled} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <Label>Mevsimsel İçerik</Label>
                  <p className="text-xs text-muted-foreground">Mevsimsel içerikler üretilsin mi?</p>
                </div>
                <Switch checked={seasonalContent} onCheckedChange={setSeasonalContent} disabled={isDisabled} />
              </div>
              <div className="space-y-2">
                <Label>Promosyon Sıklığı</Label>
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
              <CardTitle>Ekstra Alanlar</CardTitle>
              <Button type="button" variant="outline" size="sm" onClick={handleAddExtra} disabled={isDisabled}>
                <Plus className="w-4 h-4 mr-2" /> Alan Ekle
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {extraFields.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center border border-dashed rounded-lg">
                Ekstra alan bulunmuyor.
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
      </div>
    );
  }

  // Görüntüleme modu
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h2 className="text-2xl font-bold">{currentIsletme.name}</h2>
            <p className="text-muted-foreground">İşletme Detayları</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={startEditing}>
            <Pencil className="w-4 h-4 mr-2" /> Düzenle
          </Button>
          <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
            {deleting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Trash2 className="w-4 h-4 mr-2" />}
            Sil
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-lg">Logo</CardTitle></CardHeader>
          <CardContent>
            <div className="w-full aspect-square bg-muted rounded-lg flex items-center justify-center overflow-hidden">
              {currentIsletme.logo ? (
                <img src={currentIsletme.logo} alt={currentIsletme.name} className="w-full h-full object-contain p-4" />
              ) : (
                <Building2 className="w-16 h-16 text-muted-foreground" />
              )}
            </div>
            {currentIsletme.logo && (
              <Button variant="outline" className="w-full mt-4" asChild>
                <a href={currentIsletme.logo} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="w-4 h-4 mr-2" /> Orijinal Boyutta Aç
                </a>
              </Button>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Palette className="w-5 h-5" /> Renk Paleti
            </CardTitle>
          </CardHeader>
          <CardContent>
            {currentIsletme.colors && currentIsletme.colors.length > 0 ? (
              <div className="space-y-3">
                {currentIsletme.colors.map((color, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg border shadow-sm" style={{ backgroundColor: color }} />
                    <span className="font-mono text-sm">{color}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">Renk paleti tanımlanmamış.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-lg">Bilgiler</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Oluşturulma Tarihi</p>
              <p className="font-medium">
                {currentIsletme.createdAt?.toDate?.()?.toLocaleDateString("tr-TR", {
                  day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit",
                }) || "-"}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Son Güncelleme</p>
              <p className="font-medium">
                {currentIsletme.updatedAt?.toDate?.()?.toLocaleDateString("tr-TR", {
                  day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit",
                }) || "-"}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">ID</p>
              <p className="font-mono text-xs break-all">{currentIsletme.id}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {currentIsletme.profile && Object.keys(currentIsletme.profile).length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-lg">Profil Bilgileri</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(currentIsletme.profile).map(([key, value]) => (
                <div key={key} className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">{getProfileLabel(key)}</p>
                  <p className="whitespace-pre-wrap">{stringifyProfileValue(value)}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
