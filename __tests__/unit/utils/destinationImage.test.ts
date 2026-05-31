import {
  buildDestinationImageQueries,
  pickBestPlacePhotoCandidate,
} from '../../../src/utils/destinationImage';

describe('destination image selection', () => {
  it('prioritizes destination-specific landmark queries with country context', () => {
    expect(buildDestinationImageQueries('Antananarivo', 'Madagascar')).toEqual([
      'tourist attractions in Antananarivo, Madagascar',
      'Antananarivo, Madagascar scenic viewpoint',
      'Antananarivo, Madagascar famous landmark',
      'Antananarivo, Madagascar point of interest',
      'Antananarivo, Madagascar city view',
      'Antananarivo, Madagascar',
    ]);
  });

  it('uses Bali-specific scenic searches before broad landmark searches', () => {
    expect(buildDestinationImageQueries('Bali', 'Indonesia').slice(0, 3)).toEqual([
      'Bali, Indonesia beach temple',
      'Bali, Indonesia rice terraces',
      'tourist attractions in Bali, Indonesia',
    ]);
  });

  it('prefers tourist attractions over generic travel agencies', () => {
    const candidate = pickBestPlacePhotoCandidate(
      [
        {
          name: 'Generic Travel Shop',
          formatted_address: 'Antananarivo, Madagascar',
          types: ['travel_agency', 'point_of_interest', 'establishment'],
          photos: [{ photo_reference: 'agency-photo' }],
        },
        {
          name: 'Rova of Antananarivo',
          formatted_address: 'Antananarivo, Madagascar',
          types: ['tourist_attraction', 'point_of_interest', 'establishment'],
          photos: [{ photo_reference: 'landmark-photo' }],
        },
      ],
      { city: 'Antananarivo', country: 'Madagascar' }
    );

    expect(candidate?.photos?.[0]?.photo_reference).toBe('landmark-photo');
  });

  it('rejects candidates whose photo reference already failed', () => {
    const candidate = pickBestPlacePhotoCandidate(
      [
        {
          name: 'Rova of Antananarivo',
          formatted_address: 'Antananarivo, Madagascar',
          types: ['tourist_attraction'],
          photos: [{ photo_reference: 'failed-photo' }],
        },
      ],
      {
        city: 'Antananarivo',
        country: 'Madagascar',
        rejectedPhotoReferences: new Set(['failed-photo']),
      }
    );

    expect(candidate).toBeNull();
  });
});
