/**
 * BOOKING CONFIG
 * 
 * Feature flags, constants, and configuration for the booking system.
 */

// ============================================
// FEATURE FLAGS
// ============================================

export const BOOKING_FEATURES = {
  // Booking types enabled
  flights: true,
  hotels: true,
  cars: true,
  experiences: true,
  packages: true,
  
  // Features
  seatSelection: true,
  mealSelection: true,
  baggageSelection: true,
  insurance: true,
  promoCode: true,
  priceAlerts: false,          // Coming soon
  savedSearches: false,        // Coming soon
  multiCurrency: false,        // Coming soon
  
  // Payment methods
  creditCard: true,
  applePay: true,
  googlePay: true,
  paypal: false,               // Coming soon
  
  // Premium features
  prioritySupport: true,
  flexibleBooking: true,
  loyaltyPoints: false,        // Coming soon
};

// ============================================
// BOOKING LIMITS
// ============================================

export const BOOKING_LIMITS = {
  // Passengers
  maxPassengers: 9,
  maxAdults: 9,
  maxChildren: 8,
  maxInfants: 4,               // Usually 1 infant per adult
  
  // Hotels
  maxRooms: 5,
  maxGuestsPerRoom: 4,
  
  // Cars
  minDriverAge: 21,
  maxDriverAge: 75,
  youngDriverAge: 25,          // Under this = young driver fee
  
  // Experiences
  maxParticipants: 20,
  
  // Search
  maxSearchDays: 365,          // How far in advance
  maxTripDuration: 30,         // Max days for a trip
  
  // Session
  bookingTimeout: 15 * 60,     // 15 minutes in seconds
  priceHoldDuration: 20 * 60,  // 20 minutes in seconds
};

// ============================================
// DEFAULT VALUES
// ============================================

export const BOOKING_DEFAULTS = {
  // Passengers
  passengers: {
    adults: 1,
    children: 0,
    infants: 0,
  },
  
  // Hotels
  guests: {
    rooms: 1,
    adults: 2,
    children: 0,
  },
  
  // Flights
  cabinClass: 'economy' as const,
  tripType: 'round-trip' as const,
  directOnly: false,
  flexibleDates: false,
  
  // Cars
  driverAge: 30,
  sameDropoff: true,
  pickupTime: '10:00',
  dropoffTime: '10:00',
  
  // Currency
  currency: 'USD',
  locale: 'en-US',
};

// ============================================
// PRICING
// ============================================

export const PRICING_CONFIG = {
  // Display
  showTaxesIncluded: true,
  showPerPersonPrice: true,
  showOriginalPrice: true,     // For discounts
  
  // Fees
  serviceFeePercentage: 0,     // No service fee for now
  paymentProcessingFee: 0,
  
  // Discounts
  packageDiscount: 0.15,       // 15% off when bundling
  earlyBirdDiscount: 0.10,     // 10% for booking 30+ days ahead
  lastMinuteDiscount: 0.20,    // 20% for last-minute deals
  
  // Rounding
  roundToNearest: 0.01,
};

// ============================================
// DATE/TIME CONFIG
// ============================================

export const DATE_CONFIG = {
  // Formats
  dateFormat: 'MMM d, yyyy',           // Dec 15, 2025
  shortDateFormat: 'MMM d',            // Dec 15
  timeFormat: 'h:mm a',                // 10:30 AM
  dateTimeFormat: 'MMM d, yyyy h:mm a', // Dec 15, 2025 10:30 AM
  
  // Booking windows
  minAdvanceBookingHours: 2,           // At least 2 hours before
  flightMinAdvanceHours: 4,            // Flights need more time
  hotelMinAdvanceHours: 0,             // Same-day hotel booking OK
  carMinAdvanceHours: 1,
  experienceMinAdvanceHours: 2,
  
  // Default times
  defaultCheckInTime: '15:00',
  defaultCheckOutTime: '11:00',
  defaultPickupTime: '10:00',
  defaultDropoffTime: '10:00',
};

// ============================================
// UI CONFIG
// ============================================

export const UI_CONFIG = {
  // Results
  resultsPerPage: 20,
  maxResultsToShow: 100,
  
  // Animations
  animationDuration: 300,
  
  // Skeleton loading
  skeletonCount: 5,
  
  // Images
  thumbnailSize: 100,
  galleryImageSize: 800,
  
  // Maps
  defaultZoom: 13,
  markerClusterThreshold: 20,
};

// ============================================
// VALIDATION RULES
// ============================================

export const VALIDATION_RULES = {
  // Names
  minNameLength: 2,
  maxNameLength: 50,
  
  // Passport
  passportMinLength: 5,
  passportMaxLength: 20,
  passportMinValidityMonths: 6,  // Must be valid for 6+ months
  
  // Phone
  phoneMinLength: 7,
  phoneMaxLength: 15,
  
  // Email
  emailMaxLength: 100,
  
  // Card
  cardNumberLength: 16,
  cvvLength: { min: 3, max: 4 },
  
  // Promo code
  promoCodeMaxLength: 20,
};

// ============================================
// ERROR MESSAGES
// ============================================

export const ERROR_MESSAGES = {
  // Search
  originRequired: 'Please select a departure location',
  destinationRequired: 'Please select a destination',
  departureDateRequired: 'Please select a departure date',
  returnDateRequired: 'Please select a return date',
  checkInRequired: 'Please select a check-in date',
  checkOutRequired: 'Please select a check-out date',
  invalidDateRange: 'Check-out must be after check-in',
  pastDate: 'Date cannot be in the past',
  
  // Travelers
  travelerRequired: 'Please enter traveler details',
  invalidName: 'Please enter a valid name',
  invalidEmail: 'Please enter a valid email',
  invalidPhone: 'Please enter a valid phone number',
  invalidPassport: 'Please enter a valid passport number',
  passportExpiring: 'Passport must be valid for at least 6 months',
  
  // Payment
  cardRequired: 'Please enter card details',
  invalidCard: 'Please enter a valid card number',
  invalidExpiry: 'Please enter a valid expiry date',
  invalidCvv: 'Please enter a valid CVV',
  paymentFailed: 'Payment failed. Please try again.',
  
  // General
  networkError: 'Network error. Please check your connection.',
  serverError: 'Something went wrong. Please try again.',
  sessionExpired: 'Your session has expired. Please start again.',
  priceChanged: 'The price has changed. Please review the new price.',
  soldOut: 'Sorry, this option is no longer available.',
};
