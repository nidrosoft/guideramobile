/**
 * Guidance System copy (English source). Merged under the `guidance` namespace.
 * Other locales mirror this shape.
 */
const guidance = {
  common: {
    next: 'Next',
    back: 'Back',
    skip: 'Skip',
    finish: 'Finish',
    gotIt: 'Got it',
    notNow: 'Not now',
    save: 'Save',
    dontSuggest: "Don't suggest this",
    stepOf: 'Step {{current}} of {{total}}',
  },
  tours: {
    hero: {
      welcome: {
        title: 'Welcome to Guidera 👋',
        body: 'This quick tour shows you the essentials — about 30 seconds. You can skip anytime.',
      },
      search: {
        title: 'Preview any trip instantly',
        body: 'Search any city to get a Trip Snapshot — estimated costs, weather, visa info and a feel for the trip before you commit.',
      },
      deals: {
        title: 'Deals picked for you',
        body: 'Flight and experience deals refresh all day. Tap See all to browse by category.',
      },
      journeys: {
        title: 'Travel for a reason',
        body: 'Journeys are research-backed briefs for why you travel — relocation, healthcare, study, remote work and more.',
      },
      launcher: {
        title: 'Your toolkit lives here',
        body: 'Navigate cities, scan menus with AI Vision, get safety alerts, scan receipts and tickets, or ask Guidera AI anything.',
      },
      launcherSheet: {
        title: 'Six tools, one tap away',
        body: 'Try AI Vision on a real menu — it translates and even builds your order.',
      },
      trips: {
        title: 'It all starts with a trip',
        body: 'Add or import a trip to unlock Smart Plan: itinerary, packing, safety, language, documents, expenses, journal, do’s & don’ts and compensation tracking.',
        cta: 'Set up my travel profile →',
      },
    },
    trips: {
      create: {
        title: 'Create a trip in seconds',
        body: 'Build one manually, or let AI plan it for you.',
      },
      import: {
        title: 'Already booked? Import it',
        body: 'Scan a boarding pass or forward a booking email — Guidera builds the trip automatically.',
      },
      states: {
        title: 'Trips organize themselves',
        body: 'Upcoming, ongoing, past, drafts — everything in its place.',
        cta: 'Create my first trip',
      },
    },
    tripDetail: {
      smartPlan: {
        title: 'One tap, six modules',
        body: 'Smart Plan generates your itinerary, packing list, safety brief, language kit, documents checklist and cultural do’s & don’ts — personalized to you.',
      },
      modules: {
        title: 'Your trip command center',
        body: 'Track expenses, keep a journal, and monitor flight compensation — each card is a full tool.',
      },
      invite: {
        title: 'Travel together',
        body: 'Invite companions to view and edit this trip with you.',
      },
      snapshot: {
        title: 'Know before you go',
        body: 'The snapshot keeps live costs, weather and alerts for this destination.',
        cta: 'Generate Smart Plan',
      },
    },
    connect: {
      tabs: {
        title: 'Find your people',
        body: 'Discover travelers, join groups, meet local guides and find events wherever you’re headed.',
      },
      pulse: {
        title: 'Pulse: live around you',
        body: 'See real-time traveler activity and meetups on the map — like a heartbeat of the city.',
      },
      guides: {
        title: 'Know the way? Become a guide',
        body: 'Locals can apply to guide travelers and earn.',
      },
    },
    journeys: {
      categories: {
        title: 'Pick your reason',
        body: 'Every journey type gets a research-grade brief: costs, requirements, timelines, providers.',
      },
      briefing: {
        title: 'Briefings are personal',
        body: 'Tell us where, what stage you’re at and who’s coming — we generate a brief just for your case.',
      },
    },
    search: {
      input: {
        title: 'Search like you think',
        body: 'Type a city, a country, even "warm in December".',
      },
      snapshotHint: {
        title: 'Get the full picture',
        body: 'Selecting a destination builds a Trip Snapshot — costs, flights, weather, safety — before you plan anything.',
      },
    },
    detail: {
      header: {
        title: 'Everything about a place',
        body: 'Photos, ratings and the essentials up top. Scroll for the full picture.',
      },
      save: {
        title: 'Save it for later',
        body: 'Tap the heart to add this place to your saved items and collections.',
      },
      share: {
        title: 'Share with your crew',
        body: 'Send this place to friends or your trip companions in a tap.',
      },
      insights: {
        title: 'Insights worth knowing',
        body: 'A quick, honest read on what makes this place special.',
      },
      practical: {
        title: 'Practical information',
        body: 'Best time to visit, currency, getting around and local tips.',
      },
      safety: {
        title: 'Safety at a glance',
        body: 'Current advisories and what to watch for, so you travel prepared.',
      },
      creators: {
        title: 'Creator content',
        body: 'Real videos from travelers and creators who’ve been here.',
      },
      vibes: {
        title: 'Vibes around here',
        body: 'Get a feel for the mood, the scene and what’s nearby.',
      },
    },
    snapshot: {
      overview: {
        title: 'Your trip at a glance',
        body: 'This snapshot estimates your whole trip before you commit a cent.',
      },
      cost: {
        title: 'What it’ll cost',
        body: 'Flights, stay, food and activities — a realistic budget for your dates.',
      },
      weather: {
        title: 'Weather & best time',
        body: 'What to expect while you’re there, so you pack and plan right.',
      },
      safety: {
        title: 'Safety & entry',
        body: 'Advisories, visa and entry notes tailored to your nationality.',
      },
      cta: {
        title: 'Like what you see?',
        body: 'Turn this snapshot into a real trip and unlock your full Smart Plan.',
      },
    },
  },
  tips: {
    savedItems: {
      title: 'Saved items',
      body: 'Saved items live here — destinations, deals, guides.',
    },
    inbox: { title: 'Your inbox', body: 'Trip alerts and messages arrive in your inbox.' },
    tripReminder: {
      title: 'Your next trip',
      body: 'Your next trip follows you here — tap for the countdown and quick actions.',
    },
    categoryPills: {
      title: 'Quick categories',
      body: 'Jump straight to flights, hotels, cars or experiences.',
    },
    sos: {
      title: 'Emergency SOS',
      body: 'Hold SOS in an emergency — it alerts your emergency contact with your location.',
    },
    checkin: {
      title: 'Safety check-ins',
      body: 'Scheduled check-ins let loved ones know you’re safe.',
    },
    rewards: {
      title: 'Earn rewards',
      body: 'You’re earning points — refer friends to earn faster.',
    },
    aiVisionLive: {
      title: 'Live AI Vision',
      body: 'Try Live mode — point the camera and talk to Guidera in real time.',
    },
    dmGuides: { title: 'Message guides', body: 'You can message guides directly before booking.' },
    expenseScan: {
      title: 'Scan receipts',
      body: 'Skip typing — scan the receipt and we’ll log it.',
    },
    becomeGuide: {
      title: 'Become a local guide',
      body: 'Know your city? Get verified to guide travelers and earn — tap to learn how.',
    },
    aiAssistant: {
      title: 'Ask Guidera anything',
      body: 'Flights, visas, weather, hotels, directions — your AI travel assistant handles it all in chat.',
    },
    flightForm: {
      title: 'Find the right flight',
      body: 'Set your route, dates and cabin — we compare across providers for the best fares.',
    },
    hotelForm: {
      title: 'Stays that fit you',
      body: 'Pick dates and guests; filter by price, rating and amenities to match your style.',
    },
    carForm: {
      title: 'Wheels for your trip',
      body: 'Choose pickup, dates and car type — compare rental deals in one place.',
    },
    packingModule: {
      title: 'Never forget a thing',
      body: 'A smart packing list built from your destination, weather and trip length.',
    },
    expensesModule: {
      title: 'Track every expense',
      body: 'Log spending or scan receipts — see your budget in real time.',
    },
    journalModule: {
      title: 'Capture the memories',
      body: 'Keep notes, photos and moments from your trip in one place.',
    },
    tripsEmpty: {
      title: 'Start your first trip',
      body: 'Tap Create to plan a trip and unlock itinerary, packing, safety and more.',
    },
    savedEmpty: {
      title: 'Save as you explore',
      body: 'Tap the heart on any place or deal to keep it here for later.',
    },
  },
  celebrate: {
    m50: {
      title: 'Halfway there! 🎉',
      body: 'You’re halfway to a complete travel profile — your trip plans are getting smarter.',
    },
    m80: {
      title: 'Almost there! ✦',
      body: 'Your profile is strong now — Guidera can personalize nearly everything about your trips.',
    },
    m100: {
      title: 'Profile complete! 🏆',
      body: 'Every recommendation is now tuned to you. Bon voyage!',
    },
    cta: 'Nice',
  },
  prompts: {
    home_airport: {
      fact: '✈️ You searched from {{value}}',
      benefit: 'Set it as your home airport — future searches autofill it.',
    },
    origin_city: {
      fact: '📍 You’re traveling from {{value}}',
      benefit: 'Save it as your home city for faster trip snapshots.',
    },
    passport_country: {
      fact: '🛂 Passport from {{value}}?',
      benefit: 'We’ll tailor visa and entry requirements to it.',
    },
    defaultCompanionType: {
      fact: '👥 Traveling as {{value}}?',
      benefit: 'Make it your default crew — plans match it automatically.',
    },
    spendingStyle: {
      fact: '💰 Your budget style looks {{value}}',
      benefit: 'Save it so recommendations match your spending.',
    },
    flightClass: {
      fact: '💺 You prefer {{value}} class',
      benefit: 'Set it as default for faster flight searches.',
    },
    flightStops: {
      fact: '🔁 You prefer {{value}} flights',
      benefit: 'Save it to filter flights automatically.',
    },
    defaultCurrency: {
      fact: '💱 Mostly using {{value}}',
      benefit: 'Make it your default currency across the app.',
    },
    preferredTripStyles: {
      fact: '🧭 You lean toward {{value}} trips',
      benefit: 'Add it to your travel style for better plans.',
    },
    interests: {
      fact: '✨ Interested in {{value}}?',
      benefit: 'Add it to your interests to personalize recommendations.',
    },
    accommodationType: {
      fact: '🏨 You prefer {{value}} stays',
      benefit: 'Save it so hotel results match your taste.',
    },
    minStarRating: {
      fact: '⭐ You filter for {{value}}★+ stays',
      benefit: 'Set it as your standard hotel quality.',
    },
    dietaryRestrictions: {
      fact: '🥗 Dietary need: {{value}}?',
      benefit: 'Add it so we flag safe food and restaurants.',
    },
    cuisinePreferences: {
      fact: '🍽️ You enjoy {{value}} cuisine',
      benefit: 'Save it to get better food recommendations.',
    },
    spiceTolerance: {
      fact: '🌶️ Spice level: {{value}}?',
      benefit: 'Save it to tailor food suggestions.',
    },
    medicalConditions: {
      fact: '🩺 Health note: {{value}}?',
      benefit: 'Add it so safety briefs account for it.',
    },
    preferredAmenities: {
      fact: '🛎️ You look for {{value}}',
      benefit: 'Save your must-have amenities for hotel searches.',
    },
    languages: {
      fact: '🗣️ You speak {{value}}?',
      benefit: 'Add it to your languages for better local tips.',
    },
  },
  hub: {
    title: 'Travel Profile',
    ringLabel: 'Profile',
    tierGettingStarted: 'Getting started',
    tierLookingGood: 'Looking good',
    tierTravelReady: 'Travel-ready ✦',
    cardCta: 'Complete your profile to personalize every trip',
    quickWins: 'Quick wins',
    quickWinsSubtitle: 'A few taps to a smarter profile',
    suggestions: 'Suggestions to review',
    suggestionsEmpty: 'Nothing to review right now.',
    editFull: 'Edit full travel profile',
    why: 'Why this matters',
    whyBody:
      'Your Smart Plans, packing lists and safety briefs are personalized from this profile.',
    confirm: 'Confirm',
    deny: 'Dismiss',
    privacyOff:
      'Profile suggestions are turned off. Turn them on in Privacy settings to build your profile as you explore.',
    homeNudgeTitle: 'Make Guidera yours',
    homeNudgeBody: 'Your trips get smarter when Guidera knows you — 2 minutes to a richer profile.',
    homeNudgeCta: 'Improve profile',
  },
  settings: {
    profileSuggestions: 'Profile suggestions',
    profileSuggestionsDesc: 'Let Guidera suggest profile details as you explore.',
    walkthrough: 'App walkthrough',
    walkthroughDesc: 'Replay the guided tours.',
  },
  replay: {
    title: 'App walkthrough',
    subtitle: 'Replay any guided tour.',
    hero: 'App basics',
    trips: 'Trips',
    tripDetail: 'Trip tools',
    connect: 'Connect',
    journeys: 'Journeys',
    search: 'Search',
    replay: 'Replay',
  },
};

export default guidance;
export type GuidanceCopy = typeof guidance;
