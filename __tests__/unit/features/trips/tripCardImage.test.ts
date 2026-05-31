import {
  getTripCardCoverImage,
  shouldFetchTripCardCoverImage,
} from '../../../../src/features/trips/utils/tripCardImage';

describe('trip card image helpers', () => {
  it('stops using a stored cover URL after that URL fails', () => {
    expect(
      getTripCardCoverImage({
        storedCoverImage: 'https://maps.googleapis.com/maps/api/place/photo?photo_reference=stale',
        fetchedCoverImage: '',
        failedCoverImageUris: ['https://maps.googleapis.com/maps/api/place/photo?photo_reference=stale'],
      })
    ).toBe('');
  });

  it('uses a freshly fetched cover image after the stored URL fails', () => {
    expect(
      getTripCardCoverImage({
        storedCoverImage: 'https://maps.googleapis.com/maps/api/place/photo?photo_reference=stale',
        fetchedCoverImage: 'https://fresh.example/tokyo.jpg',
        failedCoverImageUris: ['https://maps.googleapis.com/maps/api/place/photo?photo_reference=stale'],
      })
    ).toBe('https://fresh.example/tokyo.jpg');
  });

  it('does not fall back to a previously failed stored URL when a fetched URL also fails', () => {
    expect(
      getTripCardCoverImage({
        storedCoverImage: 'https://maps.googleapis.com/maps/api/place/photo?photo_reference=stale',
        fetchedCoverImage: '',
        failedCoverImageUris: [
          'https://maps.googleapis.com/maps/api/place/photo?photo_reference=stale',
          'https://fresh.example/tokyo.jpg',
        ],
      })
    ).toBe('');
  });

  it('fetches a replacement image when there is no usable stored image', () => {
    expect(
      shouldFetchTripCardCoverImage({
        cityName: 'Sydney',
        activeCoverImageUri: '',
      })
    ).toBe(true);
  });

  it('does not use legacy Unsplash trip cover images', () => {
    expect(
      getTripCardCoverImage({
        storedCoverImage: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828',
        fetchedCoverImage: '',
        failedCoverImageUris: [],
      })
    ).toBe('');
  });
});
