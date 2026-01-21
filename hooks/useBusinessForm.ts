import { useState, useCallback } from "react";
import type { Business, BusinessProfile } from "@/types/firebase";
import type { BusinessFormState } from "@/types/business";
import { DEFAULT_COLOR, DEFAULT_LANGUAGE } from "@/lib/constants";

const initialState: BusinessFormState = {
  name: "",
  logoFile: null,
  logoPreview: null,
  colors: [],
  newColor: DEFAULT_COLOR,
  instagramId: "",
  instagramToken: "",
  facebookAppId: "",
  facebookAppSecret: "",
  slogan: "",
  industry: "",
  subCategory: "",
  marketPosition: "",
  locationCity: "",
  tone: "",
  language: DEFAULT_LANGUAGE,
  formality: "",
  emojiUsage: "",
  captionStyle: "",
  aesthetic: "",
  photographyStyle: "",
  colorMood: "",
  visualMood: "",
  font: "",
  customFont: "",
  targetAgeRange: "",
  targetGender: "",
  targetDescription: "",
  targetInterests: "",
  brandValues: "",
  uniquePoints: "",
  brandStoryShort: "",
  hashtagsBrand: "",
  hashtagsIndustry: "",
  hashtagsLocation: "",
  contentPillars: "",
  avoidTopics: "",
  seasonalContent: true,
  promoFrequency: "",
  extraFields: [],
};

// Utility functions
const arrayToString = (arr?: string[]): string => arr?.join(", ") || "";
const stringToArray = (str: string): string[] =>
  str
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

type UseBusinessFormReturn = {
  form: BusinessFormState;
  setField: <K extends keyof BusinessFormState>(key: K, value: BusinessFormState[K]) => void;
  setLogoFile: (file: File | null) => void;
  addColor: () => void;
  removeColor: (index: number) => void;
  addExtraField: () => void;
  removeExtraField: (index: number) => void;
  updateExtraField: (index: number, field: "key" | "value", value: string) => void;
  resetForm: () => void;
  loadFromBusiness: (business: Business) => void;
  buildBusinessData: () => {
    name: string;
    colors: string[];
    instagram_account_id: string;
    instagram_access_token: string;
    client_id: string;
    client_secret: string;
    profile: BusinessProfile;
  };
  validate: () => string | null;
};

