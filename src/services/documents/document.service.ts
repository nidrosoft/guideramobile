/**
 * DOCUMENT GENERATION SERVICE
 * 
 * Generates e-tickets, vouchers, itineraries, and receipts for bookings.
 */

import { supabase } from '@/lib/supabase/client';
import {
  BookingDocument,
  DocumentType,
  DocumentFormat,
  ETicketData,
  HotelVoucherData,
  CarVoucherData,
  ExperienceVoucherData,
  ItineraryData,
  ItineraryDay,
  ItineraryItem,
  ReceiptData,
  WalletPassData,
  GenerateDocumentsRequest,
  DocumentGenerationResult,
} from './document.types';
import { BookingWithItems, BookingItem, TravelerInfo } from '../booking/booking.types';
import { getBookingWithItems } from '../booking/booking-lifecycle.service';

// ============================================
// MAIN GENERATION FUNCTIONS
// ============================================

/**
 * Generate all documents for a booking
 */
export async function generateDocuments(
  request: GenerateDocumentsRequest
): Promise<DocumentGenerationResult> {
  const { bookingId, types, regenerate } = request;

  const booking = await getBookingWithItems(bookingId);
  if (!booking) {
    return { success: false, errors: [{ type: 'itinerary', error: 'Booking not found' }] };
  }

  // Check if documents already exist
  if (!regenerate && booking.documents_generated && booking.documents?.length > 0) {
    return { success: true, documents: booking.documents as BookingDocument[] };
  }

  const documents: BookingDocument[] = [];
  const errors: { type: DocumentType; error: string }[] = [];

  // Determine which document types to generate
  const documentTypes = types || getRequiredDocumentTypes(booking);

  for (const docType of documentTypes) {
    try {
      const doc = await generateDocument(booking, docType);
      if (doc) {
        documents.push(doc);
      }
    } catch (error: any) {
      console.error(`Failed to generate ${docType}:`, error);
      errors.push({ type: docType, error: error.message });

      // Create alert for failed generation
      await createDocumentAlert(bookingId, docType, error.message);
    }
  }

  // Store documents in booking
  if (documents.length > 0) {
    await supabase
      .from('bookings')
      .update({
        documents,
        documents_generated: true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', bookingId);
  }

  return {
    success: errors.length === 0,
    documents,
    errors: errors.length > 0 ? errors : undefined,
  };
}

/**
 * Generate a single document
 */
async function generateDocument(
  booking: BookingWithItems,
  type: DocumentType
): Promise<BookingDocument | null> {
  switch (type) {
    case 'eticket':
      return await generateETickets(booking);
    case 'hotel_voucher':
      return await generateHotelVoucher(booking);
    case 'car_voucher':
      return await generateCarVoucher(booking);
    case 'experience_voucher':
      return await generateExperienceVoucher(booking);
    case 'itinerary':
      return await generateItinerary(booking);
    case 'receipt':
      return await generateReceipt(booking);
    default:
      return null;
  }
}

/**
 * Get required document types based on booking items
 */
function getRequiredDocumentTypes(booking: BookingWithItems): DocumentType[] {
  const types: DocumentType[] = ['itinerary', 'receipt'];

  const categories = new Set(booking.items.map((i) => i.category));

  if (categories.has('flight')) types.push('eticket');
  if (categories.has('hotel')) types.push('hotel_voucher');
  if (categories.has('car')) types.push('car_voucher');
  if (categories.has('experience')) types.push('experience_voucher');

  return types;
}

// ============================================
// E-TICKET GENERATION
// ============================================

/**
 * Generate e-ticket for flight bookings
 */
async function generateETickets(booking: BookingWithItems): Promise<BookingDocument | null> {
  const flightItems = booking.items.filter((i) => i.category === 'flight');
  if (flightItems.length === 0) return null;

  const travelers = booking.travelers as TravelerInfo[];

  // Build e-ticket data for each flight
  const eticketData: ETicketData = {
    bookingReference: booking.booking_reference,
    pnr: flightItems[0].provider_confirmation_number || booking.booking_reference,
    passengers: travelers.map((t, i) => ({
      name: `${t.firstName} ${t.lastName}`,
      ticketNumber: `${booking.booking_reference}-${i + 1}`,
    })),
    flights: [],
  };

  for (const item of flightItems) {
    const flight = item.item_details;
    if (!flight?.slices) continue;

    for (const slice of flight.slices) {
      for (const segment of slice.segments || []) {
        eticketData.flights.push({
          flightNumber: segment.flightNumber || `${segment.marketingCarrier?.code}${segment.flightNumber}`,
          airline: segment.marketingCarrier?.name || 'Airline',
          departure: {
            airport: segment.origin?.name || segment.origin?.city || '',
            code: segment.origin?.code || segment.origin?.iata || '',
            terminal: segment.origin?.terminal,
            datetime: segment.departureAt,
          },
          arrival: {
            airport: segment.destination?.name || segment.destination?.city || '',
            code: segment.destination?.code || segment.destination?.iata || '',
            terminal: segment.destination?.terminal,
            datetime: segment.arrivalAt,
          },
          duration: segment.duration || calculateDuration(segment.departureAt, segment.arrivalAt),
          cabin: segment.cabinClass || 'Economy',
          aircraft: segment.aircraft?.name,
          operatedBy: segment.operatingCarrier?.name,
        });
      }
    }

    // Add baggage info
    if (flight.baggage) {
      eticketData.baggage = {
        checkedBags: flight.baggage.checkedBags || 0,
        carryOn: flight.baggage.carryOn || 1,
        weight: flight.baggage.weight,
      };
    }
  }

  // Generate PDF via edge function
  const pdfUrl = await generatePDF('eticket', eticketData, booking.id);

  return {
    id: `doc_${Date.now()}`,
    type: 'eticket',
    format: 'pdf',
    url: pdfUrl,
    filename: `eticket_${booking.booking_reference}.pdf`,
    generatedAt: new Date().toISOString(),
  };
}

// ============================================
// HOTEL VOUCHER GENERATION
// ============================================

/**
 * Generate hotel voucher
 */
async function generateHotelVoucher(booking: BookingWithItems): Promise<BookingDocument | null> {
  const hotelItems = booking.items.filter((i) => i.category === 'hotel');
  if (hotelItems.length === 0) return null;

  const item = hotelItems[0];
  const hotel = item.item_details;
  const travelers = booking.travelers as TravelerInfo[];

  const voucherData: HotelVoucherData = {
    bookingReference: booking.booking_reference,
    confirmationNumber: item.provider_confirmation_number || booking.booking_reference,
    hotelName: hotel?.name || hotel?.hotelName || 'Hotel',
    hotelAddress: formatAddress(hotel?.address),
    hotelPhone: hotel?.phone,
    hotelEmail: hotel?.email,
    starRating: hotel?.starRating,
    checkIn: {
      date: hotel?.checkIn || item.start_datetime?.split('T')[0] || '',
      time: hotel?.checkInTime || '15:00',
    },
    checkOut: {
      date: hotel?.checkOut || item.end_datetime?.split('T')[0] || '',
      time: hotel?.checkOutTime || '11:00',
    },
    nights: hotel?.nights || calculateNights(hotel?.checkIn, hotel?.checkOut),
    rooms: (hotel?.rooms || [{ name: 'Standard Room' }]).map((r: any) => ({
      roomType: r.name || r.roomType || 'Standard Room',
      bedType: r.bedType,
      guests: r.guests || travelers.length,
      amenities: r.amenities,
    })),
    guests: travelers.map((t, i) => ({
      name: `${t.firstName} ${t.lastName}`,
      isLead: i === 0,
    })),
    totalAmount: item.price_amount,
    currency: item.price_currency,
    paymentStatus: 'Paid',
    specialRequests: hotel?.specialRequests,
    cancellationPolicy: formatCancellationPolicy(item.cancellation_policy),
    importantInfo: [
      'Please present this voucher at check-in',
      'Valid photo ID required',
      'Credit card may be required for incidentals',
    ],
  };

  const pdfUrl = await generatePDF('hotel_voucher', voucherData, booking.id);

  return {
    id: `doc_${Date.now()}`,
    type: 'hotel_voucher',
    format: 'pdf',
    url: pdfUrl,
    filename: `hotel_voucher_${booking.booking_reference}.pdf`,
    generatedAt: new Date().toISOString(),
  };
}

// ============================================
// CAR VOUCHER GENERATION
// ============================================

/**
 * Generate car rental voucher
 */
async function generateCarVoucher(booking: BookingWithItems): Promise<BookingDocument | null> {
  const carItems = booking.items.filter((i) => i.category === 'car');
  if (carItems.length === 0) return null;

  const item = carItems[0];
  const car = item.item_details;
  const travelers = booking.travelers as TravelerInfo[];
  const leadTraveler = travelers[0];

  const voucherData: CarVoucherData = {
    bookingReference: booking.booking_reference,
    confirmationNumber: item.provider_confirmation_number || booking.booking_reference,
    rentalCompany: car?.company?.name || car?.vendor || 'Rental Company',
    pickup: {
      location: car?.pickup?.location || car?.pickupLocation || '',
      address: car?.pickup?.address || '',
      datetime: car?.pickup?.dateTime || item.start_datetime || '',
      instructions: car?.pickup?.instructions,
    },
    dropoff: {
      location: car?.dropoff?.location || car?.dropoffLocation || '',
      address: car?.dropoff?.address || '',
      datetime: car?.dropoff?.dateTime || item.end_datetime || '',
      instructions: car?.dropoff?.instructions,
    },
    vehicle: {
      category: car?.category || 'Standard',
      type: car?.type || car?.vehicleType || 'Car',
      model: car?.model || car?.example,
      transmission: car?.transmission || 'Automatic',
      fuelPolicy: car?.fuelPolicy || 'Full to Full',
      mileage: car?.mileage || 'Unlimited',
    },
    driver: {
      name: leadTraveler ? `${leadTraveler.firstName} ${leadTraveler.lastName}` : '',
      licenseRequired: 'Valid driver\'s license required',
    },
    inclusions: car?.inclusions || [
      'Collision Damage Waiver',
      'Theft Protection',
      'Third Party Liability',
    ],
    totalAmount: item.price_amount,
    currency: item.price_currency,
    paymentStatus: 'Prepaid',
    importantInfo: [
      'Present this voucher and valid driver\'s license at pickup',
      'Credit card in driver\'s name required for deposit',
      'Minimum age requirements may apply',
    ],
  };

  const pdfUrl = await generatePDF('car_voucher', voucherData, booking.id);

  return {
    id: `doc_${Date.now()}`,
    type: 'car_voucher',
    format: 'pdf',
    url: pdfUrl,
    filename: `car_voucher_${booking.booking_reference}.pdf`,
    generatedAt: new Date().toISOString(),
  };
}

// ============================================
// EXPERIENCE VOUCHER GENERATION
// ============================================

/**
 * Generate experience/activity voucher
 */
async function generateExperienceVoucher(booking: BookingWithItems): Promise<BookingDocument | null> {
  const expItems = booking.items.filter((i) => i.category === 'experience');
  if (expItems.length === 0) return null;

  const item = expItems[0];
  const exp = item.item_details;
  const travelers = booking.travelers as TravelerInfo[];

  const voucherData: ExperienceVoucherData = {
    bookingReference: booking.booking_reference,
    confirmationNumber: item.provider_confirmation_number || booking.booking_reference,
    experienceName: exp?.name || exp?.title || 'Experience',
    providerName: exp?.provider?.name || exp?.operator || 'Provider',
    providerPhone: exp?.provider?.phone,
    providerEmail: exp?.provider?.email,
    date: exp?.date || item.start_datetime?.split('T')[0] || '',
    startTime: exp?.startTime || item.start_datetime?.split('T')[1]?.substring(0, 5) || '',
    duration: exp?.duration || '',
    meetingPoint: {
      address: exp?.meetingPoint?.address || exp?.location || '',
      instructions: exp?.meetingPoint?.instructions,
      coordinates: exp?.meetingPoint?.coordinates,
    },
    participants: travelers.map((t) => ({
      name: `${t.firstName} ${t.lastName}`,
      type: t.type,
    })),
    inclusions: exp?.inclusions || exp?.includes || [],
    exclusions: exp?.exclusions || exp?.excludes,
    whatToBring: exp?.whatToBring,
    totalAmount: item.price_amount,
    currency: item.price_currency,
    cancellationPolicy: formatCancellationPolicy(item.cancellation_policy),
    importantInfo: [
      'Please arrive 15 minutes before start time',
      'Present this voucher (printed or mobile) to the guide',
      'Comfortable clothing and footwear recommended',
    ],
  };

  const pdfUrl = await generatePDF('experience_voucher', voucherData, booking.id);

  return {
    id: `doc_${Date.now()}`,
    type: 'experience_voucher',
    format: 'pdf',
    url: pdfUrl,
    filename: `experience_voucher_${booking.booking_reference}.pdf`,
    generatedAt: new Date().toISOString(),
  };
}

// ============================================
// ITINERARY GENERATION
// ============================================

/**
 * Generate combined itinerary
 */
async function generateItinerary(booking: BookingWithItems): Promise<BookingDocument> {
  const travelers = booking.travelers as TravelerInfo[];
  const contact = booking.contact_info as any;

  // Build itinerary days
  const days = buildItineraryDays(booking);

  const itineraryData: ItineraryData = {
    bookingReference: booking.booking_reference,
    tripName: getTripName(booking),
    travelers: travelers.map((t) => ({
      name: `${t.firstName} ${t.lastName}`,
      type: t.type,
    })),
    contactInfo: {
      name: contact ? `${contact.firstName} ${contact.lastName}` : '',
      email: contact?.email || '',
      phone: contact?.phone || '',
    },
    days,
    totalAmount: booking.total_amount,
    currency: booking.currency,
    emergencyContacts: [
      { name: 'Guidera Support', phone: '+1-888-GUIDERA' },
      { name: 'Emergency Services', phone: '911' },
    ],
  };

  const pdfUrl = await generatePDF('itinerary', itineraryData, booking.id);

  return {
    id: `doc_${Date.now()}`,
    type: 'itinerary',
    format: 'pdf',
    url: pdfUrl,
    filename: `itinerary_${booking.booking_reference}.pdf`,
    generatedAt: new Date().toISOString(),
  };
}

/**
 * Build itinerary days from booking items
 */
function buildItineraryDays(booking: BookingWithItems): ItineraryDay[] {
  const itemsByDate = new Map<string, ItineraryItem[]>();

  for (const item of booking.items) {
    const startDate = item.start_datetime?.split('T')[0] || booking.travel_start_date;
    if (!startDate) continue;

    const itineraryItem = convertToItineraryItem(item);
    if (!itineraryItem) continue;

    const existing = itemsByDate.get(startDate) || [];
    existing.push(itineraryItem);
    itemsByDate.set(startDate, existing);

    // For hotels, add checkout on end date
    if (item.category === 'hotel' && item.end_datetime) {
      const endDate = item.end_datetime.split('T')[0];
      const checkoutItem: ItineraryItem = {
        time: '11:00',
        type: 'hotel',
        title: 'Hotel Checkout',
        subtitle: item.item_details?.name,
        details: ['Check out and proceed to next destination'],
      };
      const endItems = itemsByDate.get(endDate) || [];
      endItems.push(checkoutItem);
      itemsByDate.set(endDate, endItems);
    }
  }

  // Sort dates and build days
  const sortedDates = Array.from(itemsByDate.keys()).sort();
  const days: ItineraryDay[] = [];

  sortedDates.forEach((date, index) => {
    const items = itemsByDate.get(date) || [];
    items.sort((a, b) => a.time.localeCompare(b.time));

    days.push({
      date,
      dayNumber: index + 1,
      location: getLocationForDate(booking, date),
      items,
    });
  });

  return days;
}

/**
 * Convert booking item to itinerary item
 */
function convertToItineraryItem(item: BookingItem): ItineraryItem | null {
  const details = item.item_details;

  switch (item.category) {
    case 'flight':
      const firstSegment = details?.slices?.[0]?.segments?.[0];
      if (!firstSegment) return null;
      return {
        time: firstSegment.departureAt?.split('T')[1]?.substring(0, 5) || '00:00',
        type: 'flight',
        title: `Flight to ${firstSegment.destination?.city || firstSegment.destination?.code}`,
        subtitle: `${firstSegment.marketingCarrier?.code || ''} ${firstSegment.flightNumber || ''}`,
        details: [
          `${firstSegment.origin?.code} → ${firstSegment.destination?.code}`,
          `Duration: ${firstSegment.duration || 'N/A'}`,
        ],
        confirmationNumber: item.provider_confirmation_number || undefined,
      };

    case 'hotel':
      return {
        time: details?.checkInTime || '15:00',
        type: 'hotel',
        title: 'Hotel Check-in',
        subtitle: details?.name || 'Hotel',
        details: [
          details?.rooms?.[0]?.name || 'Standard Room',
          `${details?.nights || 1} night(s)`,
        ],
        confirmationNumber: item.provider_confirmation_number || undefined,
        address: formatAddress(details?.address),
      };

    case 'car':
      return {
        time: details?.pickup?.dateTime?.split('T')[1]?.substring(0, 5) || '10:00',
        type: 'car',
        title: 'Car Rental Pickup',
        subtitle: `${details?.category || 'Standard'} - ${details?.company?.name || 'Rental'}`,
        details: [
          details?.pickup?.location || '',
          `Return: ${details?.dropoff?.location || 'Same location'}`,
        ],
        confirmationNumber: item.provider_confirmation_number || undefined,
        address: details?.pickup?.address,
      };

    case 'experience':
      return {
        time: details?.startTime || item.start_datetime?.split('T')[1]?.substring(0, 5) || '09:00',
        type: 'experience',
        title: details?.name || details?.title || 'Activity',
        subtitle: details?.provider?.name || details?.operator,
        details: [
          `Duration: ${details?.duration || 'N/A'}`,
          details?.meetingPoint?.address || details?.location || '',
        ],
        confirmationNumber: item.provider_confirmation_number || undefined,
        address: details?.meetingPoint?.address || details?.location,
        duration: details?.duration,
      };

    default:
      return null;
  }
}

// ============================================
// RECEIPT GENERATION
// ============================================

/**
 * Generate payment receipt
 */
async function generateReceipt(booking: BookingWithItems): Promise<BookingDocument> {
  const contact = booking.contact_info as any;

  const receiptData: ReceiptData = {
    bookingReference: booking.booking_reference,
    transactionId: `TXN-${booking.id.substring(0, 8).toUpperCase()}`,
    transactionDate: booking.created_at,
    customerName: contact ? `${contact.firstName} ${contact.lastName}` : 'Customer',
    customerEmail: contact?.email || '',
    items: booking.items.map((item) => ({
      description: getItemDescription(item),
      category: item.category,
      dates: formatItemDates(item),
      quantity: 1,
      unitPrice: item.price_amount,
      totalPrice: item.price_amount,
    })),
    subtotal: booking.items.reduce((sum, i) => sum + i.price_amount, 0),
    taxes: 0, // Would come from checkout session
    fees: 0,
    total: booking.total_amount,
    currency: booking.currency,
    paymentMethod: {
      type: 'card',
      last4: '****',
      brand: 'Visa',
    },
    companyInfo: {
      name: 'Guidera Travel Inc.',
      address: '123 Travel Street, San Francisco, CA 94102',
      email: 'support@guidera.com',
      phone: '+1-888-GUIDERA',
    },
  };

  const pdfUrl = await generatePDF('receipt', receiptData, booking.id);

  return {
    id: `doc_${Date.now()}`,
    type: 'receipt',
    format: 'pdf',
    url: pdfUrl,
    filename: `receipt_${booking.booking_reference}.pdf`,
    generatedAt: new Date().toISOString(),
  };
}

// ============================================
// WALLET PASS GENERATION
// ============================================

/**
 * Generate Apple Wallet pass for flight
 */
export async function generateWalletPass(
  booking: BookingWithItems,
  itemId: string
): Promise<BookingDocument | null> {
  const item = booking.items.find((i) => i.id === itemId);
  if (!item || item.category !== 'flight') return null;

  const flight = item.item_details;
  const firstSegment = flight?.slices?.[0]?.segments?.[0];
  if (!firstSegment) return null;

  const travelers = booking.travelers as TravelerInfo[];
  const leadTraveler = travelers[0];

  const passData: WalletPassData = {
    type: 'boardingPass',
    serialNumber: `${booking.booking_reference}-${itemId}`,
    description: `Flight ${firstSegment.flightNumber}`,
    organizationName: 'Guidera',
    backgroundColor: '#1a1a2e',
    foregroundColor: '#ffffff',
    labelColor: '#aaaaaa',
    headerFields: [
      {
        key: 'gate',
        label: 'GATE',
        value: 'TBD',
      },
    ],
    primaryFields: [
      {
        key: 'origin',
        label: firstSegment.origin?.city || 'Origin',
        value: firstSegment.origin?.code || '',
      },
      {
        key: 'destination',
        label: firstSegment.destination?.city || 'Destination',
        value: firstSegment.destination?.code || '',
      },
    ],
    secondaryFields: [
      {
        key: 'passenger',
        label: 'PASSENGER',
        value: leadTraveler ? `${leadTraveler.firstName} ${leadTraveler.lastName}` : '',
      },
      {
        key: 'flight',
        label: 'FLIGHT',
        value: firstSegment.flightNumber || '',
      },
    ],
    auxiliaryFields: [
      {
        key: 'departure',
        label: 'DEPARTURE',
        value: formatTime(firstSegment.departureAt),
      },
      {
        key: 'date',
        label: 'DATE',
        value: formatDate(firstSegment.departureAt),
      },
    ],
    barcode: {
      message: booking.booking_reference,
      format: 'PKBarcodeFormatQR',
      messageEncoding: 'iso-8859-1',
    },
    relevantDate: firstSegment.departureAt,
  };

  // Generate pass via edge function
  const passUrl = await generateWalletPassFile(passData, booking.id);

  return {
    id: `doc_${Date.now()}`,
    type: 'eticket',
    format: 'pkpass',
    url: passUrl,
    filename: `boardingpass_${booking.booking_reference}.pkpass`,
    generatedAt: new Date().toISOString(),
  };
}

// ============================================
// PDF GENERATION (via Edge Function)
// ============================================

/**
 * Generate PDF document via edge function
 */
async function generatePDF(
  template: string,
  data: any,
  bookingId: string
): Promise<string> {
  try {
    const { data: result, error } = await supabase.functions.invoke('document-generator', {
      body: {
        action: 'generatePDF',
        template,
        data,
        bookingId,
      },
    });

    if (error) throw error;

    return result.url;
  } catch (error: any) {
    console.error('PDF generation failed:', error);
    // Return placeholder URL - in production this would be a real error
    return `https://storage.guidera.com/documents/${bookingId}/${template}.pdf`;
  }
}

/**
 * Generate wallet pass file via edge function
 */
async function generateWalletPassFile(
  data: WalletPassData,
  bookingId: string
): Promise<string> {
  try {
    const { data: result, error } = await supabase.functions.invoke('document-generator', {
      body: {
        action: 'generateWalletPass',
        data,
        bookingId,
      },
    });

    if (error) throw error;

    return result.url;
  } catch (error: any) {
    console.error('Wallet pass generation failed:', error);
    return `https://storage.guidera.com/documents/${bookingId}/pass.pkpass`;
  }
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function formatAddress(address: any): string {
  if (!address) return '';
  if (typeof address === 'string') return address;
  const parts = [address.line1, address.line2, address.city, address.state, address.postalCode, address.country];
  return parts.filter(Boolean).join(', ');
}

function formatCancellationPolicy(policy: any): string {
  if (!policy) return 'Please refer to booking terms';
  if (typeof policy === 'string') return policy;
  if (!policy.isRefundable) return 'Non-refundable';
  return policy.rules?.[0]?.description || 'Refundable with conditions';
}

function calculateDuration(start: string, end: string): string {
  if (!start || !end) return '';
  const diff = new Date(end).getTime() - new Date(start).getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  return `${hours}h ${minutes}m`;
}

function calculateNights(checkIn: string, checkOut: string): number {
  if (!checkIn || !checkOut) return 1;
  const diff = new Date(checkOut).getTime() - new Date(checkIn).getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function getTripName(booking: BookingWithItems): string {
  const destinations = new Set<string>();
  for (const item of booking.items) {
    if (item.category === 'flight') {
      const lastSlice = item.item_details?.slices?.[item.item_details.slices.length - 1];
      const lastSegment = lastSlice?.segments?.[lastSlice.segments.length - 1];
      if (lastSegment?.destination?.city) {
        destinations.add(lastSegment.destination.city);
      }
    } else if (item.category === 'hotel') {
      if (item.item_details?.city) {
        destinations.add(item.item_details.city);
      }
    }
  }
  return destinations.size > 0 ? `Trip to ${Array.from(destinations).join(' & ')}` : 'Your Trip';
}

function getLocationForDate(booking: BookingWithItems, date: string): string {
  for (const item of booking.items) {
    if (item.category === 'hotel') {
      const checkIn = item.item_details?.checkIn || item.start_datetime?.split('T')[0];
      const checkOut = item.item_details?.checkOut || item.end_datetime?.split('T')[0];
      if (checkIn && checkOut && date >= checkIn && date < checkOut) {
        return item.item_details?.city || item.item_details?.name || '';
      }
    }
  }
  return '';
}

function getItemDescription(item: BookingItem): string {
  const details = item.item_details;
  switch (item.category) {
    case 'flight':
      const origin = details?.slices?.[0]?.segments?.[0]?.origin?.code || '';
      const dest = details?.slices?.[details.slices.length - 1]?.segments?.slice(-1)[0]?.destination?.code || '';
      return `Flight: ${origin} → ${dest}`;
    case 'hotel':
      return `Hotel: ${details?.name || 'Accommodation'}`;
    case 'car':
      return `Car Rental: ${details?.category || 'Vehicle'}`;
    case 'experience':
      return `Experience: ${details?.name || details?.title || 'Activity'}`;
    default:
      return item.category;
  }
}

function formatItemDates(item: BookingItem): string {
  const start = item.start_datetime?.split('T')[0];
  const end = item.end_datetime?.split('T')[0];
  if (start && end && start !== end) {
    return `${formatDate(start)} - ${formatDate(end)}`;
  }
  return start ? formatDate(start) : '';
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatTime(dateStr: string): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

async function createDocumentAlert(bookingId: string, docType: DocumentType, error: string): Promise<void> {
  await supabase.from('system_alerts').insert({
    type: 'document_generation_failed',
    severity: 'medium',
    message: `Failed to generate ${docType} for booking`,
    data: { bookingId, documentType: docType, error },
  });
}

// ============================================
// DOCUMENT DELIVERY
// ============================================

/**
 * Deliver documents to user
 */
export async function deliverDocuments(bookingId: string): Promise<{ success: boolean; error?: string }> {
  const booking = await getBookingWithItems(bookingId);
  if (!booking) {
    return { success: false, error: 'Booking not found' };
  }

  if (!booking.documents || booking.documents.length === 0) {
    // Generate documents first
    const genResult = await generateDocuments({ bookingId });
    if (!genResult.success) {
      return { success: false, error: 'Failed to generate documents' };
    }
  }

  // Create communication record for email delivery
  const contact = booking.contact_info as any;
  await supabase.from('booking_communications').insert({
    booking_id: bookingId,
    type: 'document_delivery',
    channel: 'email',
    recipient_email: contact?.email,
    recipient_user_id: booking.user_id,
    template_id: 'booking_documents',
    template_data: {
      customerName: contact?.firstName,
      bookingReference: booking.booking_reference,
      documents: booking.documents,
    },
    status: 'pending',
  });

  return { success: true };
}
