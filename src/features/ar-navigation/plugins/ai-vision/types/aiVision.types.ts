/**
 * AI VISION TYPES
 *
 * Type definitions for the AI Vision Translator feature.
 * Covers all 4 modes: Live, Snapshot, Menu Scan, Order Builder.
 */

// ─── Mode Types ───────────────────────────────────────────────
export type VisionMode = 'live' | 'snapshot' | 'menu-scan' | 'order-builder' | 'interpreter';

// ─── Language Types ───────────────────────────────────────────
export interface LanguageOption {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
}

export interface LanguagePreference {
  outputLanguage: string; // user's preferred translation language
  localLanguage: string;  // destination's local language (for TTS orders)
}

// ─── Translation Types ────────────────────────────────────────
export interface TranslationResult {
  originalText: string;
  translatedText: string;
  sourceLanguage: string;
  targetLanguage: string;
  detectedLanguage?: string;
  confidence?: number;
  timestamp: number;
}

export interface OCRResult {
  fullText: string;
  blocks: OCRBlock[];
  sourceLanguage?: string;
}

export interface OCRBlock {
  text: string;
  confidence?: number;
  boundingBox?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

// ─── Live Mode Types ──────────────────────────────────────────
export interface LiveFrameResult {
  translation: string;
  explanation?: string;
  sourceLanguage?: string;
  hasText: boolean;
  timestamp: number;
}

export interface LiveModeState {
  isActive: boolean;
  isProcessing: boolean;
  isMuted: boolean;
  currentResult: LiveFrameResult | null;
  error: string | null;
}

// ─── Menu Types ───────────────────────────────────────────────
export interface MenuItem {
  id: string;
  category: string;
  nameOriginal: string;
  nameTranslated: string;
  description: string;
  price: string;
  dietaryFlags: string[];
  isSelected: boolean;
  quantity: number;
}

export interface MenuCategory {
  name: string;
  items: MenuItem[];
}

export interface MenuScanResult {
  categories: MenuCategory[];
  restaurantName?: string;
  currency?: string;
  totalItems: number;
}

// ─── Order Builder Types ──────────────────────────────────────
export interface OrderItem {
  id: string;
  nameOriginal: string;
  nameTranslated: string;
  price: string;
  quantity: number;
}

export interface GeneratedOrder {
  spokenOrder: string;
  englishTranslation: string;
  localLanguage: string;
  audioUri?: string;
  timestamp: number;
}

export interface OrderBuilderState {
  items: OrderItem[];
  generatedOrder: GeneratedOrder | null;
  isGenerating: boolean;
  isPlaying: boolean;
  isLoadingAudio: boolean;
  error: string | null;
}

// ─── Snapshot Mode Types ──────────────────────────────────────
export interface SnapshotResult {
  imageUri: string;
  ocrResult: OCRResult;
  translation: TranslationResult;
  isMenuDetected: boolean;
  geminiContext?: string;
}

/**
 * Result from the unified Gemini translate-snapshot action.
 * Replaces the separate OCR → Translation chain with a single API call.
 */
export interface SnapshotTranslationResult {
  originalText: string;
  translatedText: string;
  sourceLanguage: string;
  targetLanguage: string;
  isMenu: boolean;
  timestamp: number;
}

// ─── Frame Diff Types ─────────────────────────────────────────
export interface FrameDiffConfig {
  /** Minimum change threshold (0-1) to trigger a new API call */
  changeThreshold: number;
  /** Interval in ms between frame captures */
  captureIntervalMs: number;
  /** Max width for frame comparison (downsample for performance) */
  compareWidth: number;
}

// ─── Cache Types ──────────────────────────────────────────────
export interface CachedTranslation {
  key: string; // hash of source text + target language
  result: TranslationResult;
  expiresAt: number;
}

export interface CachedAudio {
  key: string; // hash of spoken text + language
  audioUri: string;
  expiresAt: number;
}
