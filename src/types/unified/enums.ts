/**
 * UNIFIED DATA MODEL - ENUMS
 * 
 * All enumeration types for the unified data model.
 */

// ============================================
// FLIGHT ENUMS
// ============================================

export enum CabinClass {
  ECONOMY = 'economy',
  PREMIUM_ECONOMY = 'premium_economy',
  BUSINESS = 'business',
  FIRST = 'first'
}

export enum TripType {
  ONE_WAY = 'one_way',
  ROUND_TRIP = 'round_trip',
  MULTI_CITY = 'multi_city'
}

// ============================================
// HOTEL ENUMS
// ============================================

export enum PropertyType {
  HOTEL = 'hotel',
  RESORT = 'resort',
  APARTMENT = 'apartment',
  VILLA = 'villa',
  HOSTEL = 'hostel',
  MOTEL = 'motel',
  BED_AND_BREAKFAST = 'bed_and_breakfast',
  GUEST_HOUSE = 'guest_house',
  VACATION_RENTAL = 'vacation_rental',
  BOUTIQUE = 'boutique',
  LODGE = 'lodge',
  CABIN = 'cabin'
}

export enum RoomType {
  STANDARD = 'standard',
  SUPERIOR = 'superior',
  DELUXE = 'deluxe',
  SUITE = 'suite',
  JUNIOR_SUITE = 'junior_suite',
  EXECUTIVE = 'executive',
  FAMILY = 'family',
  STUDIO = 'studio',
  PENTHOUSE = 'penthouse',
  VILLA = 'villa',
  BUNGALOW = 'bungalow'
}

export enum BoardType {
  ROOM_ONLY = 'room_only',
  BREAKFAST = 'breakfast',
  HALF_BOARD = 'half_board',
  FULL_BOARD = 'full_board',
  ALL_INCLUSIVE = 'all_inclusive'
}

// ============================================
// CAR ENUMS
// ============================================

export enum VehicleCategory {
  MINI = 'mini',
  ECONOMY = 'economy',
  COMPACT = 'compact',
  MIDSIZE = 'midsize',
  STANDARD = 'standard',
  FULLSIZE = 'fullsize',
  PREMIUM = 'premium',
  LUXURY = 'luxury',
  SPECIAL = 'special'
}

export enum VehicleType {
  CAR = 'car',
  SUV = 'suv',
  VAN = 'van',
  TRUCK = 'truck',
  CONVERTIBLE = 'convertible',
  WAGON = 'wagon',
  SPORTS = 'sports',
  ELECTRIC = 'electric'
}

export enum FuelPolicyType {
  FULL_TO_FULL = 'full_to_full',
  SAME_TO_SAME = 'same_to_same',
  PREPAID = 'prepaid',
  FULL_TO_EMPTY = 'full_to_empty'
}

export enum InsuranceType {
  CDW = 'cdw',
  THEFT = 'theft',
  LIABILITY = 'liability',
  PERSONAL = 'personal',
  SUPER_CDW = 'super_cdw'
}

// ============================================
// EXPERIENCE ENUMS
// ============================================

export enum ExperienceCategory {
  TOURS = 'tours',
  ACTIVITIES = 'activities',
  ATTRACTIONS = 'attractions',
  DAY_TRIPS = 'day_trips',
  FOOD_AND_DRINK = 'food_and_drink',
  CLASSES = 'classes',
  OUTDOOR = 'outdoor',
  WATER_SPORTS = 'water_sports',
  AIR_ACTIVITIES = 'air_activities',
  WELLNESS = 'wellness',
  NIGHTLIFE = 'nightlife',
  TRANSPORT = 'transport',
  TICKETS = 'tickets'
}

export enum FitnessLevel {
  EASY = 'easy',
  MODERATE = 'moderate',
  CHALLENGING = 'challenging',
  DIFFICULT = 'difficult'
}

// ============================================
// BOOKING ENUMS
// ============================================

export enum BookingStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  TICKETED = 'ticketed',
  CANCELLED = 'cancelled',
  COMPLETED = 'completed',
  FAILED = 'failed',
  REFUNDED = 'refunded',
  PARTIALLY_REFUNDED = 'partially_refunded'
}

export enum PaymentStatus {
  PENDING = 'pending',
  AUTHORIZED = 'authorized',
  CAPTURED = 'captured',
  FAILED = 'failed',
  REFUNDED = 'refunded',
  PARTIALLY_REFUNDED = 'partially_refunded',
  DISPUTED = 'disputed'
}

export enum PaymentType {
  PAY_NOW = 'pay_now',
  PAY_LATER = 'pay_later',
  PAY_AT_PROPERTY = 'pay_at_property',
  DEPOSIT = 'deposit'
}

// ============================================
// COMMON ENUMS
// ============================================

export enum TravelerType {
  ADULT = 'adult',
  CHILD = 'child',
  INFANT = 'infant',
  SENIOR = 'senior'
}

export enum LocationType {
  CITY = 'city',
  AIRPORT = 'airport',
  REGION = 'region',
  POINT_OF_INTEREST = 'point_of_interest'
}

export enum CarLocationType {
  AIRPORT = 'airport',
  CITY = 'city',
  TRAIN_STATION = 'train_station',
  HOTEL = 'hotel'
}

export enum Alliance {
  STAR_ALLIANCE = 'star_alliance',
  ONEWORLD = 'oneworld',
  SKYTEAM = 'skyteam',
  NONE = 'none'
}

export enum RefundType {
  FULL = 'full',
  PARTIAL = 'partial',
  CREDIT = 'credit',
  NONE = 'none'
}

export enum PenaltyType {
  PERCENTAGE = 'percentage',
  NIGHTS = 'nights',
  FIXED = 'fixed'
}

export enum VoucherType {
  MOBILE = 'mobile',
  PRINTED = 'printed',
  BOTH = 'both'
}

export enum DocumentType {
  PASSPORT = 'passport',
  NATIONAL_ID = 'national_id'
}

export enum Gender {
  MALE = 'male',
  FEMALE = 'female',
  OTHER = 'other'
}

export enum SeatPreference {
  WINDOW = 'window',
  AISLE = 'aisle',
  MIDDLE = 'middle',
  NO_PREFERENCE = 'no_preference'
}
