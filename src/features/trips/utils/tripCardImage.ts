interface TripCardCoverImageInput {
  storedCoverImage?: string | null;
  fetchedCoverImage?: string | null;
  failedCoverImageUris?: string[] | null;
}

interface ShouldFetchTripCardCoverImageInput {
  cityName?: string | null;
  activeCoverImageUri?: string | null;
}

function isLegacyGenericImage(url: string): boolean {
  return url.includes('images.unsplash.com') || url.includes('source.unsplash.com');
}

export function getTripCardCoverImage({
  storedCoverImage,
  fetchedCoverImage,
  failedCoverImageUris,
}: TripCardCoverImageInput): string {
  const failedUris = new Set(failedCoverImageUris || []);
  const normalizedFetched = fetchedCoverImage?.trim() || '';
  if (normalizedFetched && !failedUris.has(normalizedFetched)) return normalizedFetched;

  const normalizedStored = storedCoverImage?.trim() || '';
  if (!normalizedStored) return '';
  if (isLegacyGenericImage(normalizedStored)) return '';
  if (failedUris.has(normalizedStored)) return '';

  return normalizedStored;
}

export function shouldFetchTripCardCoverImage({
  cityName,
  activeCoverImageUri,
}: ShouldFetchTripCardCoverImageInput): boolean {
  return Boolean(cityName?.trim() && !activeCoverImageUri?.trim());
}
