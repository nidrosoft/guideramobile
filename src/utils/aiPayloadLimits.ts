export const AI_IMAGE_PAYLOAD_MAX_BYTES = 15 * 1024 * 1024;
export const AI_AUDIO_PAYLOAD_MAX_BYTES = 12 * 1024 * 1024;

export function estimateBase64Bytes(value: string): number {
  const normalized = String(value || '').replace(/^data:[^,]+,/, '').replace(/\s+/g, '');
  if (!normalized) return 0;
  const padding = normalized.endsWith('==') ? 2 : normalized.endsWith('=') ? 1 : 0;
  return Math.max(0, Math.floor((normalized.length * 3) / 4) - padding);
}

export function assertAiBase64WithinLimit(
  value: string,
  options: { label: string; maxBytes: number }
): void {
  const bytes = estimateBase64Bytes(value);
  if (bytes > options.maxBytes) {
    const maxMb = Math.round((options.maxBytes / (1024 * 1024)) * 10) / 10;
    throw new Error(`${options.label} is too large. Please capture or choose a file under ${maxMb} MB.`);
  }
}
