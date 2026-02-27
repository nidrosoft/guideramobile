/**
 * AI GENERATION ENGINE - MODULE OUTPUT TYPES
 * 
 * Defines the structured output types for each AI generation module.
 */

// ============================================
// PACKING LIST MODULE
// ============================================

export type PackingItemPriority = 'critical' | 'essential' | 'recommended' | 'optional';
export type PackingItemWeight = 'minimal' | 'light' | 'medium' | 'heavy' | 'very_heavy';
export type PackingItemStatus = 'check' | 'pack' | 'action_required';

export interface PackingItem {
  name: string;
  quantity: number;
  required: boolean;
  reason: string;
  notes?: string;
  status: PackingItemStatus;
  actionRequired?: string;
  documentType?: string;
  weight: PackingItemWeight;
  forTravelers?: string[];
}

export interface PackingCategory {
  id: string;
  name: string;
  icon: string;
  priority: PackingItemPriority;
  items: PackingItem[];
}

export interface PackingWarning {
  type: 'weight' | 'document' | 'regulation' | 'health' | 'weather';
  severity: 'info' | 'warning' | 'critical';
  message: string;
  action?: string;
}

export interface PackingListOutput {
  summary: {
    totalItems: number;
    estimatedWeight: 'light' | 'medium' | 'heavy';
    luggageRecommendation: string;
    criticalItemsCount: number;
  };
  categories: PackingCategory[];
  warnings: PackingWarning[];
  tips: string[];
  perTraveler?: Record<string, {
    name: string;
    specificItems: PackingItem[];
  }>;
}

// ============================================
// DO'S & DON'TS MODULE
// ============================================

export type DosDontsSeverity = 'critical' | 'important' | 'helpful' | 'optional';
export type DosDontsCategory = 
  | 'cultural' | 'food' | 'safety' | 'dress' | 'transportation'
  | 'language' | 'photo' | 'religion' | 'tipping' | 'business'
  | 'taboo' | 'lgbtq' | 'alcohol' | 'gesture' | 'greeting'
  | 'shopping' | 'health' | 'emergency';

export interface DosDontsItem {
  type: 'do' | 'dont';
  category: DosDontsCategory;
  title: string;
  description: string;
  severity: DosDontsSeverity;
  appliesTo: string[];
  context: string;
  consequence: string;
  icon: string;
}

export interface DosDontsOutput {
  destinationGuide: {
    destination: string;
    country: string;
    generatedFor: {
      tripType: string;
      composition: string;
      keyConsiderations: string[];
    };
    summary: {
      totalDos: number;
      totalDonts: number;
      criticalCount: number;
      mostImportantTakeaway: string;
    };
  };
  items: DosDontsItem[];
  quickReference: {
    mustDo: string[];
    neverDo: string[];
  };
}

// ============================================
// SAFETY MODULE
// ============================================

export interface SafetyAlert {
  type: 'advisory' | 'warning' | 'emergency';
  title: string;
  description: string;
  source: string;
  issuedAt: string;
  expiresAt?: string;
  actionRequired?: string;
}

export interface EmergencyContact {
  service: string;
  number: string;
  notes?: string;
}

export interface SafetyArea {
  name: string;
  safetyLevel: 'safe' | 'caution' | 'avoid';
  reason: string;
  timeOfDay?: 'day' | 'night' | 'always';
}

export interface ScamWarning {
  name: string;
  description: string;
  whereCommon: string[];
  howToAvoid: string;
  severity: 'low' | 'medium' | 'high';
}

export interface SafetyOutput {
  overallAssessment: {
    score: number;
    level: string;
    summary: string;
  };
  currentAlerts: SafetyAlert[];
  emergencyContacts: EmergencyContact[];
  embassy: {
    name: string;
    address: string;
    phone: string;
    email?: string;
    hours?: string;
  } | null;
  areaGuidance: SafetyArea[];
  scamAwareness: ScamWarning[];
  personalSafetyTips: string[];
  healthPrecautions: string[];
  womenSafety?: string[];
  lgbtqSafety?: string[];
  soloTravelerTips?: string[];
}

// ============================================
// LANGUAGE MODULE
// ============================================

export interface LanguagePhrase {
  english: string;
  local: string;
  transliteration?: string;
  pronunciation?: string;
  context: string;
  audioUrl?: string;
}

export interface LanguageCategory {
  id: string;
  name: string;
  icon: string;
  phrases: LanguagePhrase[];
}

export interface LanguageOutput {
  destination: string;
  primaryLanguage: {
    name: string;
    code: string;
    script: string;
    difficulty: 'easy' | 'moderate' | 'challenging' | 'difficult';
  };
  otherLanguages: string[];
  englishProficiency: 'widespread' | 'common' | 'limited' | 'rare';
  categories: LanguageCategory[];
  culturalNotes: string[];
  translationApps: string[];
  offlineTips: string[];
}

