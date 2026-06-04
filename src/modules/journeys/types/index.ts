/**
 * Journeys module — domain types (spec §5/§6).
 */

export type JourneyGroup = 'health' | 'living' | 'purpose';
export type JourneyContinent = 'Europe' | 'Asia' | 'Africa' | 'Americas' | 'Oceania';
export type Monetization = 'affiliate' | 'lead_gen' | 'none';
export type RiskTier = 'low' | 'medium' | 'high';
export type GuideStatus = 'ai_generated' | 'pending_review' | 'curated' | 'archived';

export type SectionType =
  | 'quick_facts'
  | 'things_to_know'
  | 'why_here'
  | 'costs'
  | 'process'
  | 'logistics'
  | 'top_destinations'
  | 'risks'
  | 'aftercare'
  | 'legal'
  | 'providers'
  | 'community'
  | 'faq';

export interface JourneySubhub {
  id: string;
  categoryId: string;
  slug: string;
  name: string;
  icon: string;
  tint: string;
  blurb?: string;
  stat?: string;
}

export interface JourneyCategory {
  id: string;
  slug: string;
  name: string;
  subtitle?: string;
  group: JourneyGroup;
  icon: string;
  tint: string;
  isPopular: boolean;
  hasSubhubs: boolean;
  sortOrder: number;
  monetizationModel: Monetization;
  riskTier: RiskTier;
  isSensitive: boolean;
  requiresDisclaimer: boolean;
  subhubs?: JourneySubhub[];
}

export interface JourneyCountry {
  code: string;
  name: string;
  continent: JourneyContinent;
  flagEmoji: string;
}

export interface GuideStub {
  guideId?: string;
  categorySlug: string;
  countryCode: string;
  countryName: string;
  continent: JourneyContinent;
  flagEmoji: string;
  subhubSlugs?: string[];
  status: GuideStatus | 'none';
  isCurated: boolean;
  hook?: string;
  headlineTag?: string;
  fitTags?: string[];
  rating?: number;
  costBand?: string;
}

// Full guide content (the JSONB) — §6.2
export interface GuideQuickFact {
  icon: string;
  label: string;
  value: string;
}

export type GuideSection =
  | { type: 'things_to_know'; title: string; items: string[]; universal?: true }
  | { type: 'why_here'; title: string; body: string }
  | { type: 'costs'; title: string; universal?: true; rows: Array<{ item: string; abroad: string; home: string }>; note?: string }
  | { type: 'process'; title: string; steps: string[] }
  | { type: 'logistics'; title: string; items: string[] }
  | { type: 'top_destinations'; title: string; places: Array<{ name: string; note: string; destinationRef?: string }> }
  | { type: 'risks'; title: string; items: string[] }
  | { type: 'aftercare'; title: string; items: string[]; isNew?: true }
  | { type: 'legal'; title: string; items: string[] }
  | { type: 'faq'; title: string; faqs: Array<{ q: string; a: string }> };

export interface GuideContent {
  hero: { hook: string; fitTags: string[]; focus?: string };
  quickFacts: GuideQuickFact[];
  sections: GuideSection[];
  faqs: Array<{ q: string; a: string }>;
  sources?: Array<{ label: string; note?: string }>;
  confidence: number;
  requiresDisclaimer: boolean;
  generatedNote?: string | null;
}

export interface JourneyGuide {
  id: string;
  categorySlug: string;
  countryCode: string;
  countryName: string;
  flagEmoji: string;
  subhubSlug?: string;
  focus?: string;
  status: GuideStatus;
  isCurated: boolean;
  confidence?: number;
  rating?: number;
  costBand?: string;
  requiresDisclaimer: boolean;
  content: GuideContent;
}

export interface JourneyFilter {
  categorySlug: string;
  continent: JourneyContinent | 'All';
  subhubSlug: string | 'all';
}

export type ProviderTier = 'standard' | 'verified' | 'featured';

export interface JourneyProvider {
  id: string;
  name: string;
  providerType?: string;
  summary?: string;
  website?: string;
  contact?: Record<string, any>;
  accreditations: string[];
  isVerified: boolean;
  verificationNotes?: string;
  tier: ProviderTier;
  qualityScore?: number;
  monetization: Monetization;
}

export interface ChecklistItem {
  key: string;
  label: string;
  phase?: 'before' | 'during' | 'after' | string;
  info?: string;
}

export interface JourneyChecklist {
  items: ChecklistItem[];
  checked: Record<string, boolean>;
}

export interface JourneyGroupLink {
  groupId: string;
  memberCount: number;
}

export interface CountryProfileMatch {
  categorySlug: string;
  relevance: number;
  headline: string;
  why: string;
}

export interface CountryProfile {
  countryCode: string;
  countryName?: string;
  overview: string;
  knownFor: string[];
  matched: CountryProfileMatch[];
  primaryJourney?: string | null;
  confidence?: number;
}
