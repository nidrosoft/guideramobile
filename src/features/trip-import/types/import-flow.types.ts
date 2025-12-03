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
  // Email Flow
  | 'email-link'
  | 'email-provider'
  | 'email-input'
  | 'email-connecting'
  | 'email-scanning'
  | 'email-bookings'
  | 'email-success'
  // Link Flow
  | 'link-provider'
  | 'link-auth'
  | 'link-connecting'
  | 'link-fetching'
  | 'link-trips'
  | 'link-success'
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
  hotelName?: string;
  carCompany?: string;
  activityName?: string;
  confirmedBooking?: any;
  destination?: string;
  dates?: {
    start: Date;
    end: Date;
  };
  
  // Scan data (QR/barcode scanning)
  scannedData?: any;
  scannedBooking?: any;
}

export interface ImportFlowProps {
  visible: boolean;
  onClose: () => void;
  onComplete: (tripData: any) => void;
}

export interface StepComponentProps {
  onNext: (data?: Partial<ImportFlowData>, method?: ImportMethod) => void;
  onBack: () => void;
  data: ImportFlowData;
}
