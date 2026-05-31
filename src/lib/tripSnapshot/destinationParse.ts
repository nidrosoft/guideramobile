/** Client-side destination parsing — mirrors edge function logic */

export function parseDestinationInput(input: string): { city: string; country: string; display: string } {
  const trimmed = input.trim();
  if (!trimmed) return { city: '', country: '', display: '' };

  const commaIdx = trimmed.indexOf(',');
  if (commaIdx === -1) {
    return { city: trimmed, country: '', display: trimmed };
  }

  const city = trimmed.slice(0, commaIdx).trim();
  const rest = trimmed.slice(commaIdx + 1).trim();
  const countryParts = rest.split(',').map((s) => s.trim()).filter(Boolean);
  const country = countryParts.length > 0 ? countryParts[countryParts.length - 1] : rest;

  return {
    city: city || trimmed,
    country,
    display: country ? `${city}, ${country}` : city,
  };
}
