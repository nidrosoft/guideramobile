export const SCAN_TICKET_MODELS = {
  openai: 'gpt-5.4-mini',
  gemini: 'gemini-3.5-flash',
  haiku: 'claude-haiku-4-5-20251001',
} as const;

export type ScanTicketProvider = keyof typeof SCAN_TICKET_MODELS;

export const SCAN_TICKET_PROVIDER_ORDER: ScanTicketProvider[] = [
  'openai',
  'haiku',
];

export const SCAN_TICKET_PROVIDER_TIMEOUT_MS = 24_000;
export const SCAN_TICKET_OPENAI_IMAGE_DETAIL = 'high';
export const SCAN_TICKET_OPENAI_TOKEN_PARAM = 'max_completion_tokens';
export const SCAN_TICKET_GEMINI_MEDIA_RESOLUTION = 'MEDIA_RESOLUTION_HIGH';

export function parseScanTicketProvider(value: unknown): ScanTicketProvider | null {
  return typeof value === 'string' && value in SCAN_TICKET_MODELS
    ? (value as ScanTicketProvider)
    : null;
}
