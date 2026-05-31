import {
  buildCityImageQueries,
  buildCityImageSlug,
  pickBestCityImageCandidate,
} from '../../../supabase/functions/_shared/cityImage';

describe('city image helpers', () => {
  it('builds stable city-country slugs', () => {
    expect(buildCityImageSlug('Rio de Janeiro', 'Brazil')).toBe('rio-de-janeiro-brazil');
    expect(buildCityImageSlug('  Miami  ', 'US')).toBe('miami-us');
  });

  it('builds scenic Google queries for a city', () => {
    expect(buildCityImageQueries('Manila', 'Philippines')).toContain(
      'tourist attractions in Manila, Philippines'
    );
  });

  it('prefers scenic/tourist candidates over businesses', () => {
    const candidate = pickBestCityImageCandidate(
      [
        {
          name: 'Manila Travel Agency',
          formatted_address: 'Manila, Philippines',
          types: ['travel_agency'],
          photos: [{ photo_reference: 'bad' }],
        },
        {
          name: 'Rizal Park',
          formatted_address: 'Manila, Philippines',
          types: ['park', 'tourist_attraction'],
          photos: [{ photo_reference: 'good' }],
        },
      ],
      'Manila',
      'Philippines'
    );

    expect(candidate?.photos?.[0]?.photo_reference).toBe('good');
  });
});
