/**
 * IMPORT FLOW TYPES
 * 
 * Type definitions for the trip import flow system.
 * Supports multiple import methods with step-based navigation.
 */

export type ImportMethod = 'email' | 'link' | 'manual' | 'scan';

export type ImportStep = 
  // Method Selection
  | 'method-selection'
  // Email Flow (forward-based)
  | 'email-link'
  | 'email-connecting'
  | 'email-bookings'
  | 'email-success'
  // Manual Flow
  | 'manual-type'
  | 'manual-flight'
  | 'manual-hotel'
  | 'manual-car'
  | 'manual-fetching'
  | 'manual-result'
  | 'manual-success'
  // Scan Flow
  | 'scan-camera'
  | 'scan-scanning'
  | 'scan-result'
  | 'scan-success';

export interface ImportFlowState {
  currentStep: ImportStep;
  stepHistory: ImportStep[];
  method: ImportMethod | null;
  data: ImportFlowData;
}

export interface ImportFlowData {
  // Email data
  emailProvider?: 'gmail' | 'outlook' | 'yahoo' | 'other';
  email?: string;
  password?: string;
  selectedBookings?: any[];
  
  // Link data
  linkProvider?: 'expedia' | 'booking' | 'airbnb' | 'tripadvisor';
  linkEmail?: string;
  linkPassword?: string;
  selectedTrips?: any[];
  bookingUrl?: string;
  
  // Manual data
  manualType?: 'flight' | 'hotel' | 'car' | 'activity';
  confirmationCode?: string;
  airline?: string;
  flightNumber?: string;
  fromAirport?: string;
  toAirport?: string;
  cabinClass?: string;
  hotelName?: string;
  hotelCity?: string;
  carCompany?: string;
  pickupLocation?: string;
  activityName?: string;
  activityLocation?: string;
  activityDate?: string;
  confirmedBooking?: any;
  destination?: string;
  dates?: {
    start: Date;
    end: Date;
  };
  
  // Scan data (QR/barcode scanning)
  uploadFromGallery?: boolean;
  scannedData?: any;
  scannedBooking?: any;

  // Import engine data (real API integration)
  scanJobId?: string;
  scanStatus?: string;
  scanProgress?: number;
  scanProgressMessage?: string;
  detectedTrips?: any[];       // NormalizedTrip[] from the engine
  importResult?: any;           // ImportResult from the engine
  connectedAccountId?: string;
  connectedEmail?: string;
  scanError?: string;
}

export interface ImportFlowProps {
  visible: boolean;
  onClose: () => void;
  onComplete: (tripData: any) => void;
  initialMethod?: ImportMethod;
}

export interface StepComponentProps {
  onNext: (data?: Partial<ImportFlowData>, method?: ImportMethod) => void;
  onBack: () => void;
  data: ImportFlowData;
}
