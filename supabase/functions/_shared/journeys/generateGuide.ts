// Core guide-generation routine shared by journeys-generate-guide and
// journeys-enrich-batch. Loads context, calls Claude, validates, upserts.
import { callClaudeJSON, JOURNEYS_MODEL } from './claude.ts';
import { extractJSON, validateGuide } from './json.ts';
import { GUIDE_SYSTEM_PROMPT, buildGuideSpec, deriveHeadlineTag, deriveCostBand } from './guidePrompt.ts';

export const GUIDE_PROMPT_VERSION = 3;

export interface GenerateGuideParams {
  categorySlug: string;
  countryCode: string;
  subhubSlug?: string | null;
}

export interface GenerateGuideResult {
  status: 'ok' | 'invalid_category' | 'sensitive_category' | 'invalid_country';
  guide?: any;
  error?: string;
}

export async function runGuideGeneration(
  admin: any,
  params: GenerateGuideParams
): Promise<GenerateGuideResult> {
  const { data: cat } = await admin
    .from('journey_categories').select('*').eq('slug', params.categorySlug).maybeSingle();
  if (!cat) return { status: 'invalid_category' };
  if (cat.is_sensitive) return { status: 'sensitive_category' };

  const { data: country } = await admin
    .from('journey_countries').select('*').eq('code', params.countryCode).maybeSingle();
  if (!country) return { status: 'invalid_country' };

  let subhub: any = null;
  if (params.subhubSlug) {
    const { data } = await admin
      .from('journey_subhubs').select('*')
      .eq('category_id', cat.id).eq('slug', params.subhubSlug).maybeSingle();
    subhub = data;
  }

  const dynamicSpec = buildGuideSpec(cat, subhub);
  const userContent = `COUNTRY: ${country.name} (${country.code}, ${country.continent}). Generate the guide as specified.`;

  let content: any;
  try {
    const raw = await callClaudeJSON({ maxTokens: 4096, system: { staticPrompt: GUIDE_SYSTEM_PROMPT, dynamicSpec }, userContent });
    content = validateGuide(extractJSON(raw));
  } catch (_e) {
    const raw2 = await callClaudeJSON({
      maxTokens: 4096,
      system: { staticPrompt: GUIDE_SYSTEM_PROMPT, dynamicSpec },
      userContent: `${userContent}\n\nRETURN VALID JSON ONLY, matching the schema exactly.`,
    });
    content = validateGuide(extractJSON(raw2));
  }
  if (cat.requires_disclaimer) content.requiresDisclaimer = true;

  const { data: guide, error } = await admin
    .from('journey_guides')
    .upsert(
      {
        category_id: cat.id,
        subhub_id: subhub?.id ?? null,
        country_code: country.code,
        focus: content.hero?.focus ?? subhub?.name ?? null,
        status: 'ai_generated',
        source: 'ai',
        is_published: true,
        hook: content.hero?.hook ?? null,
        fit_tags: content.hero?.fitTags ?? [],
        headline_tag: deriveHeadlineTag(content, subhub?.name),
        cost_band: deriveCostBand(content),
        content,
        model: JOURNEYS_MODEL,
        prompt_version: GUIDE_PROMPT_VERSION,
        confidence: content.confidence ?? null,
        generated_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'cache_key' }
    )
    .select('*, journey_categories(slug), journey_countries(name,flag_emoji), journey_subhubs(slug)')
    .single();

  if (error) return { status: 'ok', error: error.message };
  return { status: 'ok', guide };
}
