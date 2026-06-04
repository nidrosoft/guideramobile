// Safe JSON extraction + validation for the Journeys module (spec §9.1).
// Hand-rolled validators (no external zod dep) that also strip the
// client-injected provider/community section types the model must not emit.

const ALLOWED_SECTION_TYPES = new Set([
  'things_to_know', 'why_here', 'costs', 'process', 'logistics',
  'top_destinations', 'risks', 'aftercare', 'legal', 'faq',
]);

export function extractJSON(raw: string): any {
  if (!raw) throw new Error('empty model output');
  let text = raw.trim();
  // strip markdown fences
  text = text.replace(/^```(?:json)?/i, '').replace(/```$/i, '').trim();
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start === -1 || end === -1 || end < start) throw new Error('no JSON object found');
  return JSON.parse(text.slice(start, end + 1));
}

function asString(v: any, fallback = ''): string {
  return typeof v === 'string' ? v : fallback;
}
function asStringArray(v: any): string[] {
  return Array.isArray(v) ? v.filter((x) => typeof x === 'string') : [];
}
function clamp01(v: any): number {
  const n = typeof v === 'number' ? v : parseFloat(v);
  if (!isFinite(n)) return 0.7;
  return Math.max(0, Math.min(1, n));
}

export function validateGuide(obj: any): any {
  if (!obj || typeof obj !== 'object') throw new Error('guide: not an object');
  const hero = obj.hero ?? {};
  const sectionsIn = Array.isArray(obj.sections) ? obj.sections : [];
  const sections = sectionsIn
    .filter((s: any) => s && ALLOWED_SECTION_TYPES.has(s.type))
    .map((s: any) => {
      switch (s.type) {
        case 'why_here':
          return { type: 'why_here', title: asString(s.title, 'Why here'), body: asString(s.body) };
        case 'costs':
          return {
            type: 'costs', title: asString(s.title, 'Costs'), universal: true,
            rows: (Array.isArray(s.rows) ? s.rows : []).map((r: any) => ({
              item: asString(r.item), abroad: asString(r.abroad), home: asString(r.home),
            })),
            note: s.note ? asString(s.note) : undefined,
          };
        case 'process':
          return { type: 'process', title: asString(s.title, 'The process'), steps: asStringArray(s.steps) };
        case 'top_destinations':
          return {
            type: 'top_destinations', title: asString(s.title, 'Top destinations'),
            places: (Array.isArray(s.places) ? s.places : []).map((p: any) => ({
              name: asString(p.name), note: asString(p.note),
            })),
          };
        case 'aftercare':
          return { type: 'aftercare', title: asString(s.title, 'Aftercare'), items: asStringArray(s.items), isNew: true };
        case 'faq':
          return {
            type: 'faq', title: asString(s.title, 'FAQ'),
            faqs: (Array.isArray(s.faqs) ? s.faqs : []).map((f: any) => ({ q: asString(f.q), a: asString(f.a) })),
          };
        default:
          // things_to_know / logistics / risks / legal — bullet lists
          return { type: s.type, title: asString(s.title, s.type), items: asStringArray(s.items), universal: s.type === 'things_to_know' ? true : undefined };
      }
    });

  if (sections.length === 0) throw new Error('guide: no valid sections');

  return {
    hero: {
      hook: asString(hero.hook),
      fitTags: asStringArray(hero.fitTags),
      focus: hero.focus ? asString(hero.focus) : undefined,
    },
    quickFacts: (Array.isArray(obj.quickFacts) ? obj.quickFacts : []).map((q: any) => ({
      icon: asString(q.icon, 'badge-check'), label: asString(q.label), value: asString(q.value),
    })),
    sections,
    faqs: (Array.isArray(obj.faqs) ? obj.faqs : []).map((f: any) => ({ q: asString(f.q), a: asString(f.a) })),
    sources: Array.isArray(obj.sources)
      ? obj.sources.map((s: any) => ({ label: asString(s.label), note: s.note ? asString(s.note) : undefined }))
      : [],
    confidence: clamp01(obj.confidence),
    requiresDisclaimer: !!obj.requiresDisclaimer,
    generatedNote: obj.generatedNote ? asString(obj.generatedNote) : 'AI-generated — verify details.',
  };
}

const JOURNEY_SLUGS = new Set([
  'medical', 'relocation', 'nomad', 'wellness', 'retire', 'fertility', 'solo', 'study',
  'pilgrimage', 'adventure', 'heritage', 'longevity', 'cbi', 'worldschool', 'volunteer', 'family',
]);

const SUBHUB_SLUGS = new Set(['hair', 'dental', 'cosmetic']);

export function validateIntent(obj: any): {
  categorySlug: string | null;
  subhubSlug: string | null;
  countryCode: string | null;
  note: string;
  confidence: number;
} {
  if (!obj || typeof obj !== 'object') throw new Error('intent: not an object');
  const categorySlug = JOURNEY_SLUGS.has(obj.categorySlug) ? obj.categorySlug : null;
  const subhubSlug =
    categorySlug === 'medical' && SUBHUB_SLUGS.has(obj.subhubSlug) ? obj.subhubSlug : null;
  const cc = asString(obj.countryCode).toUpperCase().slice(0, 2);
  const countryCode = /^[A-Z]{2}$/.test(cc) ? cc : null;
  return {
    categorySlug,
    subhubSlug,
    countryCode,
    note: asString(obj.note),
    confidence: clamp01(obj.confidence),
  };
}

export function validateSearch(obj: any): any {
  if (!obj || typeof obj !== 'object') throw new Error('search: not an object');
  const matched = (Array.isArray(obj.matched) ? obj.matched : [])
    .filter((m: any) => m && JOURNEY_SLUGS.has(m.categorySlug))
    .map((m: any) => ({
      categorySlug: m.categorySlug,
      relevance: clamp01(m.relevance),
      headline: asString(m.headline),
      why: asString(m.why),
    }))
    .sort((a: any, b: any) => b.relevance - a.relevance);

  return {
    countryCode: asString(obj.countryCode).toUpperCase().slice(0, 2),
    overview: asString(obj.overview),
    knownFor: asStringArray(obj.knownFor),
    matched,
    primaryJourney: obj.primaryJourney && JOURNEY_SLUGS.has(obj.primaryJourney) ? obj.primaryJourney : (matched[0]?.categorySlug ?? null),
    confidence: clamp01(obj.confidence),
  };
}
