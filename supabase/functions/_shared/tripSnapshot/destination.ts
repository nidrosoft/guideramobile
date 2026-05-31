/** Parse "Paris, France" or Google Places subtitle into city + country */
export function parseDestinationInput(input: string): { city: string; country: string } {
  const trimmed = input.trim();
  if (!trimmed) return { city: '', country: '' };

  const commaIdx = trimmed.indexOf(',');
  if (commaIdx === -1) {
    return { city: trimmed, country: '' };
  }

  const city = trimmed.slice(0, commaIdx).trim();
  const rest = trimmed.slice(commaIdx + 1).trim();
  // "France" or "Île-de-France, France" → use last segment as country
  const countryParts = rest.split(',').map((s) => s.trim()).filter(Boolean);
  const country = countryParts.length > 0 ? countryParts[countryParts.length - 1] : rest;

  return { city: city || trimmed, country };
}

export function destinationSlug(city: string, country?: string): string {
  const base = city.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  if (!country) return base;
  const c = country.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  return `${base}-${c}`;
}

export function seasonFromDate(startDate: string): string {
  const month = new Date(startDate).getMonth();
  if (month >= 2 && month <= 4) return 'spring';
  if (month >= 5 && month <= 7) return 'summer';
  if (month >= 8 && month <= 10) return 'fall';
  return 'winter';
}