export function useBusinessForm(): UseBusinessFormReturn {
  const [form, setForm] = useState<BusinessFormState>(initialState);

  const setField = useCallback(
    <K extends keyof BusinessFormState>(key: K, value: BusinessFormState[K]) => {
      setForm((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  const setLogoFile = useCallback((file: File | null) => {
    if (!file) {
      setForm((prev) => ({ ...prev, logoFile: null, logoPreview: null }));
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setForm((prev) => ({
        ...prev,
        logoFile: file,
        logoPreview: reader.result as string,
      }));
    };
    reader.readAsDataURL(file);
  }, []);

  const addColor = useCallback(() => {
    setForm((prev) => {
      if (prev.colors.includes(prev.newColor)) return prev;
      return { ...prev, colors: [...prev.colors, prev.newColor] };
    });
  }, []);

  const removeColor = useCallback((index: number) => {
    setForm((prev) => ({
      ...prev,
      colors: prev.colors.filter((_, i) => i !== index),
    }));
  }, []);

  const addExtraField = useCallback(() => {
    setForm((prev) => ({
      ...prev,
      extraFields: [...prev.extraFields, { key: "", value: "" }],
    }));
  }, []);

  const removeExtraField = useCallback((index: number) => {
    setForm((prev) => ({
      ...prev,
      extraFields: prev.extraFields.filter((_, i) => i !== index),
    }));
  }, []);

  const updateExtraField = useCallback(
    (index: number, field: "key" | "value", value: string) => {
      setForm((prev) => {
        const updated = [...prev.extraFields];
        updated[index] = { ...updated[index], [field]: value };
        return { ...prev, extraFields: updated };
      });
    },
    []
  );

  const resetForm = useCallback(() => {
    setForm(initialState);
  }, []);

  const loadFromBusiness = useCallback((business: Business) => {
    const p = business.profile || {};
    setForm({
      name: business.name,
      logoFile: null,
      logoPreview: null,
      colors: business.colors || [],
      newColor: DEFAULT_COLOR,
      instagramId: business.instagram_account_id || "",
      instagramToken: business.instagram_access_token || "",
      facebookAppId: business.client_id || "",
      facebookAppSecret: business.client_secret || "",
      slogan: p.slogan || "",
      industry: p.industry || "",
      subCategory: p.sub_category || "",
      marketPosition: p.market_position || "",
      locationCity: p.location_city || "",
      tone: p.tone || "",
      language: p.language || DEFAULT_LANGUAGE,
      formality: p.formality || "",
      emojiUsage: p.emoji_usage || "",
      captionStyle: p.caption_style || "",
      aesthetic: p.aesthetic || "",
      photographyStyle: p.photography_style || "",
      colorMood: p.color_mood || "",
      visualMood: p.visual_mood || "",
      font: p.font || "",
      customFont: p.custom_font || "",
      targetAgeRange: p.target_age_range || "",
      targetGender: p.target_gender || "",
      targetDescription: p.target_description || "",
      targetInterests: arrayToString(p.target_interests),
      brandValues: arrayToString(p.brand_values),
      uniquePoints: arrayToString(p.unique_points),
      brandStoryShort: p.brand_story_short || "",
      hashtagsBrand: arrayToString(p.hashtags_brand),
      hashtagsIndustry: arrayToString(p.hashtags_industry),
      hashtagsLocation: arrayToString(p.hashtags_location),
      contentPillars: arrayToString(p.content_pillars),
      avoidTopics: arrayToString(p.avoid_topics),
      seasonalContent: p.seasonal_content !== false,
      promoFrequency: p.promo_frequency || "",
      extraFields: Object.entries(p.extras || {}).map(([key, value]) => ({
        key,
        value: String(value),
      })),
    });
  }, []);

  const buildBusinessData = useCallback(() => {
    const extras: Record<string, string> = {};
    form.extraFields.forEach((field) => {
      if (field.key.trim()) {
        extras[field.key.trim()] = field.value;
      }
    });

    const profile: BusinessProfile = {
      ...(form.slogan && { slogan: form.slogan }),
      ...(form.industry && { industry: form.industry }),
      ...(form.subCategory && { sub_category: form.subCategory }),
      ...(form.marketPosition && { market_position: form.marketPosition }),
      ...(form.locationCity && { location_city: form.locationCity }),
      ...(form.tone && { tone: form.tone }),
      ...(form.language && { language: form.language }),
      ...(form.formality && { formality: form.formality }),
      ...(form.emojiUsage && { emoji_usage: form.emojiUsage }),
      ...(form.captionStyle && { caption_style: form.captionStyle }),
      ...(form.aesthetic && { aesthetic: form.aesthetic }),
      ...(form.photographyStyle && { photography_style: form.photographyStyle }),
      ...(form.colorMood && { color_mood: form.colorMood }),
      ...(form.visualMood && { visual_mood: form.visualMood }),
      ...(form.font && { font: form.font }),
      ...(form.customFont && { custom_font: form.customFont }),
      ...(form.targetAgeRange && { target_age_range: form.targetAgeRange }),
      ...(form.targetGender && { target_gender: form.targetGender }),
      ...(form.targetDescription && { target_description: form.targetDescription }),
      ...(form.targetInterests && { target_interests: stringToArray(form.targetInterests) }),
      ...(form.brandValues && { brand_values: stringToArray(form.brandValues) }),
      ...(form.uniquePoints && { unique_points: stringToArray(form.uniquePoints) }),
      ...(form.brandStoryShort && { brand_story_short: form.brandStoryShort }),
      ...(form.hashtagsBrand && { hashtags_brand: stringToArray(form.hashtagsBrand) }),
      ...(form.hashtagsIndustry && { hashtags_industry: stringToArray(form.hashtagsIndustry) }),
      ...(form.hashtagsLocation && { hashtags_location: stringToArray(form.hashtagsLocation) }),
      ...(form.contentPillars && { content_pillars: stringToArray(form.contentPillars) }),
      ...(form.avoidTopics && { avoid_topics: stringToArray(form.avoidTopics) }),
      seasonal_content: form.seasonalContent,
      ...(form.promoFrequency && { promo_frequency: form.promoFrequency }),
      ...(Object.keys(extras).length > 0 && { extras }),
    };

    return {
      name: form.name.trim(),
      colors: form.colors,
      instagram_account_id: form.instagramId.trim(),
      instagram_access_token: form.instagramToken.trim(),
      client_id: form.facebookAppId.trim(),
      client_secret: form.facebookAppSecret.trim(),
      profile,
    };
  }, [form]);

  const validate = useCallback((): string | null => {
    if (!form.name.trim()) {
      return "İşletme adı zorunludur.";
    }
    if (form.colors.length === 0) {
      return "En az bir renk eklemeniz zorunludur.";
    }
    return null;
  }, [form.name, form.colors]);

  return {
    form,
    setField,
    setLogoFile,
    addColor,
    removeColor,
    addExtraField,
    removeExtraField,
    updateExtraField,
    resetForm,
    loadFromBusiness,
    buildBusinessData,
    validate,
  };
}
