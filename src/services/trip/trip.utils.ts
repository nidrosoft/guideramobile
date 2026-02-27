/**
 * TRIP UTILITIES
 * Helper functions for trip operations
 */

import { Trip, Destination, TripBooking, TripActivity, ItineraryItem } from './trip.types';

/**
 * Generate a URL-friendly slug from text
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

/**
 * Generate a unique share token
 */
export function generateShareToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  for (let i = 0; i < 32; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

/**
 * Generate a unique invite token
 */
export function generateInviteToken(): string {
  return `inv_${generateShareToken()}`;
}

/**
 * Generate trip name from destination and dates
 */
export function generateTripName(destination?: Destination, dates?: { start?: string; end?: string }): string {
  const destName = destination?.name || destination?.country || 'Trip';
  
  if (dates?.start) {
    const startDate = new Date(dates.start);
    const year = startDate.getFullYear();
    const month = startDate.toLocaleString('en-US', { month: 'short' });
    return `${destName} ${month} ${year}`;
  }
  
  return `Trip to ${destName}`;
}

/**
 * Calculate which day(s) a booking falls on within a trip
 */
export function calculateBookingDays(
  trip: Trip,
  bookingStartDate: string,
  bookingEndDate?: string
): { start: number; end: number } {
  const tripStart = new Date(trip.start_date);
  const bookingStart = new Date(bookingStartDate);
  
  const startDay = Math.max(1, Math.ceil((bookingStart.getTime() - tripStart.getTime()) / (1000 * 60 * 60 * 24)) + 1);
  
  if (!bookingEndDate) {
    return { start: startDay, end: startDay };
  }
  
  const bookingEnd = new Date(bookingEndDate);
  const endDay = Math.ceil((bookingEnd.getTime() - tripStart.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  
  return { start: startDay, end: Math.min(endDay, trip.duration_days || endDay) };
}

/**
 * Calculate date from trip start and day number
 */
export function calculateDateFromDay(trip: Trip, dayNumber: number): string {
  const startDate = new Date(trip.start_date);
  startDate.setDate(startDate.getDate() + dayNumber - 1);
  return startDate.toISOString().split('T')[0];
}

/**
 * Calculate days until trip starts
 */
export function daysUntilStart(trip: Trip): number {
  const now = new Date();
  const start = new Date(trip.start_date);
  return Math.ceil((start.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

/**
 * Calculate days until trip ends
 */
export function daysUntilEnd(trip: Trip): number {
  const now = new Date();
  const end = new Date(trip.end_date);
  return Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

/**
 * Get day of week from date
 */
export function getDayOfWeek(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', { weekday: 'long' });
}

/**
 * Format date for display
 */
export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Format time for display
 */
export function formatTime(timeStr: string): string {
  if (!timeStr) return '';
  const [hours, minutes] = timeStr.split(':');
  const hour = parseInt(hours, 10);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${minutes} ${ampm}`;
}

/**
 * Compare times for sorting
 */
export function compareTime(a?: string, b?: string): number {
  if (!a && !b) return 0;
  if (!a) return 1;
  if (!b) return -1;
  return a.localeCompare(b);
}

/**
 * Convert booking to itinerary item
 */
export function bookingToItineraryItem(booking: TripBooking, dayNumber: number): ItineraryItem {
  return {
    id: booking.id,
    type: 'booking',
    category: booking.category,
    title: booking.summary_title || booking.category,
    subtitle: booking.summary_subtitle,
    startTime: booking.summary_datetime?.split('T')[1]?.substring(0, 5),
    confirmationNumber: booking.booking_reference,
    price: booking.summary_price,
    status: booking.summary_status,
  };
}

/**
 * Convert activity to itinerary item
 */
export function activityToItineraryItem(activity: TripActivity): ItineraryItem {
  return {
    id: activity.id,
    type: 'activity',
    category: activity.category,
    title: activity.title,
    subtitle: activity.location_name,
    startTime: activity.start_time || undefined,
    endTime: activity.end_time || undefined,
    duration: activity.duration_minutes,
    location: activity.location_name
      ? {
          name: activity.location_name,
          address: activity.location_address,
          coordinates:
            activity.location_lat && activity.location_lng
              ? { lat: activity.location_lat, lng: activity.location_lng }
              : undefined,
        }
      : undefined,
    confirmationNumber: activity.confirmation_number,
    price: activity.estimated_cost,
    currency: activity.cost_currency,
    status: activity.status,
    icon: activity.icon,
    color: activity.color,
    notes: activity.notes,
    isAllDay: activity.is_all_day,
  };
}

/**
 * Generate booking summary from booking details
 */
export function generateBookingSummary(booking: any): { title: string; subtitle: string } {
  const category = booking.category || booking.type;
  
  switch (category) {
    case 'flight':
      const flight = booking.item_details || booking.details;
      const firstSegment = flight?.slices?.[0]?.segments?.[0];
      const lastSlice = flight?.slices?.[flight.slices?.length - 1];
      const lastSegment = lastSlice?.segments?.[lastSlice.segments?.length - 1];
      
      return {
        title: firstSegment?.marketingCarrier?.name || 'Flight',
        subtitle: `${firstSegment?.origin?.code || ''} → ${lastSegment?.destination?.code || ''}`,
      };
      
    case 'hotel':
      const hotel = booking.item_details || booking.details;
      return {
        title: hotel?.name || 'Hotel',
        subtitle: hotel?.city || hotel?.address?.city || '',
      };
      
    case 'car':
      const car = booking.item_details || booking.details;
      return {
        title: car?.company?.name || 'Car Rental',
        subtitle: car?.category || car?.vehicleType || '',
      };
      
    case 'experience':
      const exp = booking.item_details || booking.details;
      return {
        title: exp?.name || exp?.title || 'Experience',
        subtitle: exp?.provider?.name || exp?.operator || '',
      };
      
    default:
      return {
        title: category || 'Booking',
        subtitle: booking.booking_reference || '',
      };
  }
}

/**
 * Extract destination from booking
 */
export function extractDestinationFromBooking(booking: any): Destination | undefined {
  const category = booking.category || booking.type;
  const details = booking.item_details || booking.details;
  
  switch (category) {
    case 'flight':
      const lastSlice = details?.slices?.[details.slices?.length - 1];
      const lastSegment = lastSlice?.segments?.[lastSlice.segments?.length - 1];
      if (lastSegment?.destination) {
        return {
          code: lastSegment.destination.code || lastSegment.destination.iata,
          name: lastSegment.destination.city || lastSegment.destination.name,
          country: lastSegment.destination.country || '',
        };
      }
      break;
      
    case 'hotel':
      if (details?.city) {
        return {
          code: details.city_code || '',
          name: details.city,
          country: details.country || '',
        };
      }
      break;
      
    case 'experience':
      if (details?.location) {
        return {
          code: '',
          name: details.location.city || details.location.name || '',
          country: details.location.country || '',
        };
      }
      break;
  }
  
  return undefined;
}

/**
 * Extract dates from booking
 */
export function extractDatesFromBooking(booking: any): { start?: string; end?: string } {
  const startDate = booking.start_datetime || booking.startDate;
  const endDate = booking.end_datetime || booking.endDate;
  
  return {
    start: startDate?.split('T')[0],
    end: endDate?.split('T')[0],
  };
}

/**
 * Calculate trip duration in days
 */
export function calculateDuration(startDate: string, endDate: string): number {
  const start = new Date(startDate);
  const end = new Date(endDate);
  return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
}

/**
 * Check if trip is in the past
 */
export function isTripPast(trip: Trip): boolean {
  return daysUntilEnd(trip) < 0;
}

/**
 * Check if trip is ongoing
 */
export function isTripOngoing(trip: Trip): boolean {
  return daysUntilStart(trip) <= 0 && daysUntilEnd(trip) >= 0;
}

/**
 * Check if trip is upcoming
 */
export function isTripUpcoming(trip: Trip): boolean {
  return daysUntilStart(trip) > 0;
}
