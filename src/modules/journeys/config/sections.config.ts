/**
 * Per-vertical section ordering & critical flags (spec §6.3).
 * Mirrors ai_section_order / ai_critical_sections in the DB.
 */
import type { SectionType } from '../types';

export const SECTION_CONFIG: Record<
  string,
  { order: SectionType[]; critical: SectionType[]; quickFactFields: string[] }
> = {
  medical: {
    order: ['quick_facts', 'costs', 'process', 'risks', 'aftercare', 'things_to_know', 'top_destinations', 'providers', 'community', 'faq'],
    critical: ['costs', 'process', 'risks', 'aftercare', 'providers'],
    quickFactFields: ['cost_vs_home', 'typical_stay', 'english_in_clinics', 'accreditation'],
  },
  relocation: {
    order: ['quick_facts', 'costs', 'process', 'logistics', 'things_to_know', 'top_destinations', 'risks', 'community', 'faq'],
    critical: ['process', 'logistics', 'costs', 'community'],
    quickFactFields: ['cost_of_living_index', 'visa_difficulty', 'language', 'healthcare_access'],
  },
  nomad: {
    order: ['quick_facts', 'logistics', 'costs', 'things_to_know', 'top_destinations', 'community', 'risks', 'faq'],
    critical: ['quick_facts', 'logistics', 'costs', 'community'],
    quickFactFields: ['nomad_visa', 'internet_speed', 'monthly_cost', 'time_zone'],
  },
  wellness: {
    order: ['quick_facts', 'why_here', 'costs', 'things_to_know', 'top_destinations', 'risks', 'providers', 'community', 'faq'],
    critical: ['costs', 'risks', 'why_here'],
    quickFactFields: ['typical_cost', 'best_season', 'retreat_styles', 'language'],
  },
  retire: {
    order: ['quick_facts', 'costs', 'logistics', 'community', 'process', 'things_to_know', 'risks', 'faq'],
    critical: ['costs', 'logistics', 'community'],
    quickFactFields: ['monthly_couple_cost', 'healthcare_quality', 'visa_type', 'accessibility'],
  },
  fertility: {
    order: ['quick_facts', 'legal', 'costs', 'process', 'things_to_know', 'community', 'risks', 'providers', 'faq'],
    critical: ['legal', 'costs', 'process', 'community'],
    quickFactFields: ['whats_permitted', 'cost_per_cycle', 'success_rate_note', 'english_in_clinics'],
  },
  solo: {
    order: ['quick_facts', 'risks', 'things_to_know', 'community', 'top_destinations', 'costs', 'faq'],
    critical: ['risks', 'things_to_know', 'community'],
    quickFactFields: ['safety_index', 'solo_friendliness', 'language', 'getting_around'],
  },
  _default: {
    order: ['quick_facts', 'why_here', 'things_to_know', 'costs', 'process', 'top_destinations', 'logistics', 'risks', 'community', 'faq'],
    critical: ['why_here', 'things_to_know', 'costs'],
    quickFactFields: ['typical_cost', 'best_season', 'language', 'getting_around'],
  },
};

export function resolveSectionConfig(categorySlug: string) {
  if (['dental', 'hair', 'cosmetic'].includes(categorySlug)) return SECTION_CONFIG.medical;
  return SECTION_CONFIG[categorySlug] ?? SECTION_CONFIG._default;
}
