import type { NormalizedBooking } from './trip-import-engine.service';

export interface ScannedTripCandidate {
  id: string;
  start_date?: string | null;
  end_date?: string | null;
  destination?: {
    name?: string | null;
    city?: string | null;
    country?: string | null;
  } | null;
  primary_destination_name?: string | null;
  primary_destination_country?: string | null;
  primary_destination_code?: string | null;
  booking_count?: number | null;
  flight_count?: number | null;
  hotel_count?: number | null;
  car_count?: number | null;
  experience_count?: number | null;
  traveler_count?: number | null;
  has_flights?: boolean | null;
  has_hotels?: boolean | null;
  has_cars?: boolean | null;
  has_experiences?: boolean | null;
  title?: string | null;
  airline_name?: string | null;
  cabin_class?: string | null;
  route?: string | null;
  flight_number?: string | null;
  seat_number?: string | null;
}

export type ScannedBookingCategory = 'flight' | 'hotel' | 'car' | 'experience' | 'other';

const MATCH_BUFFER_DAYS = 2;

function normalizeText(value?: string | null): string {
  return (value || '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

export function toDateOnly(value?: string | null): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString().split('T')[0];
}

function addDays(dateOnly: string, days: number): string {
  const date = new Date(`${dateOnly}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().split('T')[0];
}

function compareDateOnly(a: string, b: string): number {
  return a.localeCompare(b);
}

export function getBookingDateRange(booking: NormalizedBooking): { start: string; end: string } | null {
  const start = toDateOnly(booking.startDate);
  const end = toDateOnly((booking as any).returnDate || booking.endDate || booking.startDate);
  if (!start || !end) return null;
  return compareDateOnly(start, end) <= 0 ? { start, end } : { start: end, end: start };
}

export function rangesOverlap(
  left: { start: string; end: string },
  right: { start: string; end: string },
  bufferDays = MATCH_BUFFER_DAYS
): boolean {
  const leftStart = addDays(left.start, -bufferDays);
  const leftEnd = addDays(left.end, bufferDays);
  return compareDateOnly(leftStart, right.end) <= 0 && compareDateOnly(right.start, leftEnd) <= 0;
}

export function getScannedBookingCategory(category?: string | null): ScannedBookingCategory {
  switch ((category || '').toLowerCase()) {
    case 'flight':
      return 'flight';
    case 'hotel':
      return 'hotel';
    case 'car':
    case 'rental_car':
    case 'car_rental':
      return 'car';
    case 'experience':
    case 'activity':
    case 'cruise':
    case 'train':
      return 'experience';
    default:
      return 'other';
  }
}

export function getBookingDestinationKey(booking: NormalizedBooking): string {
  return normalizeText(
    booking.endLocation?.code ||
      booking.endLocation?.city ||
      booking.endLocation?.name ||
      booking.startLocation?.city ||
      booking.startLocation?.name
  );
}

function getBookingDestinationKeys(booking: NormalizedBooking): string[] {
  return [
    booking.endLocation?.code,
    booking.endLocation?.city,
    booking.endLocation?.name,
    booking.startLocation?.code,
    booking.startLocation?.city,
    booking.startLocation?.name,
  ]
    .map(normalizeText)
    .filter(Boolean);
}

function getTripDestinationKey(trip: ScannedTripCandidate): string {
  return normalizeText(
    trip.primary_destination_code ||
      trip.destination?.city ||
      trip.primary_destination_name ||
      trip.destination?.name
  );
}

function getTripDestinationKeys(trip: ScannedTripCandidate): string[] {
  return [
    trip.primary_destination_code,
    trip.destination?.city,
    trip.primary_destination_name,
    trip.destination?.name,
  ]
    .map(normalizeText)
    .filter(Boolean);
}

export function scoreScannedTripMatch(
  booking: NormalizedBooking,
  trip: ScannedTripCandidate
): number {
  const bookingRange = getBookingDateRange(booking);
  const tripStart = toDateOnly(trip.start_date);
  const tripEnd = toDateOnly(trip.end_date || trip.start_date);
  if (!bookingRange || !tripStart || !tripEnd) return 0;

  const tripRange = { start: tripStart, end: tripEnd };
  if (!rangesOverlap(bookingRange, tripRange)) return 0;

  let score = 20;
  const bookingDestinations = getBookingDestinationKeys(booking);
  const tripDestinations = getTripDestinationKeys(trip);
  if (bookingDestinations.some((key) => tripDestinations.includes(key))) score += 60;

  const bookingCountry = normalizeText(booking.endLocation?.country);
  const tripCountry = normalizeText(trip.primary_destination_country || trip.destination?.country);
  if (bookingCountry && tripCountry && bookingCountry === tripCountry) score += 10;

  return score;
}

export function findBestScannedTripMatch<T extends ScannedTripCandidate>(
  booking: NormalizedBooking,
  trips: T[]
): T | null {
  const ranked = trips
    .map((trip) => ({ trip, score: scoreScannedTripMatch(booking, trip) }))
    .filter((entry) => entry.score >= 70)
    .sort((a, b) => b.score - a.score);

  return ranked[0]?.trip || null;
}

export function buildTripUpdateForScannedBooking(
  trip: ScannedTripCandidate,
  booking: NormalizedBooking,
  incrementCounts = true
): Record<string, unknown> {
  const category = getScannedBookingCategory(booking.category);
  const bookingRange = getBookingDateRange(booking);
  const currentStart = toDateOnly(trip.start_date);
  const currentEnd = toDateOnly(trip.end_date || trip.start_date);
  const nextTravelerCount = Math.max(
    Number(trip.traveler_count || 1),
    booking.travelers?.length || 1
  );
  const update: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
    traveler_count: nextTravelerCount,
  };

  if (bookingRange) {
    update.start_date =
      currentStart && compareDateOnly(currentStart, bookingRange.start) <= 0
        ? currentStart
        : bookingRange.start;
    update.end_date =
      currentEnd && compareDateOnly(currentEnd, bookingRange.end) >= 0
        ? currentEnd
        : bookingRange.end;
  }

  if (incrementCounts) {
    update.booking_count = Number(trip.booking_count || 0) + 1;
    if (category === 'flight') {
      update.has_flights = true;
      update.flight_count = Number(trip.flight_count || 0) + 1;
    } else if (category === 'hotel') {
      update.has_hotels = true;
      update.hotel_count = Number(trip.hotel_count || 0) + 1;
    } else if (category === 'car') {
      update.has_cars = true;
      update.car_count = Number(trip.car_count || 0) + 1;
    } else if (category === 'experience') {
      update.has_experiences = true;
      update.experience_count = Number(trip.experience_count || 0) + 1;
    }
  }

  return update;
}
