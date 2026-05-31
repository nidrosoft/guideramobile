import {
  SCAN_TICKET_MODELS,
  SCAN_TICKET_OPENAI_IMAGE_DETAIL,
  SCAN_TICKET_OPENAI_TOKEN_PARAM,
  SCAN_TICKET_PROVIDER_ORDER,
  SCAN_TICKET_PROVIDER_TIMEOUT_MS,
  parseScanTicketProvider,
} from '../../../supabase/functions/_shared/scanTicketModelConfig';

describe('scan ticket model config', () => {
  it('uses current fast multimodal models as the scan chain', () => {
    expect(SCAN_TICKET_MODELS.openai).toBe('gpt-5.4-mini');
    expect(SCAN_TICKET_MODELS.gemini).toBe('gemini-3.5-flash');
    expect(SCAN_TICKET_MODELS.haiku).toBe('claude-haiku-4-5-20251001');
    expect(SCAN_TICKET_PROVIDER_ORDER).toEqual(['openai', 'haiku']);
  });

  it('uses high image detail for ticket OCR on current OpenAI vision models', () => {
    expect(SCAN_TICKET_OPENAI_IMAGE_DETAIL).toBe('high');
    expect(SCAN_TICKET_OPENAI_TOKEN_PARAM).toBe('max_completion_tokens');
  });

  it('gives each provider enough time to read a ticket but stays bounded', () => {
    expect(SCAN_TICKET_PROVIDER_TIMEOUT_MS).toBeGreaterThanOrEqual(20_000);
    expect(SCAN_TICKET_PROVIDER_TIMEOUT_MS).toBeLessThanOrEqual(30_000);
  });

  it('only accepts known providers for diagnostic overrides', () => {
    expect(parseScanTicketProvider('openai')).toBe('openai');
    expect(parseScanTicketProvider('gemini')).toBe('gemini');
    expect(parseScanTicketProvider('haiku')).toBe('haiku');
    expect(parseScanTicketProvider('perplexity')).toBeNull();
    expect(parseScanTicketProvider(null)).toBeNull();
  });
});
