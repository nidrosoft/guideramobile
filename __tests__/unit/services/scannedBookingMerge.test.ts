import {
  buildTripUpdateForScannedBooking,
  findBestScannedTripMatch,
  getScannedBookingCategory,
} from '../../../src/services/trip/scannedBookingMerge';

const hotelBooking = {
  externalId: 'scan_hotel',
  provider: 'scan',
  category: 'hotel',
  title: 'Manila Hotel',
  status: 'confirmed',
  startDate: '2026-07-20T15:00:00',
  endDate: '2026-07-24T11:00:00',
  startLocation: { name: 'Manila', code: 'MNL' },
  endLocation: { name: 'Manila', code: 'MNL', country: 'Philippines' },
  travelers: [{ name: 'A' }, { name: 'B' }],
  details: {},
  confidence: 0.9,
  rawData: {},
};

describe('scanned booking trip merge helpers', () => {
  it('matches a hotel scan to an existing flight trip with overlapping dates and destination', () => {
    const match = findBestScannedTripMatch(hotelBooking as any, [
      {
        id: 'manila-trip',
        start_date: '2026-07-19',
        end_date: '2026-07-21',
        primary_destination_name: 'Manila',
        primary_destination_country: 'Philippines',
      },
      {
        id: 'miami-trip',
        start_date: '2026-07-19',
        end_date: '2026-07-21',
        primary_destination_name: 'Miami',
        primary_destination_country: 'United States',
      },
    ]);

    expect(match?.id).toBe('manila-trip');
  });

  it('updates trip counts, traveler count, and end date when merging a hotel booking', () => {
    const update = buildTripUpdateForScannedBooking(
      {
        id: 'manila-trip',
        start_date: '2026-07-19',
        end_date: '2026-07-21',
        booking_count: 1,
        hotel_count: 0,
        traveler_count: 1,
      },
      hotelBooking as any
    );

    expect(update).toMatchObject({
      start_date: '2026-07-19',
      end_date: '2026-07-24',
      booking_count: 2,
      has_hotels: true,
      hotel_count: 1,
      traveler_count: 2,
    });
  });

  it('maps cars and activities to the trip card counters', () => {
    expect(getScannedBookingCategory('car_rental')).toBe('car');
    expect(getScannedBookingCategory('activity')).toBe('experience');
    expect(getScannedBookingCategory('train')).toBe('experience');
  });
});
