/**
 * LANGUAGE PLUGIN - TYPE DEFINITIONS
 *
 * Language Survival Kit — AI-generated phrase dictionary
 * organized by category for traveler use at destination.
 */

export type PhraseCategory =
  | 'emergency'
  | 'greetings'
  | 'medical'
  | 'transport'
  | 'accommodation'
  | 'food'
  | 'shopping'
  | 'directions'
  | 'social'
  | 'business'
  | 'faith'
  | 'kids'
  | 'pronunciation';

export type PhrasePriority = 'critical' | 'high' | 'medium' | 'useful' | 'nice_to_have';
export type PhraseFormality = 'casual' | 'polite' | 'formal' | 'urgent';
export type EnglishPenetration = 'high' | 'medium' | 'low' | 'very_low';

export interface GenderVariant {
  male: string;
  female: string;
}

export interface LanguagePhrase {
  id: string;
  kitId: string;
  tripId: string;
  category: PhraseCategory;
  subcategory: string;
  english: string;
  native: string;
  romanized: string | null;
  phonetic: string;
  pronunciationNotes: string | null;
  toneMarks: string | null;
  genderVariant: GenderVariant | null;
  contextNote: string | null;
  formality: PhraseFormality;
  priority: PhrasePriority;
  displayOrder: number;
  showNativeInCard: boolean;
  audioPhonetic: string | null;
  isFavorited: boolean;
}

export interface PronunciationSection {
  title: string;
  content: string;
  examples?: Array<{ word: string; meaning: string; tone?: string }>;
  phonetics?: Record<string, string>;
}

export interface LocalGem {
  phrase_english: string;
  meaning: string;
  native: string;
  phonetic: string;
  context: string;
  wow_factor: string;
}

export interface LanguageContext {
  overview: string;
  script_direction: 'ltr' | 'rtl';
  show_native_recommended: boolean;
  show_native_note: string;
  english_penetration_note: string;
  gender_note: string;
  dialect_note: string;
}

export interface EmergencyNumbers {
  police?: string;
  ambulance?: string;
  fire?: string;
  combined?: string;
  tourist_police?: string;
}

export interface LanguageKit {
  id: string;
  tripId: string;
  language: string;
  languageCode: string;
  script: string;
  destination: string;
  destinationCountry: string;
  englishPenetration: EnglishPenetration;
  languageContext: LanguageContext;
  pronunciationGuide: PronunciationSection[];
  localGems: LocalGem[];
  emergencyNumbers: EmergencyNumbers;
  totalPhrases: number;
  criticalPhrasesCount: number;
  generatedBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface CategoryTab {
  id: PhraseCategory;
  label: string;
  icon: string;
  isPinned: boolean;
}

export const CATEGORY_TABS: CategoryTab[] = [
  { id: 'emergency', label: 'Emergency', icon: '🆘', isPinned: true },
  { id: 'greetings', label: 'Greetings', icon: '🤝', isPinned: false },
  { id: 'medical', label: 'Medical', icon: '🏥', isPinned: false },
  { id: 'transport', label: 'Transport', icon: '🚌', isPinned: false },
  { id: 'accommodation', label: 'Hotel', icon: '🏨', isPinned: false },
  { id: 'food', label: 'Food', icon: '🍽️', isPinned: false },
  { id: 'shopping', label: 'Shopping', icon: '🛒', isPinned: false },
  { id: 'directions', label: 'Directions', icon: '📍', isPinned: false },
  { id: 'social', label: 'Social', icon: '💬', isPinned: false },
  { id: 'business', label: 'Business', icon: '💼', isPinned: false },
  { id: 'faith', label: 'Faith', icon: '🛐', isPinned: false },
  { id: 'kids', label: 'Kids', icon: '👶', isPinned: false },
  { id: 'pronunciation', label: 'Sounds', icon: '🔤', isPinned: false },
];