// ============================================
// BUDGET MODULE
// ============================================

export interface BudgetCategory {
  category: string;
  icon: string;
  budgetOption: string;
  midRangeOption: string;
  luxuryOption: string;
  yourEstimate: number;
  currency: string;
}

export interface BudgetOutput {
  destination: string;
  tripDuration: number;
  currency: {
    local: { code: string; symbol: string };
    user: { code: string; symbol: string };
    exchangeRate: number;
  };
  dailyBudgetEstimate: {
    budget: { min: number; max: number };
    midRange: { min: number; max: number };
    luxury: { min: number; max: number };
    yourTier: string;
    yourEstimate: number;
  };
  breakdown: BudgetCategory[];
  totalEstimate: {
    min: number;
    max: number;
    recommended: number;
  };
  savingTips: string[];
  splurgeRecommendations: string[];
  hiddenCosts: string[];
  paymentTips: string[];
}

// ============================================
// CULTURAL INTELLIGENCE MODULE
// ============================================

export interface CulturalInsight {
  topic: string;
  insight: string;
  importance: 'essential' | 'important' | 'helpful';
  icon: string;
}

export interface CulturalOutput {
  destination: string;
  culturalOverview: string;
  keyValues: string[];
  socialNorms: CulturalInsight[];
  businessCulture?: CulturalInsight[];
  religiousContext: {
    dominantReligion: string;
    otherReligions: string[];
    religiousSites: string[];
    observances: string[];
  };
  diningEtiquette: CulturalInsight[];
  giftGiving?: CulturalInsight[];
  taboos: string[];
  localCustoms: CulturalInsight[];
  festivalsDuringTrip: Array<{
    name: string;
    date: string;
    description: string;
    impact: string;
  }>;
}

// ============================================
// ITINERARY SUGGESTIONS MODULE
// ============================================

export interface ItineraryActivity {
  time: string;
  duration: string;
  title: string;
  description: string;
  location: string;
  category: string;
  estimatedCost?: number;
  currency?: string;
  bookingRequired: boolean;
  bookingUrl?: string;
  tips?: string[];
  weatherDependent: boolean;
  alternativeIfBadWeather?: string;
}

export interface ItineraryDay {
  dayNumber: number;
  date: string;
  theme: string;
  weather?: {
    condition: string;
    tempHigh: number;
    tempLow: number;
  };
  activities: ItineraryActivity[];
  meals: {
    breakfast?: { suggestion: string; location?: string };
    lunch?: { suggestion: string; location?: string };
    dinner?: { suggestion: string; location?: string };
  };
  transportationTips: string[];
  dailyBudget: number;
  currency: string;
}

export interface ItineraryOutput {
  tripName: string;
  destination: string;
  duration: number;
  style: string;
  overview: string;
  days: ItineraryDay[];
  mustSeeAttractions: string[];
  hiddenGems: string[];
  totalEstimatedCost: number;
  currency: string;
  packingReminders: string[];
  generalTips: string[];
}

// ============================================
// COMPENSATION MODULE
// ============================================

export interface CompensationEligibility {
  flightNumber: string;
  route: string;
  date: string;
  delayMinutes: number;
  isEligible: boolean;
  regulation: 'EU261' | 'UK261' | 'DOT' | 'Montreal' | 'none';
  estimatedAmount: number;
  currency: string;
  reason: string;
  requirements: string[];
  deadline: string;
  claimProcess: string[];
}

export interface CompensationOutput {
  eligibleFlights: CompensationEligibility[];
  totalPotentialCompensation: number;
  currency: string;
  nextSteps: string[];
  documentsNeeded: string[];
  timelineExpectation: string;
  helpfulLinks: Array<{ title: string; url: string }>;
}

// ============================================
// DOCUMENTS CHECKLIST MODULE
// ============================================

export interface DocumentRequirement {
  document: string;
  required: boolean;
  status: 'valid' | 'expiring_soon' | 'expired' | 'needed' | 'not_applicable';
  notes: string;
  action?: {
    type: 'renew' | 'apply' | 'download' | 'print' | 'check';
    description: string;
    url?: string;
    deadline?: string;
  };
  icon: string;
}

export interface DocumentsOutput {
  destination: string;
  nationality: string;
  travelDates: { start: string; end: string };
  documents: DocumentRequirement[];
  criticalActions: Array<{
    document: string;
    action: string;
    deadline: string;
    priority: 'urgent' | 'soon' | 'before_travel';
  }>;
  printChecklist: string[];
  digitalCopiesRecommended: string[];
  tips: string[];
}

// ============================================
// UNION TYPE FOR ALL OUTPUTS
// ============================================

export type ModuleOutput = 
  | PackingListOutput
  | DosDontsOutput
  | SafetyOutput
  | LanguageOutput
  | BudgetOutput
  | CulturalOutput
  | ItineraryOutput
  | CompensationOutput
  | DocumentsOutput;
