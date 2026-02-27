/**
 * CHECKOUT VALIDATION UTILITIES
 * 
 * Secure input validation for flight checkout.
 * All validation happens client-side before sending to server.
 */

// ============================================
// VALIDATION PATTERNS
// ============================================

const PATTERNS = {
  // Name: letters, spaces, hyphens, apostrophes (international names)
  name: /^[a-zA-ZÀ-ÿ\s'-]{2,50}$/,
  
  // Email: standard email format
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  
  // Phone: international format with optional + and country code
  phone: /^\+?[1-9]\d{6,14}$/,
  
  // Passport: alphanumeric, 6-12 characters
  passport: /^[A-Z0-9]{6,12}$/i,
  
  // Card number: 13-19 digits (after removing spaces)
  cardNumber: /^\d{13,19}$/,
  
  // Expiry: MM/YY format
  expiry: /^(0[1-9]|1[0-2])\/([0-9]{2})$/,
  
  // CVV: 3-4 digits
  cvv: /^\d{3,4}$/,
  
  // Date of birth: YYYY-MM-DD
  dateOfBirth: /^\d{4}-\d{2}-\d{2}$/,
};

// ============================================
// SANITIZATION
// ============================================

/**
 * Sanitize string input - remove potentially dangerous characters
 */
export function sanitizeString(input: string): string {
  if (!input || typeof input !== 'string') return '';
  
  // Remove HTML tags
  let sanitized = input.replace(/<[^>]*>/g, '');
  
  // Remove script injections
  sanitized = sanitized.replace(/javascript:/gi, '');
  sanitized = sanitized.replace(/on\w+=/gi, '');
  
  // Trim whitespace
  sanitized = sanitized.trim();
  
  // Limit length
  return sanitized.substring(0, 500);
}

/**
 * Sanitize name - only allow valid name characters
 */
export function sanitizeName(input: string): string {
  if (!input || typeof input !== 'string') return '';
  
  // Remove anything that's not a letter, space, hyphen, or apostrophe
  return input
    .replace(/[^a-zA-ZÀ-ÿ\s'-]/g, '')
    .trim()
    .substring(0, 50);
}

/**
 * Sanitize phone number - only digits and leading +
 */
export function sanitizePhone(input: string): string {
  if (!input || typeof input !== 'string') return '';
  
  const hasPlus = input.startsWith('+');
  const digits = input.replace(/\D/g, '');
  
  return (hasPlus ? '+' : '') + digits.substring(0, 15);
}

/**
 * Sanitize card number - only digits
 */
export function sanitizeCardNumber(input: string): string {
  if (!input || typeof input !== 'string') return '';
  return input.replace(/\D/g, '').substring(0, 19);
}

/**
 * Format card number with spaces for display
 */
export function formatCardNumber(input: string): string {
  const digits = sanitizeCardNumber(input);
  const groups = digits.match(/.{1,4}/g) || [];
  return groups.join(' ');
}

/**
 * Sanitize CVV - only digits
 */
export function sanitizeCVV(input: string): string {
  if (!input || typeof input !== 'string') return '';
  return input.replace(/\D/g, '').substring(0, 4);
}

/**
 * Format expiry date MM/YY
 */
export function formatExpiry(input: string): string {
  const digits = input.replace(/\D/g, '').substring(0, 4);
  if (digits.length >= 3) {
    return `${digits.substring(0, 2)}/${digits.substring(2)}`;
  }
  return digits;
}

// ============================================
// VALIDATION FUNCTIONS
// ============================================

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validate name field
 */
export function validateName(name: string, fieldName: string = 'Name'): ValidationResult {
  const sanitized = sanitizeName(name);
  
  if (!sanitized) {
    return { valid: false, error: `${fieldName} is required` };
  }
  
  if (sanitized.length < 2) {
    return { valid: false, error: `${fieldName} must be at least 2 characters` };
  }
  
  if (!PATTERNS.name.test(sanitized)) {
    return { valid: false, error: `${fieldName} contains invalid characters` };
  }
  
  return { valid: true };
}

/**
 * Validate email
 */
export function validateEmail(email: string): ValidationResult {
  const sanitized = sanitizeString(email).toLowerCase();
  
  if (!sanitized) {
    return { valid: false, error: 'Email is required' };
  }
  
  if (!PATTERNS.email.test(sanitized)) {
    return { valid: false, error: 'Please enter a valid email address' };
  }
  
  return { valid: true };
}

/**
 * Validate phone number
 */
export function validatePhone(phone: string): ValidationResult {
  const sanitized = sanitizePhone(phone);
  
  if (!sanitized) {
    return { valid: false, error: 'Phone number is required' };
  }
  
  if (!PATTERNS.phone.test(sanitized)) {
    return { valid: false, error: 'Please enter a valid phone number' };
  }
  
  return { valid: true };
}

/**
 * Validate date of birth
 */
export function validateDateOfBirth(
  dob: string,
  travelerType: 'adult' | 'child' | 'infant' = 'adult'
): ValidationResult {
  if (!dob) {
    return { valid: false, error: 'Date of birth is required' };
  }
  
  const date = new Date(dob);
  if (isNaN(date.getTime())) {
    return { valid: false, error: 'Please enter a valid date' };
  }
  
  const today = new Date();
  const age = Math.floor((today.getTime() - date.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
  
  // Future date check
  if (date > today) {
    return { valid: false, error: 'Date of birth cannot be in the future' };
  }
  
  // Age validation based on traveler type
  if (travelerType === 'adult' && age < 18) {
    return { valid: false, error: 'Adult travelers must be 18 or older' };
  }
  
  if (travelerType === 'child' && (age < 2 || age >= 18)) {
    return { valid: false, error: 'Child travelers must be between 2 and 17 years old' };
  }
  
  if (travelerType === 'infant' && age >= 2) {
    return { valid: false, error: 'Infant travelers must be under 2 years old' };
  }
  
  // Maximum age check
  if (age > 120) {
    return { valid: false, error: 'Please enter a valid date of birth' };
  }
  
  return { valid: true };
}

/**
 * Validate passport number
 */
export function validatePassport(passport: string): ValidationResult {
  const sanitized = sanitizeString(passport).toUpperCase();
  
  if (!sanitized) {
    return { valid: false, error: 'Passport number is required' };
  }
  
  if (!PATTERNS.passport.test(sanitized)) {
    return { valid: false, error: 'Please enter a valid passport number (6-12 alphanumeric characters)' };
  }
  
  return { valid: true };
}

/**
 * Validate card number using Luhn algorithm
 */
export function validateCardNumber(cardNumber: string): ValidationResult {
  const digits = sanitizeCardNumber(cardNumber);
  
  if (!digits) {
    return { valid: false, error: 'Card number is required' };
  }
  
  if (!PATTERNS.cardNumber.test(digits)) {
    return { valid: false, error: 'Please enter a valid card number' };
  }
  
  // Luhn algorithm check
  if (!luhnCheck(digits)) {
    return { valid: false, error: 'Please enter a valid card number' };
  }
  
  return { valid: true };
}

/**
 * Luhn algorithm for card number validation
 */
function luhnCheck(cardNumber: string): boolean {
  let sum = 0;
  let isEven = false;
  
  for (let i = cardNumber.length - 1; i >= 0; i--) {
    let digit = parseInt(cardNumber[i], 10);
    
    if (isEven) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }
    
    sum += digit;
    isEven = !isEven;
  }
  
  return sum % 10 === 0;
}

/**
 * Validate card expiry date
 */
export function validateExpiry(expiry: string): ValidationResult {
  if (!expiry) {
    return { valid: false, error: 'Expiry date is required' };
  }
  
  if (!PATTERNS.expiry.test(expiry)) {
    return { valid: false, error: 'Please enter expiry as MM/YY' };
  }
  
  const [month, year] = expiry.split('/').map(Number);
  const now = new Date();
  const currentYear = now.getFullYear() % 100;
  const currentMonth = now.getMonth() + 1;
  
  // Check if card is expired
  if (year < currentYear || (year === currentYear && month < currentMonth)) {
    return { valid: false, error: 'Card has expired' };
  }
  
  // Check if expiry is too far in future (10 years)
  if (year > currentYear + 10) {
    return { valid: false, error: 'Please enter a valid expiry date' };
  }
  
  return { valid: true };
}

/**
 * Validate CVV
 */
export function validateCVV(cvv: string): ValidationResult {
  const sanitized = sanitizeCVV(cvv);
  
  if (!sanitized) {
    return { valid: false, error: 'CVV is required' };
  }
  
  if (!PATTERNS.cvv.test(sanitized)) {
    return { valid: false, error: 'CVV must be 3 or 4 digits' };
  }
  
  return { valid: true };
}

/**
 * Validate cardholder name
 */
export function validateCardholderName(name: string): ValidationResult {
  const sanitized = sanitizeName(name);
  
  if (!sanitized) {
    return { valid: false, error: 'Cardholder name is required' };
  }
  
  if (sanitized.length < 3) {
    return { valid: false, error: 'Please enter the full name on the card' };
  }
  
  return { valid: true };
}

// ============================================
// COMPOSITE VALIDATORS
// ============================================

export interface TravelerData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  gender: 'male' | 'female';
  passport?: string;
  type: 'adult' | 'child' | 'infant';
}

export interface TravelerValidationResult {
  valid: boolean;
  errors: Record<string, string>;
}

/**
 * Validate all traveler fields
 */
export function validateTraveler(
  traveler: TravelerData,
  requirePassport: boolean = false
): TravelerValidationResult {
  const errors: Record<string, string> = {};
  
  const firstNameResult = validateName(traveler.firstName, 'First name');
  if (!firstNameResult.valid) errors.firstName = firstNameResult.error!;
  
  const lastNameResult = validateName(traveler.lastName, 'Last name');
  if (!lastNameResult.valid) errors.lastName = lastNameResult.error!;
  
  const emailResult = validateEmail(traveler.email);
  if (!emailResult.valid) errors.email = emailResult.error!;
  
  const phoneResult = validatePhone(traveler.phone);
  if (!phoneResult.valid) errors.phone = phoneResult.error!;
  
  const dobResult = validateDateOfBirth(traveler.dateOfBirth, traveler.type);
  if (!dobResult.valid) errors.dateOfBirth = dobResult.error!;
  
  if (!traveler.gender) {
    errors.gender = 'Please select gender';
  }
  
  if (requirePassport && traveler.passport) {
    const passportResult = validatePassport(traveler.passport);
    if (!passportResult.valid) errors.passport = passportResult.error!;
  }
  
  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

export interface PaymentData {
  cardNumber: string;
  cardHolder: string;
  expiryDate: string;
  cvv: string;
}

export interface PaymentValidationResult {
  valid: boolean;
  errors: Record<string, string>;
}

/**
 * Validate all payment fields
 */
export function validatePayment(payment: PaymentData): PaymentValidationResult {
  const errors: Record<string, string> = {};
  
  const cardResult = validateCardNumber(payment.cardNumber);
  if (!cardResult.valid) errors.cardNumber = cardResult.error!;
  
  const holderResult = validateCardholderName(payment.cardHolder);
  if (!holderResult.valid) errors.cardHolder = holderResult.error!;
  
  const expiryResult = validateExpiry(payment.expiryDate);
  if (!expiryResult.valid) errors.expiryDate = expiryResult.error!;
  
  const cvvResult = validateCVV(payment.cvv);
  if (!cvvResult.valid) errors.cvv = cvvResult.error!;
  
  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

// ============================================
// CARD TYPE DETECTION
// ============================================

export type CardType = 'visa' | 'mastercard' | 'amex' | 'discover' | 'unknown';

/**
 * Detect card type from number
 */
export function detectCardType(cardNumber: string): CardType {
  const digits = sanitizeCardNumber(cardNumber);
  
  if (!digits) return 'unknown';
  
  // Visa: starts with 4
  if (/^4/.test(digits)) return 'visa';
  
  // Mastercard: starts with 51-55 or 2221-2720
  if (/^5[1-5]/.test(digits) || /^2[2-7]/.test(digits)) return 'mastercard';
  
  // Amex: starts with 34 or 37
  if (/^3[47]/.test(digits)) return 'amex';
  
  // Discover: starts with 6011, 622126-622925, 644-649, 65
  if (/^6(?:011|5|4[4-9]|22)/.test(digits)) return 'discover';
  
  return 'unknown';
}
