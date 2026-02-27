/**
 * DOCUMENT TYPES
 * 
 * Type definitions for document generation and delivery.
 */

// ============================================
// DOCUMENT TYPES
// ============================================

export type DocumentType = 
  | 'eticket' 
  | 'hotel_voucher' 
  | 'car_voucher' 
  | 'experience_voucher' 
  | 'itinerary' 
  | 'receipt'
  | 'cancellation_confirmation'
  | 'refund_confirmation';

export type DocumentFormat = 'pdf' | 'pkpass' | 'html';

export interface BookingDocument {
  id: string;
  type: DocumentType;
  format: DocumentFormat;
  url: string;
  filename: string;
  generatedAt: string;
  expiresAt?: string;
  size?: number;
}

// ============================================
// E-TICKET DATA
// ============================================

export interface ETicketData {
  bookingReference: string;
  pnr: string;
  airlineReference?: string;
  passengers: {
    name: string;
    ticketNumber?: string;
    seatAssignment?: string;
    frequentFlyer?: string;
  }[];
  flights: {
    flightNumber: string;
    airline: string;
    airlineLogo?: string;
    departure: {
      airport: string;
      code: string;
      terminal?: string;
      datetime: string;
    };
    arrival: {
      airport: string;
      code: string;
      terminal?: string;
      datetime: string;
    };
    duration: string;
    cabin: string;
    bookingClass?: string;
    aircraft?: string;
    operatedBy?: string;
  }[];
  baggage?: {
    checkedBags?: number;
    carryOn?: number;
    weight?: string;
  };
  fareRules?: string;
  importantInfo?: string[];
}

// ============================================
// HOTEL VOUCHER DATA
// ============================================

export interface HotelVoucherData {
  bookingReference: string;
  confirmationNumber: string;
  hotelName: string;
  hotelAddress: string;
  hotelPhone?: string;
  hotelEmail?: string;
  starRating?: number;
  checkIn: {
    date: string;
    time: string;
  };
  checkOut: {
    date: string;
    time: string;
  };
  nights: number;
  rooms: {
    roomType: string;
    bedType?: string;
    guests: number;
    amenities?: string[];
  }[];
  guests: {
    name: string;
    isLead: boolean;
  }[];
  totalAmount: number;
  currency: string;
  paymentStatus: string;
  specialRequests?: string;
  cancellationPolicy?: string;
  importantInfo?: string[];
}

// ============================================
// CAR VOUCHER DATA
// ============================================

export interface CarVoucherData {
  bookingReference: string;
  confirmationNumber: string;
  rentalCompany: string;
  rentalCompanyLogo?: string;
  pickup: {
    location: string;
    address: string;
    datetime: string;
    instructions?: string;
  };
  dropoff: {
    location: string;
    address: string;
    datetime: string;
    instructions?: string;
  };
  vehicle: {
    category: string;
    type: string;
    model?: string;
    transmission: string;
    fuelPolicy: string;
    mileage: string;
  };
  driver: {
    name: string;
    licenseRequired: string;
  };
  inclusions: string[];
  totalAmount: number;
  currency: string;
  paymentStatus: string;
  importantInfo?: string[];
}

// ============================================
// EXPERIENCE VOUCHER DATA
// ============================================

export interface ExperienceVoucherData {
  bookingReference: string;
  confirmationNumber: string;
  experienceName: string;
  providerName: string;
  providerPhone?: string;
  providerEmail?: string;
  date: string;
  startTime: string;
  duration: string;
  meetingPoint: {
    address: string;
    instructions?: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };
  participants: {
    name: string;
    type: string;
  }[];
  inclusions: string[];
  exclusions?: string[];
  whatToBring?: string[];
  totalAmount: number;
  currency: string;
  cancellationPolicy?: string;
  importantInfo?: string[];
}

// ============================================
// ITINERARY DATA
// ============================================

export interface ItineraryData {
  bookingReference: string;
  tripName: string;
  travelers: {
    name: string;
    type: string;
  }[];
  contactInfo: {
    name: string;
    email: string;
    phone: string;
  };
  days: ItineraryDay[];
  totalAmount: number;
  currency: string;
  emergencyContacts: {
    name: string;
    phone: string;
  }[];
}

export interface ItineraryDay {
  date: string;
  dayNumber: number;
  location: string;
  items: ItineraryItem[];
}

export interface ItineraryItem {
  time: string;
  type: 'flight' | 'hotel' | 'car' | 'experience' | 'transfer' | 'free_time';
  title: string;
  subtitle?: string;
  details: string[];
  confirmationNumber?: string;
  address?: string;
  duration?: string;
  icon?: string;
}

// ============================================
// RECEIPT DATA
// ============================================

export interface ReceiptData {
  bookingReference: string;
  transactionId: string;
  transactionDate: string;
  customerName: string;
  customerEmail: string;
  billingAddress?: {
    line1: string;
    line2?: string;
    city: string;
    state?: string;
    postalCode: string;
    country: string;
  };
  items: {
    description: string;
    category: string;
    dates?: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }[];
  subtotal: number;
  taxes: number;
  fees: number;
  discount?: number;
  total: number;
  currency: string;
  paymentMethod: {
    type: string;
    last4?: string;
    brand?: string;
  };
  companyInfo: {
    name: string;
    address: string;
    taxId?: string;
    email: string;
    phone: string;
  };
}

// ============================================
// GENERATION REQUEST/RESPONSE
// ============================================

export interface GenerateDocumentRequest {
  bookingId: string;
  documentType: DocumentType;
  format?: DocumentFormat;
  regenerate?: boolean;
}

export interface GenerateDocumentsRequest {
  bookingId: string;
  types?: DocumentType[];
  regenerate?: boolean;
}

export interface DocumentGenerationResult {
  success: boolean;
  documents?: BookingDocument[];
  errors?: {
    type: DocumentType;
    error: string;
  }[];
}

// ============================================
// WALLET PASS DATA
// ============================================

export interface WalletPassData {
  type: 'boardingPass' | 'eventTicket' | 'generic';
  serialNumber: string;
  description: string;
  organizationName: string;
  logoUrl?: string;
  backgroundColor?: string;
  foregroundColor?: string;
  labelColor?: string;
  headerFields?: WalletPassField[];
  primaryFields?: WalletPassField[];
  secondaryFields?: WalletPassField[];
  auxiliaryFields?: WalletPassField[];
  backFields?: WalletPassField[];
  barcode?: {
    message: string;
    format: 'PKBarcodeFormatQR' | 'PKBarcodeFormatPDF417' | 'PKBarcodeFormatAztec';
    messageEncoding: string;
  };
  relevantDate?: string;
  locations?: {
    latitude: number;
    longitude: number;
    relevantText?: string;
  }[];
}

export interface WalletPassField {
  key: string;
  label: string;
  value: string;
  textAlignment?: 'PKTextAlignmentLeft' | 'PKTextAlignmentCenter' | 'PKTextAlignmentRight';
}
