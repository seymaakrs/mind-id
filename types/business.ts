// Business form related types

export type ExtraField = {
  key: string;
  value: string;
};

export type BusinessFormState = {
  // Basic info
  name: string;
  logoFile: File | null;
  logoPreview: string | null;
  colors: string[];
  newColor: string;
  instagramId: string;
  instagramToken: string;

  // Profile - Identity
  slogan: string;
  industry: string;
  subCategory: string;
  marketPosition: string;
  locationCity: string;

  // Profile - Brand Voice
  tone: string;
  language: string;
  formality: string;
  emojiUsage: string;
  captionStyle: string;

  // Profile - Visual
  aesthetic: string;
  photographyStyle: string;
  colorMood: string;
  visualMood: string;

  // Profile - Target Audience
  targetAgeRange: string;
  targetGender: string;
  targetDescription: string;
  targetInterests: string;

  // Profile - Values
  brandValues: string;
  uniquePoints: string;
  brandStoryShort: string;

  // Profile - Social Media
  hashtagsBrand: string;
  hashtagsIndustry: string;
  hashtagsLocation: string;
  contentPillars: string;

  // Profile - Rules
  avoidTopics: string;
  seasonalContent: boolean;
  promoFrequency: string;

  // Extras
  extraFields: ExtraField[];
};
