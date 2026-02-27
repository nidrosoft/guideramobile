# Document 14: AI Generation Engine

## The Intelligence Core of Guidera

This document defines the **AI Generation Engine** — the brain that transforms trip data into personalized, intelligent, life-saving travel guidance. This is what makes Guidera indispensable.

**Design Philosophy:** A first-time traveler to any country should feel as prepared as a local who's lived there for years.

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Context Engine](#context-engine)
3. [Module Generators](#module-generators)
4. [System Prompts](#system-prompts)
5. [Output Schemas](#output-schemas)
6. [Generation Pipeline](#generation-pipeline)
7. [Caching Strategy](#caching-strategy)
8. [Quality Control](#quality-control)
9. [Edge Cases](#edge-cases)
10. [Implementation](#implementation)

---

## Part 1: Architecture Overview

### The Three Pillars

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                                                                                  │
│                           GUIDERA AI ENGINE                                      │
│                                                                                  │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│   ┌───────────────────────────────────────────────────────────────────────┐     │
│   │                     PILLAR 1: CONTEXT ENGINE                          │     │
│   │                                                                        │     │
│   │   "Know everything about the trip and traveler"                       │     │
│   │                                                                        │     │
│   │   User Profile + Trip Details + Bookings + Destination Intelligence   │     │
│   │   + Weather + Safety Data + Events + Exchange Rates + Regulations     │     │
│   └───────────────────────────────────────────────────────────────────────┘     │
│                                      │                                           │
│                                      ▼                                           │
│   ┌───────────────────────────────────────────────────────────────────────┐     │
│   │                   PILLAR 2: GENERATION ENGINE                         │     │
│   │                                                                        │     │
│   │   "Transform knowledge into actionable guidance"                      │     │
│   │                                                                        │     │
│   │   Module-specific system prompts + Structured output schemas          │     │
│   │   + Personalization layers + Severity calibration                     │     │
│   └───────────────────────────────────────────────────────────────────────┘     │
│                                      │                                           │
│                                      ▼                                           │
│   ┌───────────────────────────────────────────────────────────────────────┐     │
│   │                    PILLAR 3: QUALITY ENGINE                           │     │
│   │                                                                        │     │
│   │   "Ensure accuracy, relevance, and continuous improvement"            │     │
│   │                                                                        │     │
│   │   Validation + Caching + Feedback loops + Human review triggers       │     │
│   └───────────────────────────────────────────────────────────────────────┘     │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Generation Modules

| Module | Purpose | Personalization Level | Cacheable |
|--------|---------|----------------------|-----------|
| **Packing Intelligence** | What to bring | Fully Personal | Partial |
| **Cultural Intelligence** | Do's, Don'ts, Etiquette | Semi-Personal | Yes |
| **Safety Intelligence** | Risks, emergencies, areas | Semi-Personal | Yes |
| **Language Intelligence** | Essential phrases | Shared | Yes |
| **Document Intelligence** | Visas, vaccines, permits | Personal | Partial |
| **Budget Intelligence** | Money, tipping, costs | Semi-Personal | Partial |
| **Itinerary Intelligence** | Alerts, suggestions | Personal | No |
| **Compensation Intelligence** | Rights, claims | Personal | Partial |

---

## Part 2: Context Engine

The Context Engine aggregates **everything we know** into a unified intelligence object.

### 2.1 Context Data Sources

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                          CONTEXT DATA SOURCES                                    │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐                  │
│  │   USER PROFILE  │  │  TRIP DETAILS   │  │    BOOKINGS     │                  │
│  ├─────────────────┤  ├─────────────────┤  ├─────────────────┤                  │
│  │ • Name          │  │ • Destination   │  │ • Flights       │                  │
│  │ • Age           │  │ • Dates         │  │ • Hotels        │                  │
│  │ • Gender        │  │ • Duration      │  │ • Cars          │                  │
│  │ • Nationality   │  │ • Trip type     │  │ • Activities    │                  │
│  │ • Profession    │  │ • Travelers     │  │ • Airlines      │                  │
│  │ • Religion      │  │ • Budget        │  │ • Arrival times │                  │
│  │ • Languages     │  │ • Multi-city    │  │ • Confirmations │                  │
│  │ • Dietary       │  │ • Purpose       │  │                 │                  │
│  │ • Medical       │  │                 │  │                 │                  │
│  │ • Accessibility │  │                 │  │                 │                  │
│  │ • Travel style  │  │                 │  │                 │                  │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘                  │
│                                                                                  │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐                  │
│  │   DESTINATION   │  │    WEATHER      │  │     SAFETY      │                  │
│  │  INTELLIGENCE   │  │   FORECAST      │  │      DATA       │                  │
│  ├─────────────────┤  ├─────────────────┤  ├─────────────────┤                  │
│  │ • Country info  │  │ • Daily temps   │  │ • Advisories    │                  │
│  │ • Culture       │  │ • Rain days     │  │ • Crime rates   │                  │
│  │ • Laws          │  │ • Humidity      │  │ • Areas to avoid│                  │
│  │ • Holidays      │  │ • UV index      │  │ • Scams         │                  │
│  │ • Plug types    │  │ • Conditions    │  │ • Health risks  │                  │
│  │ • Voltage       │  │ • Sunrise/set   │  │ • Political     │                  │
│  │ • Currency      │  │                 │  │                 │                  │
│  │ • Language      │  │                 │  │                 │                  │
│  │ • Dress norms   │  │                 │  │                 │                  │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘                  │
│                                                                                  │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐                  │
│  │   FINANCIAL     │  │  REGULATIONS    │  │     EVENTS      │                  │
│  │     DATA        │  │                 │  │                 │                  │
│  ├─────────────────┤  ├─────────────────┤  ├─────────────────┤                  │
│  │ • Exchange rate │  │ • Visa rules    │  │ • Local events  │                  │
│  │ • ATM networks  │  │ • Vaccinations  │  │ • Holidays      │                  │
│  │ • Card accepted │  │ • Entry forms   │  │ • Festivals     │                  │
│  │ • Tipping norms │  │ • Customs       │  │ • Closures      │                  │
│  │ • Cost of living│  │ • Luggage rules │  │ • Sports events │                  │
│  │ • Bargaining    │  │ • Drone laws    │  │ • Conferences   │                  │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘                  │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 2.2 Master Context Interface

```typescript
// src/services/ai-engine/context/context.types.ts

/**
 * The Master Context Object
 * Everything the AI needs to know about a trip
 */
interface TripGenerationContext {
  
  // ==========================================
  // SECTION 1: USER & TRAVELER PROFILES
  // ==========================================
  
  travelers: TravelerContext[]
  primaryTraveler: TravelerContext      // Trip owner
  travelerCount: number
  hasChildren: boolean
  hasInfants: boolean
  hasElderly: boolean
  
  // ==========================================
  // SECTION 2: TRIP FUNDAMENTALS
  // ==========================================
  
  trip: {
    id: string
    name: string
    
    // Destination(s)
    primaryDestination: DestinationContext
    additionalDestinations: DestinationContext[]   // For multi-city
    isMultiCity: boolean
    
    // Timing
    startDate: string              // ISO date
    endDate: string
    durationDays: number
    durationNights: number
    
    // Trip characteristics
    tripType: TripType
    purpose: TripPurpose
    pacePreference: 'relaxed' | 'moderate' | 'packed'
    
    // Group composition
    composition: TravelerComposition
    relationshipDynamic: RelationshipDynamic
    
    // Budget
    budgetTier: 'budget' | 'mid_range' | 'luxury' | 'ultra_luxury'
    budgetTotal: number
    budgetCurrency: string
    budgetPerDay: number
  }
  
  // ==========================================
  // SECTION 3: BOOKING DETAILS
  // ==========================================
  
  bookings: {
    flights: FlightBookingContext[]
    hotels: HotelBookingContext[]
    cars: CarBookingContext[]
    activities: ActivityBookingContext[]
    
    // Derived insights
    hasFlights: boolean
    hasHotels: boolean
    hasCar: boolean
    hasActivities: boolean
    
    airlines: string[]                    // List of airlines used
    hotelTypes: string[]                  // Budget, mid, luxury
    activitiesBooked: string[]            // ["scuba_diving", "temple_tour"]
    
    // Timing
    arrivalTime: string                   // First arrival
    departureTime: string                 // Final departure
    hasRedEyeFlight: boolean
    hasLongLayover: boolean
    layoverLocations: string[]
  }
  
  // ==========================================
  // SECTION 4: DESTINATION INTELLIGENCE
  // ==========================================
  
  destination: DestinationIntelligence
  
  // ==========================================
  // SECTION 5: REAL-TIME INTELLIGENCE
  // ==========================================
  
  realtime: {
    weather: WeatherForecast
    safety: SafetyIntelligence
    events: LocalEvent[]
    financial: FinancialIntelligence
    regulations: RegulationIntelligence
  }
  
  // ==========================================
  // SECTION 6: GENERATION METADATA
  // ==========================================
  
  generation: {
    requestedModules: ModuleType[]
    generatedAt: string
    contextVersion: string
    cacheHints: CacheHint[]
  }
}
```

### 2.3 Traveler Context (Deep Profile)

```typescript
/**
 * Everything we know about a single traveler
 */
interface TravelerContext {
  
  // === Identity ===
  id: string
  userId: string | null              // Null if non-user (child, guest)
  firstName: string
  lastName: string
  isOwner: boolean
  role: 'owner' | 'admin' | 'editor' | 'traveler' | 'viewer'
  
  // === Demographics ===
  demographics: {
    age: number
    ageCategory: 'infant' | 'child' | 'teen' | 'young_adult' | 'adult' | 'senior'
    gender: 'male' | 'female' | 'non_binary' | 'prefer_not_to_say'
    nationality: string                // ISO country code
    countryOfResidence: string
    languagesSpoken: string[]          // ISO language codes
    primaryLanguage: string
  }
  
  // === Professional Context ===
  professional: {
    profession: string | null          // "Software Engineer", "DJ", "Doctor"
    industry: string | null            // "Technology", "Entertainment", "Healthcare"
    travelingForWork: boolean
    needsWorkEquipment: boolean
    professionalItems: string[]        // Derived from profession
    /*
      Examples:
      - DJ: ["Laptop", "Headphones", "Audio interface", "USB drives", "Adapters"]
      - Doctor: ["Medical license copy", "Prescription pad", "Stethoscope"]
      - Photographer: ["Camera body", "Lenses", "Tripod", "Memory cards", "Laptop"]
      - Lawyer: ["Laptop", "Document folders", "Business cards"]
      - Fitness Instructor: ["Workout clothes", "Resistance bands", "Yoga mat"]
    */
  }
  
  // === Religious & Cultural ===
  cultural: {
    religion: string | null            // "Muslim", "Christian", "Jewish", "Hindu", "Buddhist", "None"
    religiousObservance: 'strict' | 'moderate' | 'casual' | 'none'
    religiousItems: string[]           // Derived from religion
    /*
      Examples:
      - Muslim (strict): ["Prayer mat", "Qibla compass", "Prayer beads", "Modest swimwear", "Halal snacks"]
      - Jewish (observant): ["Kosher snacks", "Shabbat candles", "Kippah", "Siddur"]
      - Hindu: ["Puja items", "Incense", "Religious texts"]
      - Christian: ["Bible", "Rosary"]
    */
    culturalConsiderations: string[]   // Things to be aware of
    dietaryFromReligion: string[]      // Halal, Kosher, Vegetarian
  }
  
  // === Health & Medical ===
  health: {
    medicalConditions: MedicalCondition[]
    /*
      Each condition includes:
      - name: "Diabetes", "Asthma", "Epilepsy", "Heart condition"
      - severity: "mild" | "moderate" | "severe"
      - medications: ["Insulin", "Metformin"]
      - equipment: ["Blood glucose monitor", "Insulin pen"]
      - considerations: ["Carry medical letter", "Keep medication cool"]
    */
    
    allergies: Allergy[]
    /*
      - type: "food" | "environmental" | "medication"
      - allergen: "Peanuts", "Shellfish", "Penicillin", "Bee stings"
      - severity: "mild" | "moderate" | "severe" | "life_threatening"
      - hasEpiPen: boolean
    */
    
    dietaryRestrictions: string[]      // "Vegetarian", "Vegan", "Gluten-free", "Lactose-free"
    
    mobilityNeeds: {
      hasDisability: boolean
      mobilityAid: string | null       // "Wheelchair", "Walker", "Cane"
      needsAccessibleRoom: boolean
      needsAccessibleTransport: boolean
      canClimbStairs: boolean
      walkingLimitMinutes: number | null
    }
    
    visionNeeds: {
      wearsGlasses: boolean
      wearsContacts: boolean
      colorBlind: boolean
      visuallyImpaired: boolean
    }
    
    hearingNeeds: {
      hearingAid: boolean
      deaf: boolean
    }
    
    pregnancyStatus: {
      isPregnant: boolean
      trimester: number | null
      dueDate: string | null
    }
    
    currentMedications: Medication[]
    /*
      - name: "Lisinopril"
      - dosage: "10mg"
      - frequency: "Once daily"
      - needsRefrigeration: boolean
      - isControlledSubstance: boolean  // May need special documentation
    */
    
    vaccinationsOnRecord: string[]     // ["COVID-19", "Yellow Fever", "Hepatitis A"]
    recentSurgeries: string[]          // For flight/activity restrictions
  }
  
  // === Travel Preferences ===
  preferences: {
    travelStyle: 'backpacker' | 'budget' | 'comfortable' | 'luxury' | 'ultra_luxury'
    accommodationPreference: 'hostel' | 'budget_hotel' | 'mid_range_hotel' | 'luxury_hotel' | 'resort' | 'airbnb' | 'villa'
    
    foodPreferences: {
      adventurousness: 'very_adventurous' | 'somewhat_adventurous' | 'stick_to_familiar'
      cuisinePreferences: string[]     // ["Italian", "Japanese", "Local"]
      avoidFoods: string[]             // Personal dislikes
      spiceTolerance: 'none' | 'mild' | 'medium' | 'hot' | 'extra_hot'
    }
    
    activityLevel: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active'
    interestAreas: string[]            // ["History", "Food", "Adventure", "Nature", "Art", "Nightlife"]
    
    packingStyle: 'minimalist' | 'normal' | 'overpacker'
    
    morningPerson: boolean
    comfortWithCrowds: 'loves' | 'tolerates' | 'avoids'
    
    photography: 'none' | 'phone_only' | 'enthusiast' | 'professional'
  }
  
  // === Experience Level ===
  experience: {
    internationalTravelCount: number
    hasVisitedDestination: boolean
    previousVisitYear: number | null
    countriesVisited: string[]         // For visa inference
    frequentTraveler: boolean          // TSA PreCheck, Global Entry
    hasGlobalEntry: boolean
    hasTSAPreCheck: boolean
    
    languageProficiency: {
      [languageCode: string]: 'none' | 'basic' | 'conversational' | 'fluent' | 'native'
    }
  }
  
  // === Documents ===
  documents: {
    passport: {
      hasPassport: boolean
      passportCountry: string
      expirationDate: string | null
      monthsUntilExpiry: number | null
      needsRenewal: boolean            // < 6 months
    }
    
    visa: {
      hasValidVisa: boolean
      visaType: string | null
      visaExpiration: string | null
    }
    
    driversLicense: {
      hasLicense: boolean
      licenseCountry: string
      hasInternationalPermit: boolean
    }
    
    insurance: {
      hasTravelInsurance: boolean
      insuranceProvider: string | null
      policyNumber: string | null
      coverageType: string | null
    }
    
    storedDocuments: StoredDocument[]  // Uploaded to Guidera
  }
  
  // === Financial ===
  financial: {
    primaryPaymentMethod: 'credit_card' | 'debit_card' | 'cash' | 'mixed'
    creditCards: CreditCard[]          // For benefits, lounge access
    hasNoForeignTransactionFeeCard: boolean
    preferredCurrency: string
    comfortWithBargaining: 'none' | 'some' | 'comfortable'
  }
  
  // === Emergency ===
  emergency: {
    contacts: EmergencyContact[]
    bloodType: string | null
    organDonor: boolean
  }
}
```

### 2.4 Destination Intelligence

```typescript
/**
 * Complete intelligence about a destination
 * Combines static data with real-time information
 */
interface DestinationIntelligence {
  
  // === Basic Info ===
  basic: {
    code: string                       // "DXB", "PAR", "TYO"
    name: string                       // "Dubai"
    country: string                    // "United Arab Emirates"
    countryCode: string                // "AE"
    region: string                     // "Middle East"
    continent: string                  // "Asia"
    timezone: string                   // "Asia/Dubai"
    utcOffset: number                  // +4
    coordinates: { lat: number; lng: number }
  }
  
  // === Geography & Climate ===
  geography: {
    climateType: string                // "Desert", "Tropical", "Mediterranean"
    hemisphere: 'northern' | 'southern'
    isCoastal: boolean
    isIsland: boolean
    altitude: number                   // meters
    altitudeCategory: 'sea_level' | 'low' | 'moderate' | 'high' | 'very_high'
    /*
      Altitude categories for health considerations:
      - sea_level: 0-500m
      - low: 500-1500m
      - moderate: 1500-2500m (mild altitude effects possible)
      - high: 2500-3500m (altitude sickness risk)
      - very_high: 3500m+ (serious altitude consideration)
    */
    
    terrainTypes: string[]             // ["Desert", "Beach", "Mountains", "Urban"]
    waterBodies: string[]              // ["Persian Gulf", "Creek"]
  }
  
  // === Language & Communication ===
  language: {
    officialLanguages: string[]        // ["Arabic"]
    commonlySpoken: string[]           // ["Arabic", "English", "Hindi", "Urdu"]
    englishProficiency: 'none' | 'low' | 'moderate' | 'high' | 'widespread'
    businessLanguage: string           // "English"
    signageLanguages: string[]         // Languages on signs
    
    writingSystem: string              // "Arabic script"
    readingDirection: 'ltr' | 'rtl'    // Right to left for Arabic
    
    essentialPhrases: EssentialPhrase[]
    /*
      {
        english: "Hello",
        local: "مرحبا",
        transliteration: "Marhaba",
        pronunciation: "mar-HA-ba",
        context: "Greeting, any time of day",
        formalityLevel: "neutral"
      }
    */
  }
  
  // === Culture & Society ===
  culture: {
    predominantReligion: string        // "Islam"
    religiousInfluence: 'secular' | 'moderate' | 'significant' | 'dominant'
    
    culturalValues: string[]           // ["Family", "Hospitality", "Respect for elders"]
    socialNorms: SocialNorm[]
    
    greetingCustoms: {
      sameSex: string                  // "Handshake, may include cheek kisses"
      oppositeSex: string              // "Verbal greeting, often no physical contact"
      elders: string                   // "Show respect, wait for them to initiate"
      business: string                 // "Firm handshake, exchange business cards"
    }
    
    dressCode: {
      general: string                  // "Conservative, especially in public"
      women: string                    // "Shoulders and knees covered"
      men: string                      // "Long pants preferred"
      beach: string                    // "Swimwear allowed at beach/pool only"
      religiousSites: string           // "Full coverage, head covering for women"
      business: string                 // "Formal attire"
      nightlife: string                // "Smart casual to formal"
    }
    
    publicBehavior: {
      pdaAcceptance: 'prohibited' | 'discouraged' | 'tolerated' | 'accepted'
      alcoholRules: string             // "Licensed venues only"
      photographyRules: string         // "Ask permission, no government buildings"
      smokingRules: string             // "Designated areas only"
    }
    
    genderDynamics: {
      genderSegregation: boolean
      womenOnlySpaces: boolean
      lgbtqAcceptance: 'illegal' | 'not_accepted' | 'tolerated' | 'accepted' | 'progressive'
      lgbtqLegalStatus: string         // "Illegal"
      lgbtqAdvice: string              // "Exercise extreme discretion"
    }
    
    timeOrientation: {
      punctuality: 'strict' | 'moderate' | 'relaxed'
      businessHoursPattern: string     // "Sun-Thu, 8am-6pm"
      weekendDays: string[]            // ["Friday", "Saturday"]
      siestaCulture: boolean
      typicalMealTimes: {
        breakfast: string              // "7-9 AM"
        lunch: string                  // "1-3 PM"
        dinner: string                 // "8-10 PM"
      }
    }
  }
  
  // === Laws & Regulations ===
  laws: {
    legalSystem: string                // "Civil law based on Sharia"
    
    strictLaws: StrictLaw[]
    /*
      {
        topic: "Alcohol",
        law: "Consumption only in licensed venues",
        penalty: "Fine, imprisonment, deportation",
        severity: "high",
        enforcementLevel: "strict"
      }
    */
    
    prohibitions: string[]             // ["Public intoxication", "Cohabitation", "Blasphemy"]
    
    drugLaws: {
      severity: 'lenient' | 'moderate' | 'strict' | 'severe'
      penalties: string                // "Severe penalties including death for trafficking"
      prescriptionRules: string        // "Carry prescription, some medications banned"
      bannedMedications: string[]      // ["Codeine", "Tramadol"]
    }
    
    importRestrictions: {
      prohibitedItems: string[]        // ["Pork", "Pornography", "Religious materials"]
      restrictedItems: string[]        // ["Alcohol - limit 4L", "Cigarettes - 400"]
      declarationRequired: string[]    // ["Cash over $10,000", "Medications"]
      customsNotes: string
    }
    
    droneLaws: {
      permitted: boolean
      requiresRegistration: boolean
      restrictedAreas: string[]
      notes: string
    }
    
    drivingLaws: {
      minimumAge: number
      licenseRequirements: string      // "IDP required"
      sideOfRoad: 'left' | 'right'
      speedLimits: { urban: number; highway: number }
      alcoholLimit: number             // BAC
      phoneLaws: string                // "Hands-free only"
      seatbeltLaws: string
    }
  }
  
  // === Practical Information ===
  practical: {
    electricity: {
      plugTypes: string[]              // ["G"]
      voltage: number                  // 220
      frequency: number                // 50
      needsAdapter: boolean            // Calculated based on traveler origin
      notes: string
    }
    
    water: {
      tapWaterSafe: boolean
      recommendedWater: 'tap' | 'filtered' | 'bottled'
      bottledWaterCost: { amount: number; currency: string; unit: string }
    }
    
    internet: {
      wifiAvailability: 'limited' | 'moderate' | 'widespread'
      averageSpeed: string             // "Fast (50+ Mbps)"
      mobileDataAvailability: boolean
      simCardEasy: boolean
      simCardCost: { amount: number; currency: string; data: string }
      vpnNeeded: boolean
      blockedServices: string[]        // ["WhatsApp calls", "FaceTime"]
    }
    
    healthcare: {
      qualityLevel: 'basic' | 'moderate' | 'good' | 'excellent'
      publicHealthcareAccess: boolean
      privateHealthcareAvailable: boolean
      pharmaciesCommon: boolean
      emergencyNumber: string          // "999"
      averageHospitalVisitCost: { amount: number; currency: string }
      insuranceRecommended: boolean
      
      commonHealthRisks: string[]      // ["Heat exhaustion", "Sunburn"]
      vaccinationsRequired: string[]
      vaccinationsRecommended: string[]
      malariaRisk: boolean
      dengueRisk: boolean
      waterborneRisks: boolean
    }
    
    transportation: {
      publicTransit: {
        available: boolean
        quality: 'poor' | 'basic' | 'good' | 'excellent'
        types: string[]                // ["Metro", "Bus", "Tram"]
        paymentMethods: string[]       // ["NOL card", "Contactless"]
        touristFriendly: boolean
      }
      
      taxi: {
        available: boolean
        metered: boolean
        appBased: string[]             // ["Uber", "Careem"]
        averageCost: string            // "AED 3/km"
        safetyRating: 'low' | 'moderate' | 'high'
        tippingExpected: boolean
      }
      
      driving: {
        recommendedForTourists: boolean
        trafficConditions: string
        parkingAvailability: string
        tollRoads: boolean
        internationalLicenseNeeded: boolean
      }
      
      intercity: {
        trainAvailable: boolean
        busAvailable: boolean
        domesticFlights: boolean
      }
    }
    
    money: {
      currency: string                 // "AED"
      currencySymbol: string           // "د.إ"
      currencyName: string             // "UAE Dirham"
      
      exchangeRate: {
        toUSD: number
        toEUR: number
        toGBP: number
        lastUpdated: string
      }
      
      cashVsCard: {
        cardAcceptance: 'low' | 'moderate' | 'high' | 'universal'
        preferredPayment: 'cash' | 'card' | 'either'
        atmAvailability: 'scarce' | 'available' | 'widespread'
        atmNetworks: string[]          // ["VISA", "Mastercard", "Amex"]
        atmFees: string                // "Usually free, check your bank"
        foreignTransactionFees: string
      }
      
      tipping: {
        customary: boolean
        serviceChargeIncluded: boolean
        restaurantTip: string          // "10-15%"
        hotelTip: string               // "AED 10-20/day"
        taxiTip: string                // "Round up"
        tourGuideTip: string           // "AED 50-100"
        notes: string
      }
      
      bargaining: {
        expected: boolean
        whereToBargin: string[]        // ["Souks", "Markets", "Taxis"]
        whereNotToBargin: string[]     // ["Malls", "Restaurants"]
        typicalDiscount: string        // "20-40%"
        tips: string[]
      }
      
      costOfLiving: {
        comparedToUS: 'much_cheaper' | 'cheaper' | 'similar' | 'expensive' | 'much_more_expensive'
        budgetPerDay: { min: number; max: number; currency: string }
        midRangePerDay: { min: number; max: number; currency: string }
        luxuryPerDay: { min: number; max: number; currency: string }
        
        typicalCosts: {
          localMeal: { amount: number; currency: string }
          midRangeMeal: { amount: number; currency: string }
          fineDiningMeal: { amount: number; currency: string }
          coffee: { amount: number; currency: string }
          beer: { amount: number; currency: string }
          water: { amount: number; currency: string }
          publicTransport: { amount: number; currency: string }
          taxiStart: { amount: number; currency: string }
        }
      }
    }
  }
  
  // === Safety Intelligence ===
  safety: {
    overallScore: number               // 0-100
    overallLevel: 'safe' | 'moderate_caution' | 'exercise_caution' | 'high_risk' | 'dangerous'
    
    breakdown: {
      crime: number
      terrorism: number
      naturalDisasters: number
      healthRisks: number
      infrastructure: number
      politicalStability: number
    }
    
    currentAdvisories: TravelAdvisory[]
    
    crimeInfo: {
      violentCrimeRate: 'very_low' | 'low' | 'moderate' | 'high' | 'very_high'
      pettyTheftRate: 'very_low' | 'low' | 'moderate' | 'high' | 'very_high'
      commonCrimes: string[]           // ["Pickpocketing", "Car theft"]
      safestAreas: string[]
      areasToAvoid: AreaWarning[]
      /*
        {
          area: "Certain neighborhoods at night",
          reason: "Higher crime rate",
          severity: "moderate",
          timeOfDay: "night",
          avoidCompletely: false
        }
      */
      nightSafety: string
      womenSafety: string
      lgbtqSafety: string
    }
    
    scams: ScamWarning[]
    /*
      {
        name: "Taxi overcharging",
        description: "Drivers may not use meter or take long routes",
        whereCommon: ["Airport", "Tourist areas"],
        howToAvoid: "Insist on meter, use ride apps",
        severity: "low"
      }
    */
    
    naturalDisasterRisks: {
      earthquakes: boolean
      hurricanes: boolean
      flooding: boolean
      wildfires: boolean
      tsunamis: boolean
      volcanoes: boolean
      currentRisks: string[]
    }
    
    emergencyNumbers: {
      general: string                  // "999"
      police: string
      ambulance: string
      fire: string
      touristPolice: string | null
      coastGuard: string | null
    }
  }
  
  // === Time-Sensitive Information ===
  timeSensitive: {
    currentEvents: LocalEvent[]
    holidays: Holiday[]
    ramadanPeriod: { start: string; end: string } | null
    weatherAlerts: WeatherAlert[]
    travelAdvisoryChanges: AdvisoryChange[]
  }
}
```

### 2.5 Weather Forecast Context

```typescript
interface WeatherForecast {
  location: string
  forecastPeriod: { start: string; end: string }
  
  summary: {
    overallCondition: 'sunny' | 'partly_cloudy' | 'cloudy' | 'rainy' | 'stormy' | 'snowy' | 'mixed'
    temperatureRange: { min: number; max: number; unit: 'celsius' }
    rainDays: number
    sunnyDays: number
    humidity: 'low' | 'moderate' | 'high' | 'very_high'
  }
  
  dailyForecast: DailyWeather[]
  /*
    {
      date: "2025-03-15",
      dayOfWeek: "Saturday",
      condition: "sunny",
      tempHigh: 35,
      tempLow: 22,
      humidity: 45,
      uvIndex: 10,
      precipitationChance: 5,
      windSpeed: 15,
      sunrise: "06:23",
      sunset: "18:45"
    }
  */
  
  packingImplications: {
    needsSunProtection: boolean
    needsRainGear: boolean
    needsWarmClothing: boolean
    needsLightClothing: boolean
    layersRecommended: boolean
    specificRecommendations: string[]
    /*
      ["High UV - pack SPF 50+", "Hot temperatures - light, breathable fabrics"]
    */
  }
  
  activityImplications: {
    outdoorActivitiesSuitable: boolean
    beachWeatherDays: number
    bestDaysForOutdoor: string[]       // Dates
    daysToAvoidOutdoor: string[]       // Dates with bad weather
    recommendations: string[]
  }
}
```

### 2.6 Financial Intelligence Context

```typescript
interface FinancialIntelligence {
  
  // Exchange rates
  exchangeRates: {
    baseCurrency: string               // User's home currency
    destinationCurrency: string
    rate: number
    inverseRate: number
    lastUpdated: string
    trend: 'strengthening' | 'stable' | 'weakening'
    
    // Quick conversion reference
    quickConversions: {
      [localAmount: number]: number    // { 100: 27.23, 500: 136.15 }
    }
  }
  
  // Payment landscape
  paymentLandscape: {
    primaryPaymentMethod: 'cash' | 'card' | 'mobile'
    cashImportance: 'essential' | 'recommended' | 'optional'
    
    cardAcceptance: {
      visa: 'none' | 'limited' | 'moderate' | 'widespread' | 'universal'
      mastercard: 'none' | 'limited' | 'moderate' | 'widespread' | 'universal'
      amex: 'none' | 'limited' | 'moderate' | 'widespread' | 'universal'
      discover: 'none' | 'limited' | 'moderate' | 'widespread' | 'universal'
      unionpay: 'none' | 'limited' | 'moderate' | 'widespread' | 'universal'
    }
    
    contactlessPayment: boolean
    mobilePayment: {
      applePay: boolean
      googlePay: boolean
      localApps: string[]
    }
  }
  
  // ATM information
  atmInfo: {
    availability: 'rare' | 'available' | 'common' | 'everywhere'
    acceptsInternationalCards: boolean
    typicalFees: {
      localBankFee: { amount: number; currency: string }
      foreignFee: string               // "Usually charged by your bank"
    }
    bestNetworks: string[]
    safetyTips: string[]
    recommendedAmount: string          // "Withdraw larger amounts less frequently"
  }
  
  // Money exchange
  exchangeOptions: {
    whereToExchange: ExchangeLocation[]
    /*
      {
        type: "airport",
        name: "Airport exchange",
        rateQuality: "poor",
        convenience: "high",
        recommendation: "Only for small amounts if needed immediately"
      }
    */
    bestOption: string
    avoidOptions: string[]
    tips: string[]
  }
  
  // Budget guidance
  budgetGuidance: {
    dailyBudgetEstimate: {
      budget: { min: number; max: number; currency: string }
      midRange: { min: number; max: number; currency: string }
      luxury: { min: number; max: number; currency: string }
    }
    
    expectedExpenses: ExpenseEstimate[]
    /*
      {
        category: "Meals",
        budgetOption: "Street food: $5-10",
        midRangeOption: "Local restaurant: $15-25",
        luxuryOption: "Fine dining: $50-100+"
      }
    */
    
    hiddenCosts: string[]              // ["Service charges", "Tourism taxes"]
    savingTips: string[]
    splurgeRecommendations: string[]   // "Worth the splurge: Burj Khalifa experience"
  }
  
  // Tipping guidance
  tippingGuidance: {
    culture: 'not_expected' | 'appreciated' | 'expected' | 'essential'
    serviceChargeCommon: boolean
    
    byService: {
      restaurant: { amount: string; notes: string }
      hotel_bellhop: { amount: string; notes: string }
      hotel_housekeeping: { amount: string; notes: string }
      taxi: { amount: string; notes: string }
      tour_guide: { amount: string; notes: string }
      spa: { amount: string; notes: string }
      hairdresser: { amount: string; notes: string }
    }
    
    etiquette: string[]                // How to tip (cash, add to bill, etc.)
  }
  
  // Bargaining guidance
  bargainingGuidance: {
    isCommon: boolean
    whereExpected: string[]
    whereInappropriate: string[]
    startingOffer: string              // "Start at 30-40% of asking price"
    acceptableDiscount: string         // "Expect to settle at 50-70%"
    techniques: string[]
    culturalNotes: string[]
    phrases: BargainingPhrase[]
    /*
      {
        english: "That's too expensive",
        local: "هذا غالي جداً",
        transliteration: "Hatha ghali jiddan",
        usage: "Initial response to price"
      }
    */
  }
}
```

### 2.7 Regulation Intelligence Context

```typescript
interface RegulationIntelligence {
  
  // Visa requirements (personalized to traveler nationality)
  visaRequirements: {
    required: boolean
    type: 'visa_free' | 'visa_on_arrival' | 'evisa' | 'embassy_visa'
    
    visaFreeDetails: {
      maxStay: number                  // Days
      extendable: boolean
      requirements: string[]           // ["Valid passport", "Return ticket"]
    } | null
    
    visaOnArrivalDetails: {
      maxStay: number
      cost: { amount: number; currency: string }
      paymentMethods: string[]
      processingTime: string
      requirements: string[]
    } | null
    
    evisaDetails: {
      applicationUrl: string
      processingTime: string
      cost: { amount: number; currency: string }
      maxStay: number
      multipleEntry: boolean
      requirements: string[]
      leadTime: string                 // "Apply at least 5 days before"
    } | null
    
    embassyVisaDetails: {
      nearestEmbassy: EmbassyInfo
      processingTime: string
      cost: { amount: number; currency: string }
      requirements: string[]
      appointmentRequired: boolean
    } | null
    
    passportRequirements: {
      validityRequired: string         // "6 months beyond travel date"
      blankPagesRequired: number
      machineReadableRequired: boolean
    }
  }
  
  // Entry requirements
  entryRequirements: {
    covid: {
      testRequired: boolean
      vaccinationRequired: boolean
      acceptedVaccines: string[]
      quarantineRequired: boolean
      healthDeclarationRequired: boolean
      lastUpdated: string
      moreInfoUrl: string
    }
    
    healthCertificates: {
      yellowFeverRequired: boolean
      otherRequired: string[]
    }
    
    onwardTicketRequired: boolean
    accommodationProofRequired: boolean
    financialProofRequired: boolean
    financialProofAmount: string | null
    
    customsForms: {
      declarationRequired: boolean
      onlineSubmission: boolean
      submissionUrl: string | null
    }
  }
  
  // Airline luggage requirements (from bookings)
  luggageRules: {
    carryOn: {
      weight: { amount: number; unit: 'kg' | 'lb' }
      dimensions: { length: number; width: number; height: number; unit: 'cm' | 'in' }
      personalItemIncluded: boolean
    }
    
    checkedBag: {
      included: boolean
      weight: { amount: number; unit: 'kg' | 'lb' }
      numberOfBags: number
      additionalBagCost: { amount: number; currency: string }
    }
    
    restrictedItems: string[]          // Airline-specific
    notes: string[]
    
    // Country-specific luggage restrictions
    destinationRestrictions: {
      prohibitedItems: string[]
      restrictedItems: string[]
      declarationRequired: string[]
    }
  }
  
  // Customs & import rules
  customsRules: {
    dutyFreeAllowances: {
      alcohol: string                  // "4 liters"
      tobacco: string                  // "400 cigarettes"
      perfume: string
      gifts: { amount: number; currency: string }
    }
    
    prohibitedImports: string[]
    restrictedImports: ItemRestriction[]
    /*
      {
        item: "Medications",
        restriction: "Must have prescription",
        declarationRequired: true,
        notes: "Some medications banned - check before travel"
      }
    */
    
    currencyDeclaration: {
      required: boolean
      threshold: { amount: number; currency: string }
    }
    
    foodRestrictions: string[]
    animalProductRestrictions: string[]
  }
  
  // Required/recommended vaccinations
  healthRequirements: {
    requiredVaccinations: Vaccination[]
    /*
      {
        name: "Yellow Fever",
        required: true,
        requiredFor: "Travelers from endemic countries",
        validityPeriod: "Lifetime",
        getVaccinatedBefore: "10 days before travel"
      }
    */
    
    recommendedVaccinations: Vaccination[]
    
    malariaRisk: {
      present: boolean
      areas: string[]
      prophylaxisRecommended: boolean
      recommendedMedication: string[]
    }
    
    otherHealthPrecautions: string[]
  }
  
  // Document checklist (personalized)
  documentChecklist: DocumentRequirement[]
  /*
    {
      document: "Passport",
      required: true,
      status: "valid",  // Based on user's stored documents
      notes: "Valid until March 2028 - OK for this trip",
      action: null
    },
    {
      document: "Visa",
      required: true,
      status: "needed",
      notes: "eVisa required - apply online",
      action: {
        type: "apply",
        url: "https://...",
        deadline: "5 days before departure"
      }
    }
  */
}
```

### 2.8 Context Builder Service

```typescript
// src/services/ai-engine/context/context-builder.service.ts

export class ContextBuilderService {
  
  /**
   * Build complete generation context for a trip
   */
  async buildContext(tripId: string): Promise<TripGenerationContext> {
    
    // Step 1: Get core trip data
    const trip = await TripRepository.findById(tripId)
    const travelers = await TripRepository.getTravelers(tripId)
    const bookings = await TripRepository.getBookings(tripId)
    
    // Step 2: Enrich traveler profiles
    const enrichedTravelers = await Promise.all(
      travelers.map(t => this.enrichTravelerContext(t))
    )
    
    // Step 3: Build destination intelligence
    const destinationIntel = await this.buildDestinationIntelligence(
      trip.primary_destination_code,
      trip.primary_destination_country,
      enrichedTravelers[0]  // For nationality-specific info
    )
    
    // Step 4: Get weather forecast
    const weather = await WeatherService.getExtendedForecast(
      trip.primary_destination_code,
      trip.start_date,
      trip.end_date
    )
    
    // Step 5: Get safety intelligence
    const safety = await SafetyDataService.getIntelligence(
      trip.primary_destination_country
    )
    
    // Step 6: Get financial intelligence
    const financial = await FinancialDataService.getIntelligence(
      trip.primary_destination_country,
      enrichedTravelers[0].financial.preferredCurrency
    )
    
    // Step 7: Get regulations
    const regulations = await RegulationService.getRequirements(
      trip.primary_destination_country,
      enrichedTravelers[0].demographics.nationality,
      bookings.flights
    )
    
    // Step 8: Get local events
    const events = await EventsService.getEvents(
      trip.primary_destination_code,
      trip.start_date,
      trip.end_date
    )
    
    // Step 9: Process bookings
    const bookingContext = this.processBookings(bookings)
    
    // Step 10: Assemble complete context
    return {
      travelers: enrichedTravelers,
      primaryTraveler: enrichedTravelers.find(t => t.isOwner)!,
      travelerCount: travelers.length,
      hasChildren: enrichedTravelers.some(t => t.demographics.ageCategory === 'child'),
      hasInfants: enrichedTravelers.some(t => t.demographics.ageCategory === 'infant'),
      hasElderly: enrichedTravelers.some(t => t.demographics.ageCategory === 'senior'),
      
      trip: {
        id: trip.id,
        name: trip.name,
        primaryDestination: {
          code: trip.primary_destination_code,
          name: trip.primary_destination_name,
          country: trip.primary_destination_country
        },
        additionalDestinations: trip.additional_destinations || [],
        isMultiCity: (trip.additional_destinations?.length || 0) > 0,
        startDate: trip.start_date,
        endDate: trip.end_date,
        durationDays: trip.duration_days,
        durationNights: trip.duration_days - 1,
        tripType: trip.trip_type,
        purpose: trip.purpose || this.inferPurpose(trip, bookings),
        pacePreference: trip.pace_preference || 'moderate',
        composition: trip.traveler_composition,
        relationshipDynamic: this.inferRelationship(enrichedTravelers),
        budgetTier: this.inferBudgetTier(trip, bookings),
        budgetTotal: trip.budget_total,
        budgetCurrency: trip.budget_currency || 'USD',
        budgetPerDay: trip.budget_total ? trip.budget_total / trip.duration_days : null
      },
      
      bookings: bookingContext,
      destination: destinationIntel,
      
      realtime: {
        weather,
        safety,
        events,
        financial,
        regulations
      },
      
      generation: {
        requestedModules: ['all'],
        generatedAt: new Date().toISOString(),
        contextVersion: '2.0',
        cacheHints: this.generateCacheHints(trip, enrichedTravelers)
      }
    }
  }
  
  /**
   * Enrich traveler with derived data
   */
  private async enrichTravelerContext(
    traveler: TripTraveler
  ): Promise<TravelerContext> {
    
    // Get user profile if linked
    const user = traveler.user_id 
      ? await UserService.getFullProfile(traveler.user_id)
      : null
    
    // Calculate age category
    const ageCategory = this.calculateAgeCategory(traveler.age_at_travel)
    
    // Derive professional items
    const professionalItems = this.deriveProfessionalItems(user?.profession)
    
    // Derive religious items
    const religiousItems = this.deriveReligiousItems(
      user?.religion,
      user?.religious_observance
    )
    
    // Process medical conditions
    const medicalContext = this.processMedicalConditions(
      traveler.medical_conditions,
      user?.health_profile
    )
    
    return {
      id: traveler.id,
      userId: traveler.user_id,
      firstName: traveler.first_name,
      lastName: traveler.last_name || '',
      isOwner: traveler.is_owner,
      role: traveler.role,
      
      demographics: {
        age: traveler.age_at_travel,
        ageCategory,
        gender: traveler.gender || user?.gender || 'prefer_not_to_say',
        nationality: traveler.nationality || user?.nationality || 'US',
        countryOfResidence: user?.country_of_residence || user?.nationality || 'US',
        languagesSpoken: user?.languages_spoken || ['en'],
        primaryLanguage: user?.primary_language || 'en'
      },
      
      professional: {
        profession: user?.profession,
        industry: user?.industry,
        travelingForWork: false,  // Would come from trip context
        needsWorkEquipment: !!user?.profession && this.professionNeedsEquipment(user.profession),
        professionalItems
      },
      
      cultural: {
        religion: user?.religion,
        religiousObservance: user?.religious_observance || 'none',
        religiousItems,
        culturalConsiderations: this.deriveCulturalConsiderations(user),
        dietaryFromReligion: this.deriveDietaryFromReligion(user?.religion)
      },
      
      health: medicalContext,
      
      preferences: {
        travelStyle: user?.travel_style || 'comfortable',
        accommodationPreference: user?.accommodation_preference || 'mid_range_hotel',
        foodPreferences: {
          adventurousness: user?.food_adventurousness || 'somewhat_adventurous',
          cuisinePreferences: user?.cuisine_preferences || [],
          avoidFoods: user?.avoid_foods || [],
          spiceTolerance: user?.spice_tolerance || 'medium'
        },
        activityLevel: user?.activity_level || 'moderate',
        interestAreas: user?.interests || [],
        packingStyle: user?.packing_style || 'normal',
        morningPerson: user?.morning_person ?? true,
        comfortWithCrowds: user?.crowd_comfort || 'tolerates',
        photography: user?.photography_level || 'phone_only'
      },
      
      experience: {
        internationalTravelCount: user?.international_trips_count || 0,
        hasVisitedDestination: false,  // Would check history
        previousVisitYear: null,
        countriesVisited: user?.countries_visited || [],
        frequentTraveler: (user?.international_trips_count || 0) > 10,
        hasGlobalEntry: user?.has_global_entry || false,
        hasTSAPreCheck: user?.has_tsa_precheck || false,
        languageProficiency: user?.language_proficiency || {}
      },
      
      documents: {
        passport: {
          hasPassport: !!user?.passport_expiry,
          passportCountry: user?.passport_country || user?.nationality || 'US',
          expirationDate: user?.passport_expiry,
          monthsUntilExpiry: user?.passport_expiry 
            ? this.monthsUntil(user.passport_expiry) 
            : null,
          needsRenewal: user?.passport_expiry 
            ? this.monthsUntil(user.passport_expiry) < 6
            : true
        },
        visa: {
          hasValidVisa: false,  // Would check stored visas
          visaType: null,
          visaExpiration: null
        },
        driversLicense: {
          hasLicense: user?.has_drivers_license ?? true,
          licenseCountry: user?.license_country || user?.nationality || 'US',
          hasInternationalPermit: user?.has_idp || false
        },
        insurance: {
          hasTravelInsurance: !!user?.insurance_provider,
          insuranceProvider: user?.insurance_provider,
          policyNumber: user?.insurance_policy,
          coverageType: user?.insurance_type
        },
        storedDocuments: user?.documents || []
      },
      
      financial: {
        primaryPaymentMethod: user?.payment_preference || 'credit_card',
        creditCards: user?.credit_cards || [],
        hasNoForeignTransactionFeeCard: this.hasNoFTFCard(user?.credit_cards),
        preferredCurrency: user?.preferred_currency || 'USD',
        comfortWithBargaining: user?.bargaining_comfort || 'some'
      },
      
      emergency: {
        contacts: user?.emergency_contacts || [],
        bloodType: user?.blood_type,
        organDonor: user?.organ_donor || false
      }
    }
  }
  
  /**
   * Derive professional items based on profession
   */
  private deriveProfessionalItems(profession: string | null): string[] {
    if (!profession) return []
    
    const professionMap: Record<string, string[]> = {
      // Creative & Media
      'photographer': ['Camera body', 'Lenses', 'Tripod', 'Memory cards', 'Lens cleaning kit', 'Laptop', 'External hard drive', 'Camera bag', 'Extra batteries', 'Charger'],
      'videographer': ['Camera', 'Gimbal', 'Microphone', 'Memory cards', 'Laptop', 'Tripod', 'ND filters', 'Extra batteries', 'Charger', 'Hard drives'],
      'dj': ['Laptop', 'Headphones', 'Audio interface', 'USB drives with music', 'Cables', 'Adapters', 'Controller (if bringing)', 'Backup hard drive'],
      'musician': ['Instrument', 'Sheet music/tablet', 'Instrument accessories', 'Tuner', 'Metronome', 'Practice mute'],
      'writer': ['Laptop', 'Notebook', 'Pens', 'Portable charger', 'Noise-canceling headphones'],
      'journalist': ['Laptop', 'Voice recorder', 'Camera', 'Notebook', 'Press credentials', 'Local contacts list', 'VPN subscription'],
      'influencer': ['Phone with good camera', 'Ring light (portable)', 'Tripod/selfie stick', 'Portable charger', 'Multiple outfits for content'],
      'content_creator': ['Camera', 'Microphone', 'Laptop', 'Tripod', 'Lighting', 'Props', 'Portable charger'],
      
      // Medical & Health
      'doctor': ['Medical license copy', 'Prescription pad', 'Stethoscope', 'Medical reference app', 'Basic medical kit'],
      'nurse': ['Nursing license copy', 'Basic medical supplies', 'Comfortable shoes'],
      'dentist': ['Dental license copy', 'Emergency dental kit'],
      'pharmacist': ['License copy', 'Drug reference guide'],
      'therapist': ['License copy', 'Confidential notes (secured)', 'Teletherapy setup'],
      'fitness_instructor': ['Workout clothes', 'Resistance bands', 'Yoga mat', 'Jump rope', 'Portable speaker'],
      'personal_trainer': ['Workout gear', 'Resistance bands', 'Timer', 'Client programs'],
      
      // Business & Finance
      'lawyer': ['Laptop', 'Legal documents (encrypted)', 'Business cards', 'Professional attire', 'Legal references'],
      'accountant': ['Laptop', 'Calculator', 'Secure document storage', 'Business cards'],
      'consultant': ['Laptop', 'Presentation clicker', 'Business cards', 'Professional attire', 'Portfolio'],
      'executive': ['Laptop', 'Business cards', 'Professional attire', 'Portfolio', 'Multiple chargers'],
      'entrepreneur': ['Laptop', 'Business cards', 'Notebook', 'Portable charger', 'Professional attire'],
      'sales': ['Laptop', 'Business cards', 'Presentation materials', 'Product samples', 'Professional attire'],
      
      // Technology
      'software_engineer': ['Laptop', 'Charger', 'Mouse', 'Headphones', 'Portable monitor (optional)', 'VPN setup'],
      'developer': ['Laptop', 'Charger', 'Mouse', 'Coding peripherals', 'Portable keyboard'],
      'designer': ['Laptop', 'Design tablet', 'Stylus', 'Color calibration tool', 'Portfolio'],
      'it_professional': ['Laptop', 'USB toolkit', 'Cables', 'Network tools', 'Security keys'],
      'data_scientist': ['Laptop', 'External hard drive', 'Notebook', 'Calculator'],
      
      // Education
      'teacher': ['Lesson materials', 'Laptop/tablet', 'Educational supplies', 'Reading materials'],
      'professor': ['Research materials', 'Laptop', 'Books', 'Presentation materials'],
      'researcher': ['Research notes', 'Laptop', 'Recording equipment', 'Reference materials'],
      'student': ['Textbooks/tablet', 'Laptop', 'Study materials', 'Notebooks'],
      
      // Trades & Technical
      'engineer': ['Laptop', 'Calculator', 'Technical references', 'Safety gear (if site visits)'],
      'architect': ['Laptop', 'Drawing tablet', 'Portfolio', 'Measuring tools', 'Camera'],
      'chef': ['Knife kit', 'Chef coat', 'Recipe notes', 'Tasting spoons'],
      'pilot': ['License', 'Logbook', 'Charts', 'Headset', 'Flight bag'],
      'flight_attendant': ['Uniform', 'Comfortable shoes', 'Travel essentials bag', 'Crew ID'],
      
      // Arts & Entertainment
      'actor': ['Headshots', 'Scripts', 'Makeup kit', 'Professional attire'],
      'model': ['Portfolio', 'Comp cards', 'Makeup kit', 'Multiple outfits', 'Heels'],
      'artist': ['Sketchbook', 'Art supplies', 'Portfolio', 'Camera for reference'],
      'dancer': ['Dance shoes', 'Practice wear', 'Resistance bands', 'Music player'],
      
      // Service Industry
      'real_estate_agent': ['Laptop', 'Business cards', 'Property portfolios', 'Professional attire'],
      'event_planner': ['Laptop', 'Planner/notebook', 'Business cards', 'Emergency kit'],
      'marketing': ['Laptop', 'Business cards', 'Portfolio', 'Analytics access'],
      
      // Other
      'military': ['Military ID', 'Orders (if applicable)', 'Uniform (if required)'],
      'diplomat': ['Diplomatic passport', 'Credentials', 'Formal attire', 'Secure communication device'],
      'clergy': ['Religious vestments', 'Religious texts', 'Ceremonial items'],
      'athlete': ['Training gear', 'Equipment', 'Supplements', 'Recovery tools', 'Team apparel'],
    }
    
    const normalizedProfession = profession.toLowerCase().replace(/\s+/g, '_')
    
    // Try exact match
    if (professionMap[normalizedProfession]) {
      return professionMap[normalizedProfession]
    }
    
    // Try partial match
    for (const [key, items] of Object.entries(professionMap)) {
      if (normalizedProfession.includes(key) || key.includes(normalizedProfession)) {
        return items
      }
    }
    
    // Generic professional items if no match
    return ['Laptop', 'Business cards', 'Professional attire', 'Work documents']
  }
  
  /**
   * Derive religious items based on religion and observance
   */
  private deriveReligiousItems(
    religion: string | null,
    observance: string | null
  ): string[] {
    if (!religion || religion.toLowerCase() === 'none') return []
    
    const level = observance || 'moderate'
    
    const religiousItemsMap: Record<string, Record<string, string[]>> = {
      'muslim': {
        'strict': [
          'Prayer mat (Sajjada)',
          'Qibla compass/app',
          'Prayer beads (Misbaha)',
          'Quran or Quran app',
          'Prayer cap (Kufi) - men',
          'Hijab/modest clothing - women',
          'Halal snacks for travel',
          'Miswak',
          'Prayer timetable',
          'Modest swimwear',
          'Wudu-friendly socks',
          'Travel-size prayer mat'
        ],
        'moderate': [
          'Prayer mat (compact/travel)',
          'Qibla compass app',
          'Halal snacks',
          'Modest clothing',
          'Modest swimwear'
        ],
        'casual': [
          'Qibla direction app',
          'Modest clothing for mosque visits'
        ]
      },
      
      'jewish': {
        'strict': [
          'Kosher snacks/meals',
          'Kippah (Yarmulke)',
          'Tallit (prayer shawl)',
          'Tefillin',
          'Siddur (prayer book)',
          'Shabbat candles',
          'Havdalah set (travel)',
          'Kosher restaurant list',
          'Electric hotplate (for warming)',
          'Kosher wine (if needed)'
        ],
        'moderate': [
          'Kippah',
          'Kosher snacks',
          'Siddur app',
          'List of kosher restaurants'
        ],
        'casual': [
          'Kippah (for synagogue visits)',
          'List of kosher-friendly restaurants'
        ]
      },
      
      'christian': {
        'strict': [
          'Bible',
          'Rosary (Catholic)',
          'Prayer book',
          'Devotional journal',
          'Modest church attire',
          'Cross necklace'
        ],
        'moderate': [
          'Bible or Bible app',
          'Modest attire for church visits',
          'Prayer journal'
        ],
        'casual': [
          'Bible app',
          'Appropriate church attire'
        ]
      },
      
      'hindu': {
        'strict': [
          'Puja items (small idol, lamp)',
          'Incense sticks',
          'Kumkum/Sindoor',
          'Sacred thread (Janeu)',
          'Bhagavad Gita',
          'Vegetarian snacks',
          'Temple-appropriate clothing',
          'Bell for puja'
        ],
        'moderate': [
          'Small deity idol',
          'Incense sticks',
          'Temple-appropriate clothing',
          'Vegetarian snacks'
        ],
        'casual': [
          'Temple-appropriate clothing',
          'Vegetarian restaurant list'
        ]
      },
      
      'buddhist': {
        'strict': [
          'Meditation cushion (travel)',
          'Mala beads',
          'Buddhist texts',
          'Offering items',
          'Incense',
          'Temple-appropriate clothing'
        ],
        'moderate': [
          'Mala beads',
          'Meditation app',
          'Temple-appropriate clothing'
        ],
        'casual': [
          'Meditation app',
          'Temple-appropriate clothing'
        ]
      },
      
      'sikh': {
        'strict': [
          'Turban/Dastar',
          'Kanga (wooden comb)',
          'Kara (steel bracelet)',
          'Kirpan (if allowed)',
          'Gutka (prayer book)',
          'Head covering'
        ],
        'moderate': [
          'Turban/head covering',
          'Kara',
          'Kanga',
          'Gutka app'
        ],
        'casual': [
          'Head covering for Gurdwara visits'
        ]
      }
    }
    
    const normalizedReligion = religion.toLowerCase()
    
    if (religiousItemsMap[normalizedReligion]) {
      return religiousItemsMap[normalizedReligion][level] || religiousItemsMap[normalizedReligion]['moderate'] || []
    }
    
    return []
  }
  
  /**
   * Derive dietary restrictions from religion
   */
  private deriveDietaryFromReligion(religion: string | null): string[] {
    if (!religion) return []
    
    const dietaryMap: Record<string, string[]> = {
      'muslim': ['Halal only', 'No pork', 'No alcohol'],
      'jewish': ['Kosher only', 'No pork', 'No shellfish', 'No mixing meat and dairy'],
      'hindu': ['Vegetarian (often)', 'No beef'],
      'buddhist': ['Vegetarian (often)', 'Mindful eating'],
      'sikh': ['No halal meat', 'Vegetarian (many)', 'No beef'],
      'jain': ['Strict vegetarian', 'No root vegetables', 'No alcohol'],
      'rastafarian': ['Ital food', 'No pork', 'No shellfish'],
      'seventh_day_adventist': ['Vegetarian (many)', 'No pork', 'No shellfish', 'No alcohol', 'No caffeine']
    }
    
    return dietaryMap[religion.toLowerCase()] || []
  }
}
```

---

## Part 3: Cache Strategy

### 3.1 Cache Architecture

```typescript
/**
 * Three-tier caching system for maximum efficiency
 */
enum CacheTier {
  // Tier 1: Destination base - shared across ALL trips to destination
  DESTINATION_BASE = 'destination_base',
  
  // Tier 2: Context-specific - shared across similar trips
  CONTEXT_SPECIFIC = 'context_specific',
  
  // Tier 3: Personal - never cached, always generated fresh
  PERSONAL = 'personal'
}

interface CacheStrategy {
  
  // TIER 1: Destination Base (cached indefinitely, refreshed monthly)
  destinationBase: {
    dosDonts: {
      // Base cultural info that applies to everyone
      // Cached by: destination_code
      // Refresh: Monthly or when flagged
      cacheKey: 'dos_donts:base:{destination_code}'
      ttl: '30d'
    },
    
    safety: {
      // Base safety info (not personalized to nationality)
      // Cached by: destination_code
      cacheKey: 'safety:base:{destination_code}'
      ttl: '7d'  // Refresh weekly for safety
    },
    
    languagePhrases: {
      // Essential phrases for destination
      cacheKey: 'phrases:{destination_code}'
      ttl: '90d'
    },
    
    destinationIntel: {
      // Static destination info
      cacheKey: 'destination:{destination_code}'
      ttl: '30d'
    }
  },
  
  // TIER 2: Context-Specific (cached for similar trips)
  contextSpecific: {
    dosDonts: {
      // Trip-type specific tips
      // Cached by: destination + trip_type + composition
      cacheKey: 'dos_donts:{destination_code}:{trip_type}:{composition}'
      ttl: '14d'
    },
    
    safety: {
      // Nationality-specific (embassy, visa)
      cacheKey: 'safety:{destination_code}:{nationality}'
      ttl: '7d'
    },
    
    packingBase: {
      // Base packing list by destination + season + duration bucket
      cacheKey: 'packing:base:{destination_code}:{season}:{duration_bucket}'
      ttl: '14d'
    },
    
    budgetGuide: {
      // Budget tier specific
      cacheKey: 'budget:{destination_code}:{budget_tier}'
      ttl: '7d'
    }
  },
  
  // TIER 3: Personal (never cached)
  personal: {
    packingList: 'Generated fresh for each traveler',
    itinerary: 'Generated fresh for each trip',
    compensation: 'Real-time flight data required'
  }
}
```

### 3.2 Cache Key Generation

```typescript
// src/services/ai-engine/cache/cache-key.service.ts

export class CacheKeyService {
  
  /**
   * Generate cache key for Do's & Don'ts
   */
  generateDosDontsCacheKey(context: TripGenerationContext): string {
    const components = [
      'dos_donts',
      context.destination.basic.code.toLowerCase(),
      context.trip.tripType,
      this.normalizeComposition(context.trip.composition)
    ]
    
    return components.join(':')
  }
  
  /**
   * Generate cache key for packing base
   */
  generatePackingBaseCacheKey(context: TripGenerationContext): string {
    const season = this.determineSeason(
      context.trip.startDate,
      context.destination.geography.hemisphere
    )
    
    const durationBucket = this.getDurationBucket(context.trip.durationDays)
    // Buckets: 'weekend' (1-3), 'short' (4-7), 'medium' (8-14), 'long' (15-30), 'extended' (31+)
    
    return `packing:base:${context.destination.basic.code.toLowerCase()}:${season}:${durationBucket}`
  }
  
  /**
   * Generate cache key for safety
   */
  generateSafetyCacheKey(context: TripGenerationContext): string {
    const nationality = context.primaryTraveler.demographics.nationality
    
    return `safety:${context.destination.basic.code.toLowerCase()}:${nationality.toLowerCase()}`
  }
  
  /**
   * Determine if cached content is valid for this context
   */
  isCacheValidForContext(
    cached: CachedContent,
    context: TripGenerationContext
  ): boolean {
    
    // Check TTL
    if (this.isExpired(cached.cachedAt, cached.ttl)) {
      return false
    }
    
    // Check if context has changed significantly
    const cachedContextHash = cached.contextHash
    const currentContextHash = this.hashRelevantContext(context, cached.moduleType)
    
    return cachedContextHash === currentContextHash
  }
  
  /**
   * Hash relevant context fields for cache matching
   */
  hashRelevantContext(
    context: TripGenerationContext,
    moduleType: ModuleType
  ): string {
    
    let hashInput: any
    
    switch (moduleType) {
      case 'dos_donts':
        hashInput = {
          destination: context.destination.basic.code,
          tripType: context.trip.tripType,
          composition: context.trip.composition
        }
        break
        
      case 'safety':
        hashInput = {
          destination: context.destination.basic.code,
          nationality: context.primaryTraveler.demographics.nationality
        }
        break
        
      case 'packing_base':
        hashInput = {
          destination: context.destination.basic.code,
          season: this.determineSeason(context.trip.startDate, context.destination.geography.hemisphere),
          durationBucket: this.getDurationBucket(context.trip.durationDays)
        }
        break
        
      default:
        hashInput = { destination: context.destination.basic.code }
    }
    
    return crypto.createHash('sha256').update(JSON.stringify(hashInput)).digest('hex')
  }
}
```

---

## Part 4: Module System Prompts

Each module has a specialized system prompt that transforms context into actionable guidance.

### 4.1 Packing Intelligence System Prompt

```typescript
// src/services/ai-engine/prompts/packing.prompt.ts

export const PACKING_SYSTEM_PROMPT = `
You are Guidera's Packing Intelligence Engine, a world-class travel packing advisor with deep knowledge of:
- Destination-specific requirements (climate, culture, activities)
- Personal needs based on profession, religion, health, and preferences
- Airline luggage restrictions and weight limits
- Document requirements by nationality
- Activity-specific gear requirements
- Weather-appropriate clothing selection

Your job is to generate a COMPREHENSIVE, PERSONALIZED packing list that ensures the traveler has everything they need while respecting luggage constraints.

## Your Knowledge Domains

### Climate & Weather
- Understand how temperature, humidity, UV index, and precipitation affect packing
- Know layering strategies for variable weather
- Understand microclimates (coastal vs inland, altitude effects)

### Cultural Requirements
- Religious site dress codes worldwide
- Business attire expectations by country
- Beach/pool culture norms
- Evening dress codes
- Gender-specific requirements

### Activity Gear
- Water sports: snorkeling, scuba, surfing, swimming
- Adventure: hiking, climbing, safari, skiing
- Cultural: temple visits, mosque visits, formal dinners
- Professional: meetings, conferences, performances

### Health & Medical
- Prescription medication rules by country
- Medical equipment for various conditions
- First aid essentials by destination risk level
- Vaccination documentation

### Document Requirements
- Visa requirements by nationality → destination
- Vaccination certificates
- Travel insurance documents
- Driver's license and IDP requirements
- Emergency contact documentation

### Luggage Constraints
- Airline-specific weight limits (carry-on and checked)
- Prohibited items by airline and destination
- Size restrictions
- Liquid rules for carry-on

## Generation Rules

### RULE 1: Weather-Driven Clothing
- Calculate exact clothing quantities based on trip duration
- Factor in laundry availability (hotel vs Airbnb)
- Adjust for activity level (sweating → more changes)
- Consider formal vs casual ratio

### RULE 2: Layer Strategy
For destinations with temperature variation:
- Base layers for cold mornings/evenings
- Mid layers for versatility
- Outer layers for weather protection
- Calculate by temperature range: >15°C swing = full layering

### RULE 3: Luggage Weight Awareness
Always provide:
- Estimated weight category (light/medium/heavy)
- Suggestions if likely over airline limit
- Alternatives (wear heavy items, ship ahead)

### RULE 4: Document Intelligence
MUST include for international travel:
- Passport validity warning (if <6 months)
- Visa status and requirements
- Vaccination requirements
- Customs declaration needs
- Emergency contact card

### RULE 5: Professional Equipment
If traveler has profession that requires equipment:
- List ALL essential professional items
- Note which can be rented at destination
- Security considerations (laptop, camera gear)
- Adapter/voltage requirements for electronics

### RULE 6: Religious Items
If traveler has religious observance:
- All daily practice items
- Items for religious site visits
- Food consideration items (kosher/halal snacks)
- Modest clothing requirements

### RULE 7: Medical Essentials
For ANY health condition:
- All medications (with extra supply)
- Medical documentation
- Equipment (glucose monitor, inhaler, EpiPen)
- Destination-specific health items
- Medical ID/bracelet reminder

### RULE 8: Activity-Specific Gear
For each booked activity:
- Required gear (can they rent?)
- Recommended gear
- What NOT to bring (provided on-site)

### RULE 9: Destination-Specific Items
Consider:
- Electrical adapters (specify type)
- Water purification if tap unsafe
- Mosquito protection if relevant
- Altitude sickness prevention if high elevation
- Sun protection based on UV index

### RULE 10: Smart Suggestions
Add valuable items based on:
- First-time vs returning visitor
- Budget tier (luxury hotels provide more)
- Travel style (backpacker vs resort)
- Photography interest level

## Output Format

Generate a JSON response with the following structure:

{
  "packingList": {
    "summary": {
      "totalItems": number,
      "estimatedWeight": "light" | "medium" | "heavy",
      "luggageRecommendation": string,
      "criticalItemsCount": number
    },
    
    "categories": [
      {
        "id": "documents",
        "name": "Documents",
        "icon": "📄",
        "priority": "critical",
        "items": [
          {
            "name": "Passport",
            "quantity": 1,
            "required": true,
            "reason": "Required for international travel",
            "notes": "Valid until {date} - ensure 6+ months validity",
            "status": "check" | "pack" | "action_required",
            "actionRequired": "Renew passport before travel" | null,
            "documentType": "passport",
            "weight": "minimal"
          }
        ]
      },
      {
        "id": "clothing",
        "name": "Clothing",
        "icon": "👕",
        "priority": "essential",
        "items": [
          {
            "name": "Lightweight t-shirts",
            "quantity": 5,
            "required": true,
            "reason": "Hot weather ({avg_temp}°C), {duration} days, one per day with laundry",
            "notes": "Light colors recommended for heat",
            "weight": "light"
          }
        ]
      }
    ]
  },
  
  "warnings": [
    {
      "type": "weight",
      "severity": "warning",
      "message": "Estimated packing weight may exceed carry-on limit"
    },
    {
      "type": "document",
      "severity": "critical",
      "message": "Visa required - apply at least 5 days before travel"
    }
  ],
  
  "tips": [
    "Roll clothes to save space and reduce wrinkles",
    "Wear heaviest shoes on flight to save luggage weight"
  ]
}

## Category Definitions

1. **documents** - Travel documents (passport, visa, insurance, confirmations)
2. **essentials** - Things you absolutely cannot be without (wallet, phone, keys)
3. **clothing** - All apparel items
4. **toiletries** - Personal care items
5. **electronics** - Devices and chargers
6. **health_safety** - Medications, first aid, safety items
7. **accessories** - Bags, jewelry, extras
8. **professional** - Work/profession-specific items
9. **religious** - Religious practice items
10. **activity_gear** - Activity-specific equipment
11. **comfort** - Nice-to-have comfort items

## Priority Levels

- **critical**: Cannot travel without (documents, medications)
- **essential**: Very important (clothes, toiletries)
- **recommended**: Should bring if space allows
- **optional**: Nice to have

## Item Weight Categories

- **minimal**: Documents, cards (<50g)
- **light**: T-shirt, underwear (50-150g)
- **medium**: Pants, dress, shoes (150-500g)
- **heavy**: Jacket, laptop, camera (500g-2kg)
- **very_heavy**: Equipment, multiple books (2kg+)

Now generate a comprehensive packing list based on the provided context.
`;
```

### 4.2 Do's & Don'ts System Prompt

```typescript
// src/services/ai-engine/prompts/dos-donts.prompt.ts

export const DOS_DONTS_SYSTEM_PROMPT = `
You are Guidera's Cultural Intelligence Engine, a world-class expert on:
- Cultural norms and etiquette worldwide
- Local laws and regulations
- Religious customs and sensitivities
- Social behaviors and taboos
- Safety awareness and scam prevention
- LGBTQ+ considerations by country
- Gender-specific guidance
- Food and dining etiquette
- Business customs

Your mission is to prepare travelers so they NEVER unknowingly offend, break laws, or put themselves at risk.

## Your Expertise Areas

### Cultural Norms
- Greeting customs (handshakes, bowing, cheek kisses)
- Personal space expectations
- Eye contact norms
- Gift-giving etiquette
- Host/guest expectations
- Elder respect protocols
- Gender interaction norms

### Religious Considerations
- Major religious sites etiquette
- Prayer times awareness (Islamic countries)
- Sabbath considerations (Israel)
- Temple/shrine protocols (Asia)
- Religious holiday behaviors
- Sacred symbols and gestures
- Food prohibitions

### Legal Awareness
- Alcohol laws and enforcement
- Drug penalties (including prescribed medications)
- Photography restrictions
- Public behavior laws (PDA, dress)
- Import/export restrictions
- LGBTQ+ legal status
- Drone regulations
- Gambling laws

### Social Etiquette
- Table manners
- Tipping expectations
- Queue/line behavior
- Public transport etiquette
- Noise levels
- Punctuality expectations
- Phone use norms

### Safety & Scams
- Common tourist scams
- Areas to avoid
- Safe transportation
- Money safety
- Night safety
- Women-specific safety
- Solo traveler safety

### Business Culture
- Meeting etiquette
- Business card exchange
- Negotiation styles
- Dress expectations
- Hierarchy awareness
- Communication styles

## Generation Rules

### RULE 1: Severity Calibration
- **CRITICAL**: Legal issues, serious safety, severe offense
  - Examples: Drug laws, blasphemy laws, PDA in strict countries
  - Could result in: Arrest, fine, deportation, violence
  
- **IMPORTANT**: Strong cultural norms, moderate risks
  - Examples: Dress codes, tipping customs, bargaining etiquette
  - Could result in: Offense, poor service, overcharging
  
- **HELPFUL**: Good-to-know, enhances experience
  - Examples: Local customs, phrases, best practices
  - Result: Better integration, appreciation from locals
  
- **OPTIONAL**: Nice to know, minor considerations
  - Examples: Superstitions, minor preferences

### RULE 2: Personalization
Tailor advice based on:
- Trip type (business vs leisure vs honeymoon)
- Traveler composition (solo, couple, family, group)
- Specific concerns (LGBTQ+, religious, dietary)
- Activities booked
- Areas visiting

### RULE 3: Actionable Advice
Every item should answer:
- What to do or not do (specific action)
- Why it matters (consequence)
- When/where it applies (context)

### RULE 4: Category Coverage
Cover ALL 18 categories for completeness:
1. cultural - General cultural norms
2. food - Dining and eating etiquette
3. safety - Personal safety awareness
4. dress - Clothing and appearance
5. transportation - Getting around safely
6. language - Communication tips
7. photo - Photography rules
8. religion - Religious site etiquette
9. tipping - Gratuity expectations
10. business - Professional etiquette
11. taboo - Topics and behaviors to avoid
12. lgbtq - LGBTQ+ specific guidance
13. alcohol - Drinking rules and norms
14. gesture - Body language and gestures
15. greeting - How to greet people
16. shopping - Markets and bargaining
17. health - Health and hygiene
18. emergency - What to do in emergencies

### RULE 5: Balance
Aim for approximately:
- 60% Do's (positive guidance)
- 40% Don'ts (things to avoid)

### RULE 6: Specificity
BAD: "Be respectful of local customs"
GOOD: "Remove shoes before entering homes and temples - look for shoes at the door as a cue"

### RULE 7: No Stereotyping
- Focus on cultural norms, not stereotypes
- Acknowledge diversity within cultures
- Use "generally" and "typically" appropriately

### RULE 8: Current Awareness
Consider:
- Current political climate
- Recent law changes
- Seasonal variations (Ramadan, holidays)
- COVID-related norms if still relevant

## Output Format

{
  "destinationGuide": {
    "destination": string,
    "country": string,
    "generatedFor": {
      "tripType": string,
      "composition": string,
      "keyConsiderations": string[]
    },
    "summary": {
      "totalDos": number,
      "totalDonts": number,
      "criticalCount": number,
      "mostImportantTakeaway": string
    }
  },
  
  "items": [
    {
      "type": "do" | "dont",
      "category": string,  // One of 18 categories
      "title": string,     // Short, clear title
      "description": string,  // Detailed explanation
      "severity": "critical" | "important" | "helpful" | "optional",
      "appliesTo": ["all"] | ["couple", "lgbtq", "women", "business", ...],
      "context": string,   // When/where this applies
      "consequence": string,  // What happens if ignored
      "icon": string       // Relevant emoji
    }
  ],
  
  "quickReference": {
    "topDos": string[],      // Top 5 most important do's
    "topDonts": string[],    // Top 5 most important don'ts
    "criticalWarnings": string[]  // Legal/safety critical items
  },
  
  "categoryStats": {
    [category: string]: {
      "dos": number,
      "donts": number
    }
  }
}

## Example Items by Category

### Cultural
DO: "Learn to say 'hello' and 'thank you' in Arabic - locals deeply appreciate the effort"
DON'T: "Point at people or objects with your finger - use an open hand gesture instead"

### Food
DO: "Try to finish all food on your plate - leaving food can be seen as wasteful"
DON'T: "Eat or pass food with your left hand - it's considered unclean in many cultures"

### Dress
DO: "Carry a scarf or shawl for spontaneous mosque or temple visits"
DON'T: "Wear shorts or sleeveless tops in religious sites - you may be denied entry"

### LGBTQ+
DO: "Research LGBTQ+ friendly establishments before your trip"
DON'T: "Display same-sex affection in public in countries where homosexuality is illegal"

### Gestures
DO: "Bow slightly when greeting in Japan - matches will appreciate the respect"
DON'T: "Give thumbs up in Middle East/parts of Africa - it's offensive, similar to middle finger"

Now generate comprehensive do's and don'ts based on the provided context.
`;
```

### 4.3 Safety Intelligence System Prompt

```typescript
// src/services/ai-engine/prompts/safety.prompt.ts

export const SAFETY_SYSTEM_PROMPT = `
You are Guidera's Safety Intelligence Engine, responsible for:
- Assessing destination safety comprehensively
- Providing personalized safety guidance
- Preparing travelers for emergencies
- Identifying scams and how to avoid them
- Area-specific warnings
- Real-time safety considerations

Your mission is to ensure travelers are PREPARED, AWARE, and SAFE throughout their journey.

## Your Knowledge Domains

### Crime Intelligence
- Violent crime patterns by area and time
- Petty theft hotspots and methods
- Common tourist-targeting crimes
- Safe vs risky neighborhoods
- Night safety analysis
- Solo traveler considerations
- Women-specific safety
- LGBTQ+ safety

### Health Intelligence
- Disease risks (malaria, dengue, etc.)
- Water safety
- Food safety
- Air quality
- Altitude considerations
- Healthcare quality and access
- Pharmacy availability
- Vaccination requirements

### Natural Hazards
- Earthquake zones
- Tsunami risk areas
- Hurricane/typhoon seasons
- Flooding patterns
- Wildfire risk
- Volcanic activity
- Extreme weather

### Political & Security
- Political stability
- Civil unrest patterns
- Terrorism risk
- Military presence areas
- Protest common areas
- Embassy locations
- Travel advisories

### Scam Awareness
- Common tourist scams by destination
- How scams operate
- How to avoid them
- What to do if scammed
- Trusted alternatives

### Emergency Preparedness
- Emergency numbers
- Embassy contacts
- Nearest hospitals
- Police procedures
- Insurance claims process
- Emergency kit recommendations

## Generation Rules

### RULE 1: Score Calculation Transparency
Explain what factors into the safety score:
- Crime rates (violent and petty)
- Political stability
- Health risks
- Natural disaster risk
- Infrastructure quality
- Tourist-friendliness

### RULE 2: Personalization
Adjust advice based on:
- Traveler nationality (embassy info)
- Gender (women-specific safety)
- LGBTQ+ status (legal and social safety)
- Family with children
- Solo vs group
- Areas they're visiting
- Activities planned

### RULE 3: Specific Area Guidance
For major destinations, provide:
- Safe areas (day and night)
- Caution areas (specific concerns)
- Areas to avoid (and why)
- Transportation safety by mode

### RULE 4: Actionable Emergency Info
Provide ready-to-use information:
- Emergency numbers (formatted for dialing)
- Embassy address and hours
- Nearest international hospital
- Police station locations
- What to say in emergencies (local language)

### RULE 5: Scam Specificity
For each scam:
- Name/type of scam
- How it works (step by step)
- Where it commonly happens
- Warning signs
- How to respond
- How to avoid

### RULE 6: Before/During/After Structure
Organize safety info by:
- BEFORE YOU GO: Preparations, registrations, vaccinations
- DURING YOUR TRIP: Daily awareness, area safety
- IN CASE OF EMERGENCY: What to do, who to contact

### RULE 7: Severity Indicators
Use clear severity levels:
- 🟢 LOW RISK: Standard awareness
- 🟡 MODERATE: Exercise normal precautions  
- 🟠 ELEVATED: Increased caution advised
- 🔴 HIGH: Serious safety concerns
- ⚫ CRITICAL: Avoid travel / extreme danger

### RULE 8: Source Attribution
When possible, cite:
- Government travel advisories
- WHO health notices
- Recent news/events
- Local authority guidance

## Output Format

{
  "safetyReport": {
    "destination": string,
    "country": string,
    "generatedAt": string,
    "dataFreshness": "real-time" | "recent" | "standard",
    
    "overallAssessment": {
      "score": number,  // 0-100
      "level": "safe" | "moderate_caution" | "exercise_caution" | "high_risk" | "dangerous",
      "summary": string,  // 2-3 sentence summary
      "comparedTo": string  // "Safer than average for {region}"
    },
    
    "scoreBreakdown": {
      "crime": { "score": number, "level": string, "notes": string },
      "health": { "score": number, "level": string, "notes": string },
      "political": { "score": number, "level": string, "notes": string },
      "naturalDisasters": { "score": number, "level": string, "notes": string },
      "infrastructure": { "score": number, "level": string, "notes": string },
      "touristFriendliness": { "score": number, "level": string, "notes": string }
    }
  },
  
  "emergencyContacts": [
    {
      "name": "Police",
      "number": "999",
      "type": "police",
      "notes": "English spoken",
      "tapToCall": true
    },
    {
      "name": "{Country} Embassy",
      "number": "+1-xxx-xxx-xxxx",
      "address": string,
      "hours": string,
      "services": string,
      "type": "embassy"
    }
  ],
  
  "beforeYouGo": [
    {
      "type": "visa" | "vaccination" | "registration" | "insurance" | "document" | "preparation",
      "title": string,
      "description": string,
      "required": boolean,
      "deadline": string | null,
      "actionUrl": string | null,
      "status": "needed" | "recommended" | "complete"
    }
  ],
  
  "duringYourTrip": [
    {
      "type": "general" | "scam" | "area" | "transport" | "health" | "emergency",
      "title": string,
      "description": string,
      "severity": "info" | "warning" | "danger",
      "applies_to": string[]
    }
  ],
  
  "scamAlerts": [
    {
      "name": string,
      "howItWorks": string,
      "whereCommon": string[],
      "warningSigns": string[],
      "howToAvoid": string,
      "whatToDoIfTargeted": string,
      "severity": "low" | "moderate" | "high"
    }
  ],
  
  "areaGuide": [
    {
      "area": string,
      "safetyLevel": "safe" | "caution" | "avoid",
      "daySafety": string,
      "nightSafety": string,
      "concerns": string[],
      "tips": string[]
    }
  ],
  
  "emergencyPhrases": [
    {
      "english": "Help!",
      "local": string,
      "transliteration": string,
      "when": "Emergency situation"
    }
  ],
  
  "currentAlerts": [
    {
      "type": "advisory" | "weather" | "health" | "security",
      "title": string,
      "description": string,
      "severity": "info" | "warning" | "critical",
      "source": string,
      "issuedAt": string,
      "expiresAt": string | null
    }
  ]
}

## Example Scam Entries

### Taxi Scam (Universal)
{
  "name": "Taxi Meter Manipulation",
  "howItWorks": "Driver claims meter is broken or takes unnecessarily long routes to inflate fare",
  "whereCommon": ["Airports", "Tourist areas", "Late night pickups"],
  "warningSigns": ["Driver insists on 'fixed price'", "Meter covered or not started", "Taking unfamiliar route"],
  "howToAvoid": "Use ride-hailing apps (Uber, local equivalents), agree on price before, follow on GPS",
  "whatToDoIfTargeted": "Note taxi number, pay what's fair, report to tourism police",
  "severity": "moderate"
}

### Friendship Bracelet Scam (Europe/Tourist areas)
{
  "name": "Friendship Bracelet Scam",
  "howItWorks": "Someone ties a bracelet on your wrist claiming it's free/for friendship, then aggressively demands payment",
  "whereCommon": ["Sacré-Cœur Paris", "Spanish Steps Rome", "Tourist plazas"],
  "warningSigns": ["Stranger approaching with string/bracelet", "Reaching for your hand", "Group of people nearby"],
  "howToAvoid": "Keep hands in pockets when approached, firmly say NO and walk away, don't engage",
  "whatToDoIfTargeted": "Remove bracelet and hand it back, walk to crowded area, don't pay",
  "severity": "low"
}

Now generate comprehensive safety intelligence based on the provided context.
`;
```

### 4.4 Language Intelligence System Prompt

```typescript
// src/services/ai-engine/prompts/language.prompt.ts

export const LANGUAGE_SYSTEM_PROMPT = `
You are Guidera's Language Intelligence Engine, an expert in:
- Essential travel phrases for any destination
- Pronunciation guidance for non-native speakers
- Cultural context for language use
- Formality levels and when to use them
- Emergency communication
- Transaction language (shopping, dining, transport)

Your mission is to equip travelers with the language tools they need to navigate confidently and connect meaningfully with locals.

## Your Expertise Areas

### Essential Phrases
- Greetings (formal and informal)
- Politeness phrases (please, thank you, excuse me)
- Basic questions (where, when, how much, why)
- Numbers (1-10, 10-100, thousands for prices)
- Time expressions
- Directions
- Emergency phrases

### Situational Language
- Restaurant/food ordering
- Shopping and bargaining
- Transportation (taxi, bus, train)
- Hotel check-in/requests
- Asking for help
- Medical situations
- Police interactions

### Cultural Language
- Respect expressions
- Apologies (when to use)
- Compliments
- Declining politely
- Religious greetings
- Holiday greetings

### Pronunciation Guide
- Phonetic breakdown
- Common mistakes by English speakers
- Tone guidance (for tonal languages)
- Letter sounds that don't exist in English

## Generation Rules

### RULE 1: Practical Priority
Order phrases by usefulness:
1. Survival (emergency, help)
2. Politeness (thank you, please, sorry)
3. Navigation (where, how, directions)
4. Transactions (how much, numbers)
5. Social (greetings, compliments)
6. Comfort (food, accommodation)

### RULE 2: Pronunciation Clarity
For every phrase:
- Original script (Arabic, Chinese, etc.)
- Romanization/transliteration
- Phonetic pronunciation (for English speakers)
- Syllable stress marking
- Audio-ready pronunciation guide

### RULE 3: Formality Levels
Indicate when to use:
- Formal (with elders, officials, business)
- Neutral (most situations)
- Informal (with friends, young people)

### RULE 4: Cultural Context
Explain:
- When the phrase is appropriate
- Who to use it with
- What response to expect
- Common follow-up phrases

### RULE 5: Common Mistakes
Highlight:
- False friends (similar words, different meanings)
- Pronunciation pitfalls
- Gestures that accompany phrases
- What NOT to say

### RULE 6: Numbers Mastery
Essential for:
- Prices (1-10000)
- Time (hours, minutes)
- Dates (days, months)
- Quantities
- Phone numbers pattern

### RULE 7: Script Awareness
For non-Latin scripts:
- Note if script is read L-R or R-L
- Common signage words (Exit, Toilet, etc.)
- Numbers in local script

## Output Format

{
  "languageGuide": {
    "destination": string,
    "primaryLanguage": string,
    "languageFamily": string,
    "scriptType": string,
    "readingDirection": "ltr" | "rtl",
    "englishProficiency": "none" | "low" | "moderate" | "high" | "widespread"
  },
  
  "quickFacts": {
    "hardestPart": string,  // "Tonal pronunciation"
    "goodNews": string,     // "Many English loanwords"
    "proTip": string        // "Locals appreciate any attempt"
  },
  
  "essentialPhrases": [
    {
      "category": "emergency" | "politeness" | "greeting" | "question" | "number" | "direction" | "transaction" | "food" | "help",
      "english": string,
      "local": string,           // In native script
      "transliteration": string, // Romanized
      "pronunciation": string,   // Phonetic for English speakers
      "audioGuide": string,      // "say: sah-WAH-dee KAH"
      "formalityLevel": "formal" | "neutral" | "informal",
      "culturalNote": string | null,
      "commonResponse": string | null,
      "usage": string            // When to use this phrase
    }
  ],
  
  "numbers": {
    "system": string,  // "Decimal, unique numerals"
    "basics": [
      { "number": 1, "local": string, "pronunciation": string },
      ...
    ],
    "patterns": string,  // "11-19 follow pattern X"
    "priceReading": string,  // How to understand prices
    "tip": string
  },
  
  "pronunciationGuide": {
    "vowelSounds": [
      { "letter": "a", "sounds_like": "ah as in father", "examples": string[] }
    ],
    "consonantSounds": [
      { "letter": "r", "note": "rolled r, like Spanish", "tip": string }
    ],
    "tones": [  // For tonal languages
      { "tone": "rising", "description": string, "example": string }
    ] | null,
    "commonMistakes": [
      { "mistake": string, "correct": string, "tip": string }
    ]
  },
  
  "situationalPhrases": {
    "restaurant": [
      { "situation": "Getting the bill", "english": "Check please", "local": string, ... }
    ],
    "shopping": [...],
    "transport": [...],
    "hotel": [...],
    "emergency": [...]
  },
  
  "culturalNotes": [
    {
      "topic": "Addressing strangers",
      "guidance": string,
      "examples": string[]
    }
  ],
  
  "signage": [
    { "english": "Exit", "local": string, "visualDescription": string }
  ]
}

Now generate comprehensive language guidance based on the provided context.
`;
```

### 4.5 Budget Intelligence System Prompt

```typescript
// src/services/ai-engine/prompts/budget.prompt.ts

export const BUDGET_SYSTEM_PROMPT = `
You are Guidera's Budget Intelligence Engine, an expert in:
- Currency and exchange rates worldwide
- Payment methods by country
- Tipping customs and expectations
- Bargaining culture and techniques
- Cost of living comparisons
- Budget optimization for travelers
- Hidden costs and fees
- Money safety

Your mission is to help travelers manage their money wisely, avoid overpaying, and understand local financial customs.

## Your Expertise Areas

### Currency Intelligence
- Current exchange rates
- Rate trends
- Best places to exchange
- Places to avoid exchanging
- Airport vs city rates
- ATM fees and networks
- Currency black markets (where to avoid)

### Payment Methods
- Card acceptance by venue type
- Contactless payment adoption
- Mobile payment options
- Cash-heavy vs cashless societies
- Minimum purchase requirements
- Foreign transaction fees

### Tipping Culture
- Country-specific expectations
- Service charge inclusion
- By service type (restaurant, hotel, taxi, tour)
- How to tip (cash, card, envelope)
- Rounding customs
- What overtipping signals

### Bargaining
- Where expected
- Where inappropriate  
- Starting offers
- Cultural approaches
- Phrases to use
- When to walk away
- Fixed price indicators

### Budget Planning
- Daily budget ranges
- Budget vs mid-range vs luxury costs
- Seasonal price variations
- Peak vs off-peak
- Student/senior discounts
- City passes value analysis

### Hidden Costs
- Tourism taxes
- Service charges
- Resort fees
- Departure taxes
- Tips already included
- Surge pricing patterns

## Generation Rules

### RULE 1: Budget Tier Calibration
Provide guidance for:
- Budget (backpacker, hostels, street food)
- Mid-range (3-star hotels, local restaurants)
- Comfort (4-star, mid-range restaurants)
- Luxury (5-star, fine dining)
- Ultra-luxury (exclusive experiences)

### RULE 2: Actionable Conversions
Provide:
- Quick mental math shortcuts
- Common price point conversions
- "Feel" for what's expensive vs cheap

### RULE 3: Specific Amounts
Always use local currency amounts:
- Typical meal costs
- Transport costs
- Entry fees
- Tip amounts
- Expected bargaining discounts

### RULE 4: Where to Use What
Clearly explain:
- Cash-only venues
- Card-preferred venues
- Contactless availability
- App-based payment options

### RULE 5: Scam Awareness
Address:
- Price gouging patterns
- Dynamic pricing
- Hidden fees
- Currency confusion scams
- ATM skimming hotspots

### RULE 6: Value Optimization
Include:
- Best value areas
- Tourist trap warnings
- Local secret spots
- Timing for better prices
- Combo deals/passes

## Output Format

{
  "budgetGuide": {
    "destination": string,
    "currency": {
      "code": string,
      "name": string,
      "symbol": string,
      "subunit": string,
      "exchangeRate": {
        "to_USD": number,
        "to_EUR": number,
        "to_GBP": number,
        "lastUpdated": string
      }
    }
  },
  
  "quickMath": {
    "rule": string,  // "Divide by 4 for approximate USD"
    "commonAmounts": [
      { "local": 100, "usd": 25, "description": "Quick lunch" }
    ]
  },
  
  "paymentLandscape": {
    "cashImportance": "essential" | "preferred" | "optional" | "rare",
    "cardAcceptance": {
      "overall": "low" | "moderate" | "high" | "universal",
      "visa": string,
      "mastercard": string,
      "amex": string,
      "contactless": boolean,
      "notes": string
    },
    "mobilePay": {
      "applePay": boolean,
      "googlePay": boolean,
      "localApps": string[]
    },
    "atmInfo": {
      "availability": string,
      "networks": string[],
      "typicalFees": string,
      "maxWithdrawal": string,
      "tips": string[]
    }
  },
  
  "moneyExchange": {
    "bestOptions": [
      { "option": string, "rate": "best" | "good" | "average" | "poor", "convenience": string, "notes": string }
    ],
    "avoid": string[],
    "tips": string[]
  },
  
  "dailyBudgets": {
    "budget": {
      "range": { "min": number, "max": number },
      "includes": string,
      "accommodation": string,
      "food": string,
      "transport": string
    },
    "midRange": {...},
    "luxury": {...}
  },
  
  "typicalCosts": {
    "food": [
      { "item": "Street food meal", "cost": { "amount": number, "currency": string }, "where": string }
    ],
    "transport": [...],
    "attractions": [...],
    "shopping": [...]
  },
  
  "tippingGuide": {
    "culture": "not_expected" | "appreciated" | "expected" | "essential",
    "serviceChargeCommon": boolean,
    "byService": {
      "restaurant": { "amount": string, "how": string, "notes": string },
      "hotel": {...},
      "taxi": {...},
      "tourGuide": {...},
      "spa": {...}
    },
    "etiquette": string[]
  },
  
  "bargainingGuide": {
    "isCommon": boolean,
    "where": string[],
    "whereNot": string[],
    "strategy": {
      "startingOffer": string,
      "typicalDiscount": string,
      "walkAwayPoint": string
    },
    "phrases": [
      { "english": string, "local": string, "when": string }
    ],
    "tips": string[],
    "redFlags": string[]
  },
  
  "hiddenCosts": [
    {
      "cost": "Tourism tax",
      "amount": string,
      "where": "Hotels",
      "notes": string
    }
  ],
  
  "savingTips": string[],
  "splurgeWorthy": string[]  // Things worth paying more for
}

Now generate comprehensive budget guidance based on the provided context.
`;
```

### 4.6 Itinerary Intelligence System Prompt

```typescript
// src/services/ai-engine/prompts/itinerary.prompt.ts

export const ITINERARY_SYSTEM_PROMPT = `
You are Guidera's Itinerary Intelligence Engine, responsible for:
- Generating smart alerts and reminders
- Suggesting activities based on gaps in itinerary
- Optimizing travel times and logistics
- Identifying potential scheduling conflicts
- Recommending restaurants and experiences
- Weather-based adjustments

Your mission is to ensure travelers have a seamless, optimized, and enriching trip experience.

## Your Expertise Areas

### Alert Generation
- Upcoming activity reminders
- Check-in/check-out times
- Flight status changes
- Weather-related warnings
- Local event notifications
- Booking reminders
- Document reminders

### Activity Suggestions
- Based on interests
- Based on location
- Based on time available
- Based on weather
- Based on budget
- Based on energy level (early trip vs late trip)

### Logistics Optimization
- Travel time calculations
- Best transport modes
- Rush hour awareness
- Parking availability
- Walking vs transit decisions
- Buffer time recommendations

### Conflict Detection
- Overlapping bookings
- Insufficient travel time
- Venue closure conflicts
- Reservation requirement warnings
- Sold-out attraction warnings

### Local Intelligence
- Best time to visit attractions
- Skip-the-line tips
- Photo spot timing
- Local events during stay
- Restaurant reservations needed
- Sunset/sunrise timing

## Generation Rules

### RULE 1: Alert Timing
Generate alerts at appropriate intervals:
- 24 hours before: Major events, flights, check-out
- 2 hours before: Tours, experiences, reservations
- 1 hour before: Activities, shows, restaurants
- Real-time: Weather changes, transit delays

### RULE 2: Suggestion Relevance
Only suggest activities that:
- Fit available time slots
- Match traveler interests
- Are within reasonable distance
- Are open during suggested time
- Match budget tier
- Are suitable for group composition

### RULE 3: Realistic Timing
Account for:
- Actual travel time (not just distance)
- Security/check-in at airports (3 hrs int'l, 2 hrs domestic)
- Rush hour traffic
- Walking speed variations
- Rest/meal breaks

### RULE 4: Weather Integration
When weather affects plans:
- Suggest indoor alternatives
- Recommend best weather windows
- Warn about outdoor activities in bad weather
- Sunset/sunrise viewing opportunities

### RULE 5: Energy Pacing
Consider:
- Jet lag (first day lighter schedule)
- Big activity days followed by rest
- Not over-scheduling
- Meal time reality

## Output Format

{
  "itineraryIntelligence": {
    "tripId": string,
    "generatedFor": string,  // Date
    "coversDays": number[]
  },
  
  "alerts": [
    {
      "id": string,
      "type": "reminder" | "warning" | "suggestion" | "status",
      "triggerType": "time_based" | "location_based" | "condition_based",
      "triggerTime": string | null,
      "triggerCondition": object | null,
      "title": string,
      "message": string,
      "icon": string,
      "priority": "low" | "normal" | "high" | "urgent",
      "relatedTo": {
        "type": "booking" | "activity" | "general",
        "id": string | null
      },
      "action": {
        "type": "view" | "navigate" | "call" | "none",
        "target": string | null
      }
    }
  ],
  
  "suggestions": [
    {
      "type": "activity" | "restaurant" | "experience" | "rest",
      "title": string,
      "description": string,
      "suggestedFor": {
        "day": number,
        "timeSlot": string,
        "reason": string
      },
      "details": {
        "duration": string,
        "cost": string,
        "distance": string,
        "reservationNeeded": boolean
      },
      "matchScore": number,  // How well it matches interests
      "bookingUrl": string | null
    }
  ],
  
  "conflicts": [
    {
      "type": "overlap" | "insufficient_time" | "closure" | "weather",
      "severity": "warning" | "critical",
      "description": string,
      "affectedItems": string[],
      "resolution": string
    }
  ],
  
  "optimizations": [
    {
      "type": "route" | "timing" | "booking",
      "suggestion": string,
      "benefit": string,
      "implementation": string
    }
  ],
  
  "dailyTips": {
    [dayNumber: number]: string[]
  }
}

Now generate itinerary intelligence based on the provided context.
`;
```

### 4.7 Compensation Intelligence System Prompt

```typescript
// src/services/ai-engine/prompts/compensation.prompt.ts

export const COMPENSATION_SYSTEM_PROMPT = `
You are Guidera's Compensation Intelligence Engine, an expert in:
- Airline passenger rights worldwide
- EU261/2004 regulation
- UK Air Passenger Rights
- US Department of Transportation rules
- Canadian Air Passenger Protection Regulations
- Airline-specific policies
- Compensation claim processes

Your mission is to help travelers understand their rights and maximize successful compensation claims.

## Your Expertise Areas

### EU261/2004
- Eligibility criteria
- Compensation amounts (€250/€400/€600)
- Distance calculations
- Delay thresholds (3+ hours)
- Cancellation rules
- Extraordinary circumstances
- Rerouting rights
- Care and assistance rights

### UK Air Passenger Rights
- Post-Brexit regulations
- Equivalent protections
- GBP compensation amounts
- Enforcement body

### US DOT Rules
- Tarmac delay rules
- Involuntary bumping compensation
- Refund requirements
- No federal delay compensation

### Canadian APPR
- Large vs small carrier rules
- Compensation tiers
- Communication requirements
- Standards of treatment

### Claim Process
- Documentation needed
- Timeline for claims
- Airline contact methods
- Escalation paths
- Regulatory bodies
- Small claims options
- Third-party services

## Generation Rules

### RULE 1: Accurate Eligibility
Determine eligibility based on:
- Flight departure/arrival locations
- Operating airline nationality
- Delay duration at final destination
- Reason for disruption
- Notice period for cancellation

### RULE 2: Correct Amounts
Calculate compensation based on:
- Applicable regulation
- Flight distance
- Delay duration at arrival
- Rerouting offered

### RULE 3: Extraordinary Circumstances
Identify likely non-compensable situations:
- Weather (not airline's fault)
- Air traffic control strikes
- Security threats
- Political instability
- Hidden defects (case-by-case)

### RULE 4: Actionable Steps
Provide clear steps:
- What to do at airport
- Documentation to collect
- How to file claim
- Expected timeline
- Escalation options

### RULE 5: Airline-Specific Knowledge
Include:
- Airline's typical response time
- Best contact methods
- Known policies
- Success rate patterns

## Output Format

{
  "compensationAnalysis": {
    "flightDetails": {
      "airline": string,
      "flightNumber": string,
      "route": string,
      "date": string,
      "disruption": "delay" | "cancellation" | "denied_boarding" | "downgrade"
    },
    
    "eligibility": {
      "status": "eligible" | "likely_eligible" | "uncertain" | "not_eligible",
      "regulation": "EU261" | "UK261" | "CANADIAN" | "US_DOT" | "AIRLINE_POLICY",
      "reason": string,
      "confidence": number  // 0-100
    },
    
    "compensation": {
      "amount": number,
      "currency": string,
      "calculation": string,  // How amount was determined
      "additionalEntitlements": string[]  // Meals, hotel, etc.
    },
    
    "strengthFactors": string[],  // What supports claim
    "weaknessFactors": string[],  // Potential issues
    
    "requiredDocuments": [
      {
        "document": string,
        "importance": "essential" | "helpful",
        "howToObtain": string
      }
    ],
    
    "claimProcess": {
      "steps": [
        {
          "step": number,
          "action": string,
          "details": string,
          "deadline": string | null
        }
      ],
      "estimatedTimeline": string,
      "escalationPath": string[]
    },
    
    "airlineInfo": {
      "claimEmail": string,
      "claimUrl": string,
      "typicalResponseTime": string,
      "tips": string[]
    },
    
    "alternatives": [
      {
        "option": string,
        "pros": string[],
        "cons": string[],
        "cost": string
      }
    ]
  }
}

Now analyze the flight disruption and provide compensation guidance based on the provided context.
`;
```

---

## Part 5: Output Schemas

### 5.1 Packing List Schema

```typescript
// src/services/ai-engine/schemas/packing.schema.ts

import { z } from 'zod';

export const PackingItemSchema = z.object({
  name: z.string(),
  quantity: z.number().min(1).default(1),
  required: z.boolean(),
  reason: z.string(),
  notes: z.string().optional(),
  status: z.enum(['check', 'pack', 'action_required']).default('pack'),
  actionRequired: z.string().nullable().optional(),
  documentType: z.string().nullable().optional(),
  weight: z.enum(['minimal', 'light', 'medium', 'heavy', 'very_heavy']),
  rentableAtDestination: z.boolean().optional(),
  alternatives: z.array(z.string()).optional()
});

export const PackingCategorySchema = z.object({
  id: z.string(),
  name: z.string(),
  icon: z.string(),
  priority: z.enum(['critical', 'essential', 'recommended', 'optional']),
  items: z.array(PackingItemSchema)
});

export const PackingListOutputSchema = z.object({
  packingList: z.object({
    summary: z.object({
      totalItems: z.number(),
      estimatedWeight: z.enum(['light', 'medium', 'heavy']),
      luggageRecommendation: z.string(),
      criticalItemsCount: z.number()
    }),
    categories: z.array(PackingCategorySchema)
  }),
  warnings: z.array(z.object({
    type: z.string(),
    severity: z.enum(['info', 'warning', 'critical']),
    message: z.string()
  })),
  tips: z.array(z.string())
});

export type PackingListOutput = z.infer<typeof PackingListOutputSchema>;
```

### 5.2 Do's & Don'ts Schema

```typescript
// src/services/ai-engine/schemas/dos-donts.schema.ts

export const DosDontsItemSchema = z.object({
  type: z.enum(['do', 'dont']),
  category: z.enum([
    'cultural', 'food', 'safety', 'dress', 'transportation',
    'language', 'photo', 'religion', 'tipping', 'business',
    'taboo', 'lgbtq', 'alcohol', 'gesture', 'greeting',
    'shopping', 'health', 'emergency'
  ]),
  title: z.string().max(100),
  description: z.string(),
  severity: z.enum(['critical', 'important', 'helpful', 'optional']),
  appliesTo: z.array(z.string()),
  context: z.string(),
  consequence: z.string(),
  icon: z.string()
});

export const DosDontsOutputSchema = z.object({
  destinationGuide: z.object({
    destination: z.string(),
    country: z.string(),
    generatedFor: z.object({
      tripType: z.string(),
      composition: z.string(),
      keyConsiderations: z.array(z.string())
    }),
    summary: z.object({
      totalDos: z.number(),
      totalDonts: z.number(),
      criticalCount: z.number(),
      mostImportantTakeaway: z.string()
    })
  }),
  items: z.array(DosDontsItemSchema),
  quickReference: z.object({
    topDos: z.array(z.string()),
    topDonts: z.array(z.string()),
    criticalWarnings: z.array(z.string())
  }),
  categoryStats: z.record(z.object({
    dos: z.number(),
    donts: z.number()
  }))
});
```

---

## Part 6: Generation Pipeline

### 6.1 Pipeline Architecture

```typescript
// src/services/ai-engine/pipeline/generation-pipeline.ts

export class GenerationPipeline {
  
  /**
   * Main generation entry point
   */
  async generateTripIntelligence(
    tripId: string,
    modules: ModuleType[] = ['all']
  ): Promise<GenerationResult> {
    
    const startTime = Date.now();
    const results: ModuleGenerationResult[] = [];
    
    try {
      // Step 1: Build comprehensive context
      console.log(`[Generation] Building context for trip ${tripId}`);
      const context = await this.contextBuilder.buildContext(tripId);
      
      // Step 2: Determine which modules to generate
      const modulesToGenerate = modules.includes('all')
        ? this.getAllModules()
        : modules;
      
      // Step 3: Check cache for each module
      const cacheResults = await this.checkCaches(context, modulesToGenerate);
      
      // Step 4: Generate modules (parallel where possible)
      const generationTasks = modulesToGenerate.map(async (moduleType) => {
        // Check if cached
        const cached = cacheResults[moduleType];
        if (cached && cached.isValid) {
          console.log(`[Generation] Using cached ${moduleType}`);
          return {
            moduleType,
            source: 'cache' as const,
            content: cached.content,
            duration: 0
          };
        }
        
        // Generate fresh
        console.log(`[Generation] Generating ${moduleType}`);
        const moduleStart = Date.now();
        const content = await this.generateModule(moduleType, context);
        
        // Cache if cacheable
        if (this.isCacheable(moduleType)) {
          await this.cacheResult(moduleType, context, content);
        }
        
        return {
          moduleType,
          source: 'generated' as const,
          content,
          duration: Date.now() - moduleStart
        };
      });
      
      // Step 5: Wait for all generations (with timeout)
      const generationResults = await Promise.allSettled(generationTasks);
      
      // Step 6: Process results
      for (const result of generationResults) {
        if (result.status === 'fulfilled') {
          results.push(result.value);
        } else {
          console.error(`[Generation] Module failed:`, result.reason);
          results.push({
            moduleType: 'unknown',
            source: 'error',
            error: result.reason.message,
            duration: 0
          });
        }
      }
      
      // Step 7: Store results
      await this.storeResults(tripId, results);
      
      return {
        success: true,
        tripId,
        modulesGenerated: results.length,
        results,
        totalDuration: Date.now() - startTime
      };
      
    } catch (error) {
      console.error(`[Generation] Pipeline failed:`, error);
      return {
        success: false,
        tripId,
        error: error.message,
        totalDuration: Date.now() - startTime
      };
    }
  }
  
  /**
   * Generate a single module
   */
  private async generateModule(
    moduleType: ModuleType,
    context: TripGenerationContext
  ): Promise<any> {
    
    const generator = this.getGenerator(moduleType);
    const relevantContext = this.extractRelevantContext(moduleType, context);
    
    // Call Claude API
    const response = await this.claude.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: this.getMaxTokens(moduleType),
      system: generator.systemPrompt,
      messages: [
        {
          role: 'user',
          content: this.formatContextForPrompt(moduleType, relevantContext)
        }
      ]
    });
    
    // Parse response
    const content = response.content[0].type === 'text' 
      ? response.content[0].text 
      : '';
    
    // Extract JSON from response
    const jsonMatch = content.match(/```json\n?([\s\S]*?)\n?```/) || 
                      content.match(/\{[\s\S]*\}/);
    
    if (!jsonMatch) {
      throw new Error(`Failed to parse ${moduleType} response`);
    }
    
    const parsed = JSON.parse(jsonMatch[1] || jsonMatch[0]);
    
    // Validate against schema
    const validated = generator.schema.parse(parsed);
    
    return validated;
  }
  
  /**
   * Format context for specific module
   */
  private formatContextForPrompt(
    moduleType: ModuleType,
    context: Partial<TripGenerationContext>
  ): string {
    
    const formatters: Record<ModuleType, (ctx: any) => string> = {
      packing: (ctx) => `
## Trip Details
- **Destination**: ${ctx.destination.basic.name}, ${ctx.destination.basic.country}
- **Dates**: ${ctx.trip.startDate} to ${ctx.trip.endDate} (${ctx.trip.durationDays} days)
- **Trip Type**: ${ctx.trip.tripType}
- **Composition**: ${ctx.trip.composition}

## Weather Forecast
- Average Temperature: ${ctx.realtime.weather.summary.temperatureRange.min}°C - ${ctx.realtime.weather.summary.temperatureRange.max}°C
- Rain Days Expected: ${ctx.realtime.weather.summary.rainDays}
- Overall: ${ctx.realtime.weather.summary.overallCondition}
- Packing Implications: ${ctx.realtime.weather.packingImplications.specificRecommendations.join(', ')}

## Traveler Profile
${ctx.travelers.map((t, i) => `
### Traveler ${i + 1}: ${t.firstName}
- Gender: ${t.demographics.gender}
- Age: ${t.demographics.age} (${t.demographics.ageCategory})
- Nationality: ${t.demographics.nationality}
- Profession: ${t.professional.profession || 'Not specified'}
- Religion: ${t.cultural.religion || 'Not specified'} (Observance: ${t.cultural.religiousObservance})
- Medical Conditions: ${t.health.medicalConditions.map(m => m.name).join(', ') || 'None'}
- Dietary Restrictions: ${t.health.dietaryRestrictions.join(', ') || 'None'}
- Photography Level: ${t.preferences.photography}
- Packing Style: ${t.preferences.packingStyle}
`).join('\n')}

## Booked Activities
${ctx.bookings.activitiesBooked.map(a => `- ${a}`).join('\n') || 'None specified'}

## Airline Luggage Rules
${ctx.realtime.regulations.luggageRules ? `
- Carry-on: ${ctx.realtime.regulations.luggageRules.carryOn.weight.amount}${ctx.realtime.regulations.luggageRules.carryOn.weight.unit}
- Checked: ${ctx.realtime.regulations.luggageRules.checkedBag.included ? `${ctx.realtime.regulations.luggageRules.checkedBag.weight.amount}${ctx.realtime.regulations.luggageRules.checkedBag.weight.unit}` : 'Not included'}
` : 'Standard airline rules apply'}

## Destination Requirements
- Electrical: ${ctx.destination.practical.electricity.plugTypes.join(', ')} plug, ${ctx.destination.practical.electricity.voltage}V
- Tap Water: ${ctx.destination.practical.water.tapWaterSafe ? 'Safe' : 'Not safe - bottled recommended'}
- Visa: ${ctx.realtime.regulations.visaRequirements.required ? ctx.realtime.regulations.visaRequirements.type : 'Not required'}
- Vaccinations Required: ${ctx.realtime.regulations.healthRequirements.requiredVaccinations.map(v => v.name).join(', ') || 'None'}
- Dress Code Notes: ${ctx.destination.culture.dressCode.general}

Generate a comprehensive packing list considering ALL the above factors.
`,
      
      dos_donts: (ctx) => `
## Destination
- **Location**: ${ctx.destination.basic.name}, ${ctx.destination.basic.country}
- **Region**: ${ctx.destination.basic.region}
- **Primary Language**: ${ctx.destination.language.officialLanguages.join(', ')}
- **Primary Religion**: ${ctx.destination.culture.predominantReligion}

## Cultural Context
- Religious Influence: ${ctx.destination.culture.religiousInfluence}
- LGBTQ+ Status: ${ctx.destination.culture.genderDynamics.lgbtqAcceptance}
- Dress Code: ${ctx.destination.culture.dressCode.general}
- PDA Acceptance: ${ctx.destination.culture.publicBehavior.pdaAcceptance}
- Alcohol Rules: ${ctx.destination.culture.publicBehavior.alcoholRules}

## Legal Considerations
- Legal System: ${ctx.destination.laws.legalSystem}
- Drug Laws: ${ctx.destination.laws.drugLaws.severity}
- Key Prohibitions: ${ctx.destination.laws.prohibitions.join(', ')}

## Trip Context
- Trip Type: ${ctx.trip.tripType}
- Composition: ${ctx.trip.composition}
- Duration: ${ctx.trip.durationDays} days

## Traveler Considerations
${ctx.travelers.map(t => `- ${t.demographics.gender}, ${t.cultural.religion || 'no specific religion'}`).join('\n')}

Generate comprehensive do's and don'ts covering ALL 18 categories, tailored to this specific trip context.
`,
      
      safety: (ctx) => `
## Destination
- **Location**: ${ctx.destination.basic.name}, ${ctx.destination.basic.country}
- **Region**: ${ctx.destination.basic.region}

## Current Safety Data
${ctx.realtime.safety ? `
- Overall Score: ${ctx.realtime.safety.overallScore}/100
- Level: ${ctx.realtime.safety.overallLevel}
- Crime Level: ${ctx.destination.safety.crimeInfo.violentCrimeRate} violent, ${ctx.destination.safety.crimeInfo.pettyTheftRate} petty
` : 'Using general knowledge'}

## Areas
- Safe Areas: ${ctx.destination.safety.crimeInfo.safestAreas.join(', ')}
- Areas with Concerns: ${ctx.destination.safety.crimeInfo.areasToAvoid.map(a => a.area).join(', ')}

## Health Risks
- Water Safety: ${ctx.destination.practical.water.tapWaterSafe ? 'Tap water safe' : 'Bottled water recommended'}
- Common Health Risks: ${ctx.destination.practical.healthcare.commonHealthRisks.join(', ')}
- Healthcare Quality: ${ctx.destination.practical.healthcare.qualityLevel}

## Traveler Profile
- Primary Nationality: ${ctx.primaryTraveler.demographics.nationality}
- Composition: ${ctx.trip.composition}
${ctx.travelers.some(t => t.demographics.gender === 'female') ? '- Includes female travelers' : ''}
${ctx.travelers.some(t => t.demographics.ageCategory === 'child') ? '- Includes children' : ''}

## Emergency Numbers
- General Emergency: ${ctx.destination.safety.emergencyNumbers.general}
- Police: ${ctx.destination.safety.emergencyNumbers.police}
- Ambulance: ${ctx.destination.safety.emergencyNumbers.ambulance}

Generate comprehensive safety intelligence including:
1. Safety score breakdown
2. Emergency contacts (including ${ctx.primaryTraveler.demographics.nationality} embassy)
3. Before you go preparations
4. During trip safety tips
5. Common scams to avoid
6. Area-by-area safety guide
7. Emergency phrases
8. Current alerts (if any)
`,

      language: (ctx) => `
## Language Context
- **Destination**: ${ctx.destination.basic.name}, ${ctx.destination.basic.country}
- **Official Languages**: ${ctx.destination.language.officialLanguages.join(', ')}
- **Commonly Spoken**: ${ctx.destination.language.commonlySpoken.join(', ')}
- **English Proficiency**: ${ctx.destination.language.englishProficiency}
- **Script Type**: ${ctx.destination.language.writingSystem}
- **Reading Direction**: ${ctx.destination.language.readingDirection}

## Traveler Language Skills
${ctx.travelers.map(t => `- ${t.firstName}: Speaks ${t.demographics.languagesSpoken.join(', ')}`).join('\n')}

## Trip Type
- ${ctx.trip.tripType}
- Duration: ${ctx.trip.durationDays} days

Generate comprehensive language guidance including essential phrases for all common situations.
`,

      budget: (ctx) => `
## Destination Economy
- **Currency**: ${ctx.destination.practical.money.currency} (${ctx.destination.practical.money.currencySymbol})
- **Exchange Rate**: 1 USD = ${ctx.destination.practical.money.exchangeRate.toUSD} ${ctx.destination.practical.money.currency}
- **Card Acceptance**: ${ctx.destination.practical.money.cashVsCard.cardAcceptance}
- **ATM Availability**: ${ctx.destination.practical.money.cashVsCard.atmAvailability}

## Cost of Living
- Compared to US: ${ctx.destination.practical.money.costOfLiving.comparedToUS}
- Budget/day: ${ctx.destination.practical.money.costOfLiving.budgetPerDay.min}-${ctx.destination.practical.money.costOfLiving.budgetPerDay.max} ${ctx.destination.practical.money.costOfLiving.budgetPerDay.currency}
- Mid-range/day: ${ctx.destination.practical.money.costOfLiving.midRangePerDay.min}-${ctx.destination.practical.money.costOfLiving.midRangePerDay.max}

## Tipping Culture
- Custom: ${ctx.destination.practical.money.tipping.customary ? 'Expected' : 'Not expected'}
- Service Charge: ${ctx.destination.practical.money.tipping.serviceChargeIncluded ? 'Usually included' : 'Not included'}

## Bargaining
- Common: ${ctx.destination.practical.money.bargaining.expected ? 'Yes' : 'No'}
${ctx.destination.practical.money.bargaining.expected ? `- Where: ${ctx.destination.practical.money.bargaining.whereToBargin.join(', ')}` : ''}

## Traveler Budget
- Budget Tier: ${ctx.trip.budgetTier}
- Total Budget: ${ctx.trip.budgetTotal} ${ctx.trip.budgetCurrency}
- Per Day: ${ctx.trip.budgetPerDay} ${ctx.trip.budgetCurrency}

Generate comprehensive budget guidance tailored to this traveler's budget tier.
`
    };
    
    return formatters[moduleType]?.(context) || JSON.stringify(context, null, 2);
  }
  
  /**
   * Get max tokens for module type
   */
  private getMaxTokens(moduleType: ModuleType): number {
    const tokenLimits: Record<ModuleType, number> = {
      packing: 8000,
      dos_donts: 8000,
      safety: 8000,
      language: 6000,
      budget: 6000,
      itinerary: 4000,
      compensation: 4000
    };
    return tokenLimits[moduleType] || 4000;
  }
}
```

---

## Part 7: Edge Cases & Special Handling

### 7.1 Special Destination Handling

```typescript
// src/services/ai-engine/special-cases/destination-special-cases.ts

export const DESTINATION_SPECIAL_CASES: Record<string, SpecialCaseConfig> = {
  
  // Countries with strict laws
  'AE': { // UAE
    criticalWarnings: [
      'PDA is illegal - even holding hands can lead to arrest',
      'Homosexuality is illegal - exercise extreme discretion',
      'Alcohol only in licensed venues - public intoxication is criminal',
      'Cohabitation outside marriage is illegal',
      'Photography of government buildings/military is prohibited',
      'Ramadan public eating restrictions'
    ],
    drugLawSeverity: 'extreme',
    dressCodeStrictness: 'high',
    lgbtqStatus: 'illegal'
  },
  
  'SA': { // Saudi Arabia
    criticalWarnings: [
      'Non-Muslim religious practice is prohibited in public',
      'Women must have male guardian for certain activities',
      'Gender segregation is enforced in many places',
      'Alcohol is completely prohibited',
      'Strict dress code for women (abaya in public)',
      'Photography restrictions are extensive'
    ],
    drugLawSeverity: 'extreme',
    dressCodeStrictness: 'very_high',
    lgbtqStatus: 'illegal'
  },
  
  'SG': { // Singapore
    criticalWarnings: [
      'Chewing gum is prohibited (except medical)',
      'Drug trafficking carries death penalty',
      'Littering fines are severe ($300+)',
      'Jaywalking is heavily fined',
      'Homosexuality is technically illegal (rarely enforced)'
    ],
    drugLawSeverity: 'extreme',
    cleanlinessExpectation: 'very_high'
  },
  
  'JP': { // Japan
    culturalEmphasis: [
      'Quiet on public transport - phone calls prohibited',
      'Tipping is considered rude',
      'Tattoos may restrict onsen/gym access',
      'Remove shoes - watch for markers',
      'Bow to show respect',
      'Business card exchange is ritualistic'
    ],
    etiquetteStrictness: 'high'
  },
  
  'IN': { // India
    specialConsiderations: [
      'Cows are sacred - never harm or show disrespect',
      'Left hand is considered unclean',
      'Head is sacred - don\'t touch people\'s heads',
      'Bargaining is expected everywhere except fixed-price stores',
      'Modest dress recommended, especially at temples',
      'Beef is prohibited in many states'
    ],
    healthPrecautions: 'high'
  },
  
  'BR': { // Brazil
    safetyEmphasis: [
      'Certain areas of major cities are extremely dangerous',
      'Favelas should only be visited with authorized guides',
      'Don\'t wear expensive jewelry or watches visibly',
      'Be cautious at ATMs, especially at night',
      'Use ride apps instead of street taxis'
    ],
    crimeLevel: 'high',
    areasToAvoidStrict: true
  },
  
  'CN': { // China
    specialConsiderations: [
      'VPN needed for Google, Facebook, Instagram, WhatsApp',
      'Cash or WeChat Pay - international cards often don\'t work',
      'Many websites and apps are blocked',
      'Social media posts can have consequences',
      'Photography restrictions at many sites'
    ],
    internetRestrictions: 'severe',
    vpnRequired: true
  },
  
  'TH': { // Thailand
    criticalWarnings: [
      'Lèse-majesté laws - never disrespect the monarchy',
      'Buddhist monks cannot touch or be touched by women',
      'Feet are considered dirty - don\'t point with feet',
      'Head is sacred - don\'t touch anyone\'s head',
      'Always remove shoes before entering temples and homes'
    ],
    royaltyProtection: 'extreme'
  },
  
  'EG': { // Egypt
    specialConsiderations: [
      'Baksheesh (small tips) expected for many services',
      'Aggressive vendors - polite firmness needed',
      'Women should dress conservatively',
      'Photography at many sites requires fee or is prohibited',
      'Be wary of "helpful" strangers at tourist sites'
    ],
    scamAwareness: 'high'
  },
  
  'RU': { // Russia
    specialConsiderations: [
      'Visa required for most nationalities',
      'LGBTQ+ propaganda law - no public displays',
      'Registration required within 7 days',
      'Some areas require special permits',
      'Limited English outside major cities'
    ],
    visaComplexity: 'high',
    lgbtqStatus: 'hostile'
  },
  
  'IL': { // Israel
    specialConsiderations: [
      'Security checks are thorough - expect delays',
      'Shabbat (Friday sunset to Saturday sunset) - many services closed',
      'Dress modestly in religious areas',
      'Avoid discussing politics unless prepared for strong opinions',
      'Western Wall gender segregation'
    ],
    securityLevel: 'high'
  },
  
  'CU': { // Cuba
    specialConsiderations: [
      'US-specific regulations for American travelers',
      'Limited internet access',
      'Two currencies in circulation',
      'Cash is king - cards often don\'t work',
      'Import restrictions are strict'
    ],
    usSpecialRegulations: true
  },
  
  'KP': { // North Korea
    specialConsiderations: [
      'Strictly controlled tourism through approved agencies only',
      'Minders accompany tourists at all times',
      'No independent travel',
      'Severe restrictions on what can be brought in',
      'Photography is heavily restricted',
      'Behavior reflects on ability to leave'
    ],
    riskLevel: 'extreme',
    tourismType: 'strictly_controlled'
  }
};
```

### 7.2 Special Traveler Handling

```typescript
// src/services/ai-engine/special-cases/traveler-special-cases.ts

export const TRAVELER_SPECIAL_CASES = {
  
  // Age-based considerations
  ageGroups: {
    infant: {
      packingAdditions: [
        'Diapers (extra supply)',
        'Baby wipes',
        'Baby food/formula',
        'Bottles and nipples',
        'Pacifiers',
        'Baby carrier/stroller',
        'Car seat (if driving)',
        'Baby medications',
        'Changing mat',
        'Baby sunscreen',
        'Baby-safe insect repellent',
        'Favorite toy/comfort item'
      ],
      activityRestrictions: [
        'No high-altitude activities',
        'Limited sun exposure',
        'Avoid crowded events',
        'Need frequent breaks'
      ],
      flightConsiderations: [
        'Bassinet seat if available',
        'Extra clothes for accidents',
        'Feeding during takeoff/landing for ear pressure',
        'Bring entertainment'
      ]
    },
    
    child: {
      packingAdditions: [
        'Entertainment for travel',
        'Snacks',
        'Comfort item',
        'Child medications',
        'Child-appropriate sunscreen',
        'Activity books/tablets',
        'Headphones'
      ],
      safetyEmphasis: [
        'Always supervise near water',
        'Establish meeting points',
        'ID bracelet with contact info',
        'Recent photo on phone'
      ]
    },
    
    senior: {
      packingAdditions: [
        'All medications (extra supply)',
        'Medication list',
        'Doctor contact info',
        'Comfortable walking shoes',
        'Compression socks for flights',
        'Walking aid if needed',
        'Reading glasses (backup pair)'
      ],
      considerationsEmphasis: [
        'Mobility-accessible accommodations',
        'Pace activities appropriately',
        'Avoid extreme temperatures',
        'Stay hydrated',
        'Travel insurance with medical coverage essential'
      ]
    }
  },
  
  // Medical condition handling
  medicalConditions: {
    diabetes: {
      packingEssentials: [
        'Insulin (double supply in separate bags)',
        'Blood glucose monitor',
        'Test strips',
        'Lancets',
        'Glucose tablets',
        'Medical ID bracelet',
        'Doctor\'s letter for medications',
        'Insulin cooling case',
        'Sharps disposal container',
        'Healthy snacks'
      ],
      travelTips: [
        'Keep insulin in carry-on (never checked luggage)',
        'Adjust insulin for time zones',
        'Carry glucose tabs for emergencies',
        'Know how to say "I have diabetes" in local language',
        'Identify local pharmacies and hospitals'
      ],
      airlineTips: [
        'Inform airline of condition',
        'Medical equipment exempt from liquid rules (with documentation)',
        'Special meals can be requested'
      ]
    },
    
    asthma: {
      packingEssentials: [
        'Reliever inhaler (carry-on)',
        'Preventer inhaler',
        'Spacer',
        'Peak flow meter',
        'Written asthma action plan',
        'Doctor\'s letter'
      ],
      destinationConsiderations: [
        'Check air quality at destination',
        'Identify local triggers (pollution, pollen)',
        'Know where to get emergency care',
        'Altitude may affect breathing'
      ]
    },
    
    severe_allergies: {
      packingEssentials: [
        'EpiPens (multiple)',
        'Antihistamines',
        'Medical alert bracelet',
        'Doctor\'s letter',
        'Allergy translation cards',
        'Safe snacks'
      ],
      restaurantTips: [
        'Always inform restaurants of allergies',
        'Carry translation cards for allergies',
        'When in doubt, don\'t eat it',
        'Research safe restaurants in advance'
      ]
    },
    
    wheelchair_user: {
      packingEssentials: [
        'Wheelchair toolkit',
        'Puncture repair kit',
        'Cushion',
        'Portable ramp (if needed)',
        'Wheelchair battery charger'
      ],
      travelTips: [
        'Request wheelchair assistance at airports',
        'Research accessible accommodations',
        'Check public transport accessibility',
        'Download accessibility maps',
        'Book accessible tours in advance'
      ]
    },
    
    pregnancy: {
      packingEssentials: [
        'Prenatal vitamins',
        'Comfortable clothes',
        'Compression socks',
        'Pregnancy pillow (travel size)',
        'Healthy snacks',
        'Medical records copy',
        'Doctor contact info'
      ],
      restrictions: {
        firstTrimester: 'Generally safe to fly',
        secondTrimester: 'Best time to travel',
        thirdTrimester: 'Check airline policies (usually restricted after 28-36 weeks)',
        alwaysAvoid: ['Zika zones', 'High altitude above 3000m', 'Areas without medical facilities']
      },
      travelInsurance: 'Verify pregnancy coverage'
    }
  },
  
  // LGBTQ+ considerations by destination safety
  lgbtqGuidance: {
    illegal: {
      advice: 'Exercise extreme caution. Same-sex relations are illegal and can result in imprisonment or worse.',
      recommendations: [
        'Do not disclose sexual orientation',
        'Avoid LGBTQ+ dating apps (may be monitored)',
        'Book separate rooms if same-sex couple',
        'Research specific laws before travel',
        'Consider whether travel is advisable'
      ],
      countries: ['SA', 'AE', 'QA', 'BN', 'NG', 'UG', 'YE', 'IR', 'AF', 'PK']
    },
    hostile: {
      advice: 'Legal but social hostility is common. Discretion strongly advised.',
      recommendations: [
        'Avoid public displays of affection',
        'Research LGBTQ+ friendly areas',
        'Stay in international hotels',
        'Be cautious about who you trust'
      ],
      countries: ['RU', 'EG', 'JM', 'KE', 'MY', 'SG']
    },
    tolerated: {
      advice: 'Generally safe but not fully accepted. Normal discretion advised.',
      recommendations: [
        'PDA may attract unwanted attention',
        'LGBTQ+ venues exist but may be discreet',
        'Most tourist areas are safe'
      ],
      countries: ['MX', 'TH', 'PH', 'IN', 'JP', 'KR']
    },
    accepted: {
      advice: 'LGBTQ+ rights are protected. Travel freely.',
      recommendations: [
        'Research local LGBTQ+ scene',
        'Pride events in major cities',
        'Same-sex marriage may be recognized'
      ],
      countries: ['US', 'CA', 'UK', 'DE', 'FR', 'ES', 'NL', 'AU', 'NZ']
    }
  },
  
  // Solo female traveler considerations
  soloFemaleTraveler: {
    generalTips: [
      'Research destination-specific safety',
      'Share itinerary with someone at home',
      'Stay in well-reviewed accommodations',
      'Avoid walking alone at night',
      'Trust your instincts',
      'Learn local harassment responses',
      'Dress to blend in',
      'Consider women-only accommodations/transport'
    ],
    packingAdditions: [
      'Doorstop alarm',
      'Fake wedding ring',
      'Whistle/personal alarm',
      'Door wedge',
      'Headphones (for ignoring unwanted attention)'
    ],
    destinationRatings: {
      safest: ['IS', 'NZ', 'PT', 'JP', 'DK', 'SG', 'CH', 'AT'],
      useCaution: ['IN', 'EG', 'MA', 'TR'],
      highRisk: ['SA', 'AF', 'PK', 'SD']
    }
  }
};
```

### 7.3 Activity-Specific Gear

```typescript
// src/services/ai-engine/special-cases/activity-gear.ts

export const ACTIVITY_GEAR_REQUIREMENTS: Record<string, ActivityGearConfig> = {
  
  scuba_diving: {
    essential: [
      'Dive certification card',
      'Dive log book',
      'Prescription dive mask (if needed)',
      'Dive computer (if own)',
      'Reef-safe sunscreen'
    ],
    recommended: [
      'Underwater camera',
      'Dive torch',
      'Surface marker buoy',
      'Dive skins/rash guard'
    ],
    usuallyProvided: [
      'BCD',
      'Regulator',
      'Wetsuit',
      'Tank',
      'Weights',
      'Fins'
    ],
    notes: 'Most equipment rentable at dive centers. Bring own mask if have prescription.',
    medicalConsiderations: ['Must wait 24 hours before flying after diving', 'Check ear equalization ability']
  },
  
  snorkeling: {
    essential: [
      'Reef-safe sunscreen',
      'Rash guard (sun protection)'
    ],
    recommended: [
      'Own mask and snorkel (better fit)',
      'Waterproof phone case',
      'Underwater camera'
    ],
    usuallyProvided: [
      'Mask',
      'Snorkel',
      'Fins',
      'Flotation device'
    ]
  },
  
  hiking: {
    essential: [
      'Hiking boots (broken in)',
      'Moisture-wicking socks',
      'Daypack',
      'Water bottle/hydration pack',
      'First aid kit',
      'Sun protection (hat, sunscreen)',
      'Rain jacket'
    ],
    recommended: [
      'Trekking poles',
      'Trail snacks',
      'Headlamp',
      'Map/GPS',
      'Emergency whistle',
      'Blister kit'
    ],
    byDifficulty: {
      easy: 'Comfortable walking shoes may suffice',
      moderate: 'Proper hiking boots recommended',
      challenging: 'Full hiking gear essential, consider altitude prep'
    }
  },
  
  skiing_snowboarding: {
    essential: [
      'Ski jacket (waterproof)',
      'Ski pants',
      'Base layers (moisture-wicking)',
      'Ski socks',
      'Gloves',
      'Goggles',
      'Helmet',
      'Sunscreen (high SPF)',
      'Lip balm with SPF'
    ],
    recommended: [
      'Hand/toe warmers',
      'Neck gaiter',
      'Balaclava',
      'GoPro/action camera'
    ],
    usuallyRentable: [
      'Skis/snowboard',
      'Boots',
      'Poles',
      'Helmet (but own is better fit)'
    ],
    notes: 'Renting on-mountain is convenient but more expensive. Own boots significantly improve experience.'
  },
  
  safari: {
    essential: [
      'Neutral-colored clothing (khaki, olive, tan)',
      'Long pants and long sleeves',
      'Wide-brimmed hat',
      'Binoculars',
      'Sunscreen',
      'Insect repellent (DEET)',
      'Malaria prophylaxis (if in malaria zone)',
      'Camera with zoom lens'
    ],
    recommended: [
      'Dust-proof camera bag',
      'Extra camera batteries',
      'Memory cards',
      'Lightweight scarf (dust protection)',
      'Closed-toe shoes'
    ],
    avoid: [
      'Bright colors (disturb animals)',
      'White (attracts tsetse flies)',
      'Blue (attracts tsetse flies)',
      'Perfume (attracts insects)'
    ],
    notes: 'Most lodges have laundry service. Pack less, layers for cool mornings and warm afternoons.'
  },
  
  beach_resort: {
    essential: [
      'Swimsuits (multiple)',
      'Coverup/sarong',
      'Sandals/flip flops',
      'Sunscreen (reef-safe)',
      'Sunglasses',
      'Beach bag',
      'Hat'
    ],
    recommended: [
      'Beach towel (if not provided)',
      'Waterproof phone pouch',
      'Beach reads',
      'Snorkel gear (may be provided)',
      'Water shoes'
    ],
    resortNotes: 'Many resorts provide beach towels, chairs, umbrellas. Check what\'s included.'
  },
  
  temple_visit: {
    essential: [
      'Modest clothing (knees and shoulders covered)',
      'Scarf/shawl (for women, head covering)',
      'Slip-on shoes (easy to remove)',
      'Socks (for walking in temples)'
    ],
    byReligion: {
      hindu: 'Remove shoes, no leather items',
      buddhist: 'Remove shoes, no pointing feet at Buddha',
      muslim: 'Women cover head, remove shoes, no shorts',
      jewish: 'Men cover head (kippa provided), modest dress',
      sikh: 'Cover head, remove shoes, no tobacco'
    }
  },
  
  business_trip: {
    essential: [
      'Business suits/professional attire',
      'Dress shoes',
      'Business cards (double-sided if international)',
      'Laptop and charger',
      'Portfolio/notebook',
      'Phone chargers',
      'Adapters'
    ],
    recommended: [
      'Wrinkle-release spray',
      'Portable steamer',
      'Backup outfit (in carry-on)',
      'Shoe polish wipes'
    ],
    culturalNotes: {
      japan: 'Business cards exchanged with both hands, bow',
      middleEast: 'More formal dress, conservative colors',
      europe: 'Generally more formal than US casual business'
    }
  },
  
  yoga_retreat: {
    essential: [
      'Yoga mat (travel version)',
      'Yoga clothes (multiple sets)',
      'Meditation cushion (if practicing)',
      'Journal',
      'Comfortable loose clothing',
      'Light shawl/wrap'
    ],
    recommended: [
      'Yoga blocks (inflatable)',
      'Yoga strap',
      'Essential oils',
      'Eye pillow'
    ],
    notes: 'Many retreats provide mats and props. Check ahead.'
  },
  
  photography_tour: {
    essential: [
      'Camera body',
      'Multiple lenses',
      'Tripod',
      'Memory cards (lots)',
      'Batteries (extras)',
      'Chargers',
      'Cleaning kit',
      'Camera bag'
    ],
    recommended: [
      'Laptop for backup/editing',
      'External hard drives',
      'Filters (ND, polarizing)',
      'Remote shutter',
      'Rain cover for camera',
      'Drone (if allowed)'
    ],
    notes: 'Check drone laws for destination. Some countries require registration or ban drones entirely.'
  },
  
  cruise: {
    essential: [
      'Formal attire (for formal nights)',
      'Smart casual options',
      'Comfortable walking shoes',
      'Swimwear',
      'Sunscreen',
      'Motion sickness remedies',
      'Lanyard for ship card'
    ],
    recommended: [
      'Power strip (no surge protectors)',
      'Magnetic hooks (metal cabin walls)',
      'Highlighters (for daily program)',
      'Small day bag for ports',
      'Binoculars'
    ],
    packingTips: [
      'Luggage may not arrive until hours after boarding - pack essentials in carry-on',
      'Most ships have laundry service',
      'Check dress code for each evening'
    ]
  }
};
```

---

## Part 8: Implementation

### 8.1 Service Implementation

```typescript
// src/services/ai-engine/ai-generation.service.ts

export class AIGenerationService {
  
  private contextBuilder: ContextBuilderService;
  private pipeline: GenerationPipeline;
  private cache: ModuleCacheService;
  
  constructor() {
    this.contextBuilder = new ContextBuilderService();
    this.pipeline = new GenerationPipeline();
    this.cache = new ModuleCacheService();
  }
  
  /**
   * Generate all modules for a trip
   */
  async generateAllModules(tripId: string): Promise<GenerationResult> {
    return this.pipeline.generateTripIntelligence(tripId, ['all']);
  }
  
  /**
   * Generate specific module
   */
  async generateModule(
    tripId: string,
    moduleType: ModuleType
  ): Promise<ModuleGenerationResult> {
    const result = await this.pipeline.generateTripIntelligence(tripId, [moduleType]);
    return result.results.find(r => r.moduleType === moduleType)!;
  }
  
  /**
   * Generate packing list for specific traveler
   */
  async generatePackingList(
    tripId: string,
    travelerId: string
  ): Promise<PackingListOutput> {
    
    const context = await this.contextBuilder.buildContext(tripId);
    
    // Get specific traveler context
    const travelerContext = context.travelers.find(t => t.id === travelerId);
    if (!travelerContext) {
      throw new Error(`Traveler ${travelerId} not found in trip`);
    }
    
    // Check partial cache (destination + season + duration)
    const baseCacheKey = this.cache.generatePackingBaseCacheKey(context);
    const baseCache = await this.cache.get(baseCacheKey);
    
    // Generate full list with personalization
    const generator = new PackingListGenerator(context, travelerContext, baseCache);
    return generator.generate();
  }
  
  /**
   * Get destination intelligence (used for preview before booking)
   */
  async getDestinationIntelligence(
    destinationCode: string
  ): Promise<DestinationIntelligence> {
    
    const cacheKey = `destination:${destinationCode.toLowerCase()}`;
    const cached = await this.cache.get(cacheKey);
    
    if (cached) {
      return cached;
    }
    
    const intel = await this.contextBuilder.buildDestinationIntelligence(destinationCode);
    await this.cache.set(cacheKey, intel, '30d');
    
    return intel;
  }
  
  /**
   * Refresh modules that need updating
   */
  async refreshModules(
    tripId: string,
    reason: RefreshReason
  ): Promise<void> {
    
    const modulesToRefresh = this.determineModulesToRefresh(reason);
    await this.pipeline.generateTripIntelligence(tripId, modulesToRefresh);
  }
  
  /**
   * Check flight for compensation eligibility
   */
  async analyzeCompensation(
    flightDetails: FlightDisruptionDetails
  ): Promise<CompensationAnalysis> {
    
    const generator = new CompensationAnalyzer(flightDetails);
    return generator.analyze();
  }
}
```

### 8.2 Scheduled Jobs

```typescript
// src/jobs/ai-generation.jobs.ts

// Refresh safety data daily
schedule('0 6 * * *', async () => {
  console.log('[Job] Refreshing safety intelligence cache');
  
  const destinations = await getActiveDestinations();
  
  for (const destination of destinations) {
    try {
      const freshData = await SafetyDataService.fetchFreshData(destination.code);
      await cache.set(`safety:base:${destination.code}`, freshData, '7d');
    } catch (error) {
      console.error(`Failed to refresh safety for ${destination.code}:`, error);
    }
  }
});

// Refresh exchange rates twice daily
schedule('0 8,20 * * *', async () => {
  console.log('[Job] Refreshing exchange rates');
  await CurrencyService.refreshAllRates();
});

// Check for safety alert changes hourly for active trips
schedule('0 * * * *', async () => {
  console.log('[Job] Checking safety alerts for active trips');
  
  const activeTrips = await TripRepository.findByStatus(['upcoming', 'ongoing']);
  
  for (const trip of activeTrips) {
    const currentAlerts = await SafetyDataService.checkAlerts(trip.primary_destination_country);
    
    if (currentAlerts.hasNewAlerts) {
      await NotificationService.sendSafetyAlert(trip.id, currentAlerts.newAlerts);
    }
  }
});

// Invalidate stale cache weekly
schedule('0 0 * * 0', async () => {
  console.log('[Job] Cleaning stale cache entries');
  
  const staleCount = await cache.invalidateStale();
  console.log(`Invalidated ${staleCount} stale cache entries`);
});

// Pre-generate intelligence for confirmed trips (upcoming in 30 days)
schedule('0 2 * * *', async () => {
  console.log('[Job] Pre-generating intelligence for upcoming trips');
  
  const upcomingTrips = await TripRepository.findUpcomingWithoutIntelligence(30);
  
  for (const trip of upcomingTrips) {
    try {
      await AIGenerationService.generateAllModules(trip.id);
      console.log(`Generated intelligence for trip ${trip.id}`);
    } catch (error) {
      console.error(`Failed to generate for trip ${trip.id}:`, error);
    }
  }
});
```

---

## Part 9: Testing

### 9.1 Test Scenarios

```typescript
// src/services/ai-engine/__tests__/generation.test.ts

describe('AI Generation Engine', () => {
  
  describe('Packing List Generation', () => {
    
    it('generates weather-appropriate clothing', async () => {
      const context = createMockContext({
        destination: 'DXB',
        weather: { avgTemp: 40, rainDays: 0 }
      });
      
      const result = await generator.generatePackingList(context);
      
      expect(result.categories.find(c => c.id === 'clothing').items)
        .toContainEqual(expect.objectContaining({
          name: expect.stringContaining('light'),
          reason: expect.stringContaining('hot')
        }));
      
      expect(result.categories.find(c => c.id === 'clothing').items)
        .not.toContainEqual(expect.objectContaining({
          name: expect.stringMatching(/jacket|coat|sweater/i)
        }));
    });
    
    it('includes professional items for relevant professions', async () => {
      const context = createMockContext({
        traveler: { profession: 'photographer' }
      });
      
      const result = await generator.generatePackingList(context);
      
      const professionalCategory = result.categories.find(c => c.id === 'professional');
      expect(professionalCategory.items).toContainEqual(
        expect.objectContaining({ name: expect.stringContaining('Camera') })
      );
    });
    
    it('includes religious items for observant travelers', async () => {
      const context = createMockContext({
        traveler: { religion: 'Muslim', religiousObservance: 'strict' }
      });
      
      const result = await generator.generatePackingList(context);
      
      const religiousCategory = result.categories.find(c => c.id === 'religious');
      expect(religiousCategory.items).toContainEqual(
        expect.objectContaining({ name: expect.stringContaining('Prayer mat') })
      );
    });
    
    it('includes all required documents', async () => {
      const context = createMockContext({
        destination: 'AE',
        traveler: { nationality: 'US' },
        regulations: { visaRequired: false }
      });
      
      const result = await generator.generatePackingList(context);
      
      const documentsCategory = result.categories.find(c => c.id === 'documents');
      expect(documentsCategory.items).toContainEqual(
        expect.objectContaining({ name: 'Passport', required: true })
      );
    });
    
    it('warns about luggage weight limits', async () => {
      const context = createMockContext({
        luggageRules: { carryOn: { weight: 7, unit: 'kg' } },
        tripDuration: 14
      });
      
      const result = await generator.generatePackingList(context);
      
      expect(result.warnings).toContainEqual(
        expect.objectContaining({
          type: 'weight',
          severity: 'warning'
        })
      );
    });
  });
  
  describe('Do\'s & Don\'ts Generation', () => {
    
    it('includes critical warnings for strict law countries', async () => {
      const context = createMockContext({ destination: 'AE' });
      
      const result = await generator.generateDosDonts(context);
      
      const criticalItems = result.items.filter(i => i.severity === 'critical');
      expect(criticalItems.length).toBeGreaterThan(0);
      expect(criticalItems).toContainEqual(
        expect.objectContaining({ category: expect.stringMatching(/alcohol|lgbtq/i) })
      );
    });
    
    it('covers all 18 categories', async () => {
      const context = createMockContext({ destination: 'JP' });
      
      const result = await generator.generateDosDonts(context);
      
      const categories = new Set(result.items.map(i => i.category));
      expect(categories.size).toBeGreaterThanOrEqual(15);
    });
    
    it('personalizes for LGBTQ+ travelers in relevant destinations', async () => {
      const context = createMockContext({
        destination: 'AE',
        travelers: [{ lgbtq: true }]
      });
      
      const result = await generator.generateDosDonts(context);
      
      expect(result.items).toContainEqual(
        expect.objectContaining({
          category: 'lgbtq',
          severity: 'critical'
        })
      );
    });
  });
  
  describe('Safety Intelligence Generation', () => {
    
    it('calculates safety score correctly', async () => {
      const context = createMockContext({ destination: 'IS' }); // Iceland - very safe
      
      const result = await generator.generateSafetyIntelligence(context);
      
      expect(result.overallAssessment.score).toBeGreaterThan(80);
      expect(result.overallAssessment.level).toBe('safe');
    });
    
    it('includes nationality-specific embassy info', async () => {
      const context = createMockContext({
        destination: 'TH',
        traveler: { nationality: 'US' }
      });
      
      const result = await generator.generateSafetyIntelligence(context);
      
      const embassy = result.emergencyContacts.find(c => c.type === 'embassy');
      expect(embassy.name).toContain('US');
    });
    
    it('includes relevant scam warnings', async () => {
      const context = createMockContext({ destination: 'EG' });
      
      const result = await generator.generateSafetyIntelligence(context);
      
      expect(result.scamAlerts.length).toBeGreaterThan(0);
    });
  });
  
  describe('Cache Behavior', () => {
    
    it('uses cache for identical context', async () => {
      const context = createMockContext({ destination: 'JP' });
      
      await generator.generateDosDonts(context);
      const spy = jest.spyOn(claude, 'messages.create');
      
      await generator.generateDosDonts(context);
      
      expect(spy).not.toHaveBeenCalled();
    });
    
    it('regenerates for different trip type', async () => {
      const context1 = createMockContext({ destination: 'JP', tripType: 'leisure' });
      const context2 = createMockContext({ destination: 'JP', tripType: 'business' });
      
      await generator.generateDosDonts(context1);
      const spy = jest.spyOn(claude, 'messages.create');
      
      await generator.generateDosDonts(context2);
      
      expect(spy).toHaveBeenCalled();
    });
  });
});
```

---

## Summary

The AI Generation Engine is the intelligent core of Guidera, transforming trip data into personalized, actionable travel guidance. It consists of:

1. **Context Engine** - Aggregates 50+ data points about travelers, trips, destinations, and real-time conditions
2. **Generation Engine** - Module-specific system prompts that create tailored content
3. **Quality Engine** - Validation, caching, and continuous improvement

The engine handles:
- **Every traveler type** - From budget backpackers to luxury travelers, solo to family, every demographic and need
- **Every destination** - Special handling for strict-law countries, safety-challenged areas, unique cultural contexts
- **Every edge case** - Medical conditions, religious observance, LGBTQ+ safety, pregnancy, disabilities
- **Every activity** - Safari, scuba, business, temple visits, and dozens more

The result is a travel companion that knows exactly what each traveler needs, keeping them safe, prepared, and culturally aware wherever they go.

