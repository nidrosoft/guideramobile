/**
 * Known-destination map per journey (spec §19.4). Gives each journey hub a
 * populated set of country stubs even before full guides exist (status 'none'
 * → generate-on-demand in Phase 2). Country codes match journey_countries.
 */
export const KNOWN_DESTINATIONS: Record<string, string[]> = {
  medical: ['TR', 'MX', 'HU', 'TH', 'KR', 'BR'],
  relocation: ['PT', 'ES', 'AE', 'MX', 'ZA'],
  nomad: ['PT', 'ES', 'TH', 'ID', 'MX', 'CO'],
  wellness: ['ID', 'TH', 'IN', 'CR', 'PT'],
  retire: ['PT', 'PA', 'CR', 'ES', 'MX'],
  fertility: ['ES', 'CZ', 'GR', 'TH', 'MX'],
  solo: ['JP', 'IS', 'NZ', 'CR', 'PT'],
  study: ['GB', 'US', 'CA', 'DE', 'AU'],
  pilgrimage: ['SA', 'ES', 'IT', 'IN'],
  adventure: ['NP', 'NZ', 'CR', 'CL'],
  heritage: ['IE', 'IT', 'GH', 'IN'],
  longevity: ['US', 'CH', 'DE', 'MX'],
  cbi: ['KN', 'PT', 'MT', 'VU'],
  worldschool: ['PT', 'MX', 'TH', 'ES'],
  volunteer: ['KE', 'PE', 'TH', 'ZA'],
  family: ['IT', 'US', 'CR', 'JP'],
};
