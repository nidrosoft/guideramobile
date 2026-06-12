/**
 * LOCALIZATION INDEX
 * 
 * Exports all translation files for i18n setup.
 */

import en from './en.json';
import fr from './fr.json';
import es from './es.json';
import de from './de.json';
import it from './it.json';
import pt from './pt.json';

// Guidance System copy lives in dedicated modules and is merged under the
// `guidance` namespace, keeping the large base JSON files untouched.
import guidanceEn from './guidance/en';
import guidanceFr from './guidance/fr';
import guidanceEs from './guidance/es';
import guidanceDe from './guidance/de';
import guidanceIt from './guidance/it';
import guidancePt from './guidance/pt';

export const resources = {
  en: { translation: { ...en, guidance: guidanceEn } },
  fr: { translation: { ...fr, guidance: guidanceFr } },
  es: { translation: { ...es, guidance: guidanceEs } },
  de: { translation: { ...de, guidance: guidanceDe } },
  it: { translation: { ...it, guidance: guidanceIt } },
  pt: { translation: { ...pt, guidance: guidancePt } },
};

export const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇺🇸' },
  { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷' },
  { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸' },
  { code: 'de', name: 'German', nativeName: 'Deutsch', flag: '🇩🇪' },
  { code: 'it', name: 'Italian', nativeName: 'Italiano', flag: '🇮🇹' },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português', flag: '🇧🇷' },
] as const;

export type LanguageCode = typeof SUPPORTED_LANGUAGES[number]['code'];

export default resources;
