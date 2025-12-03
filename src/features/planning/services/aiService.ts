/**
 * AI SERVICE
 * 
 * Handles AI-powered trip generation.
 * Currently uses mock data, will integrate with real AI API later.
 */

import {
  QuickTripFormData,
  AIGeneratedContent,
  DayPlan,
  PlannedActivity,
  MealSuggestion,
  SafetyTip,
  PackingItem,
  CulturalTip,
  LocalPhrase,
  WeatherDay,
  BudgetEstimate,
  EmergencyContact,
} from '../types/planning.types';

// Mock activities by destination
const MOCK_ACTIVITIES: Record<string, PlannedActivity[]> = {
  default: [
    {
      id: '1',
      name: 'City Walking Tour',
      type: 'tour',
      startTime: '09:00',
      endTime: '12:00',
      duration: 180,
      location: { name: 'City Center', address: 'Main Square' },
      description: 'Explore the historic city center with a local guide',
      cost: { amount: 25, currency: 'USD' },
      tips: ['Wear comfortable shoes', 'Bring water'],
      bookingRequired: false,
    },
    {
      id: '2',
      name: 'Local Market Visit',
      type: 'activity',
      startTime: '14:00',
      endTime: '16:00',
      duration: 120,
      location: { name: 'Central Market' },
      description: 'Experience local flavors and crafts at the bustling market',
      tips: ['Bring cash for small vendors', 'Try the local specialties'],
      bookingRequired: false,
    },
    {
      id: '3',
      name: 'Sunset Viewpoint',
      type: 'attraction',
      startTime: '17:30',
      endTime: '19:00',
      duration: 90,
      location: { name: 'Observation Deck' },
      description: 'Watch the sunset over the city skyline',
      tips: ['Arrive early for best spots', 'Great for photos'],
      bookingRequired: false,
    },
  ],
  Tokyo: [
    {
      id: 't1',
      name: 'Senso-ji Temple',
      type: 'attraction',
      startTime: '08:00',
      endTime: '10:00',
      duration: 120,
      location: { name: 'Senso-ji Temple', address: 'Asakusa, Tokyo' },
      description: 'Visit Tokyo\'s oldest and most significant temple',
      tips: ['Go early to avoid crowds', 'Try the fortune slips'],
      bookingRequired: false,
    },
    {
      id: 't2',
      name: 'Shibuya Crossing',
      type: 'attraction',
      startTime: '11:00',
      endTime: '12:30',
      duration: 90,
      location: { name: 'Shibuya Crossing', address: 'Shibuya, Tokyo' },
      description: 'Experience the world\'s busiest pedestrian crossing',
      tips: ['View from Starbucks above', 'Best at night with lights'],
      bookingRequired: false,
    },
    {
      id: 't3',
      name: 'TeamLab Borderless',
      type: 'activity',
      startTime: '14:00',
      endTime: '17:00',
      duration: 180,
      location: { name: 'TeamLab Borderless', address: 'Odaiba, Tokyo' },
      description: 'Immersive digital art museum experience',
      cost: { amount: 35, currency: 'USD' },
      tips: ['Book tickets in advance', 'Wear white for best photos'],
      bookingRequired: true,
      bookingUrl: 'https://borderless.teamlab.art',
    },
    {
      id: 't4',
      name: 'Ramen Street Dinner',
      type: 'activity',
      startTime: '19:00',
      endTime: '20:30',
      duration: 90,
      location: { name: 'Tokyo Ramen Street', address: 'Tokyo Station' },
      description: 'Sample various ramen styles from top shops',
      cost: { amount: 15, currency: 'USD' },
      tips: ['Try different broths', 'Expect queues at popular shops'],
      bookingRequired: false,
    },
  ],
  Paris: [
    {
      id: 'p1',
      name: 'Eiffel Tower',
      type: 'attraction',
      startTime: '09:00',
      endTime: '11:30',
      duration: 150,
      location: { name: 'Eiffel Tower', address: 'Champ de Mars, Paris' },
      description: 'Iconic iron lattice tower with stunning city views',
      cost: { amount: 28, currency: 'EUR' },
      tips: ['Book skip-the-line tickets', 'Visit at sunset'],
      bookingRequired: true,
    },
    {
      id: 'p2',
      name: 'Louvre Museum',
      type: 'attraction',
      startTime: '13:00',
      endTime: '17:00',
      duration: 240,
      location: { name: 'Louvre Museum', address: 'Rue de Rivoli, Paris' },
      description: 'World\'s largest art museum and historic monument',
      cost: { amount: 17, currency: 'EUR' },
      tips: ['See Mona Lisa first', 'Use museum map app'],
      bookingRequired: true,
    },
    {
      id: 'p3',
      name: 'Montmartre Walk',
      type: 'tour',
      startTime: '18:00',
      endTime: '20:00',
      duration: 120,
      location: { name: 'Montmartre', address: '18th arrondissement' },
      description: 'Explore the artistic hilltop neighborhood',
      tips: ['Visit Sacré-Cœur', 'Watch street artists'],
      bookingRequired: false,
    },
  ],
};

// Mock meals
const MOCK_MEALS: MealSuggestion[] = [
  { type: 'breakfast', name: 'Local Café', cuisine: 'Local', priceRange: '$$', recommendation: 'Try the traditional breakfast' },
  { type: 'lunch', name: 'Street Food Market', cuisine: 'Various', priceRange: '$', recommendation: 'Great variety of local dishes' },
  { type: 'dinner', name: 'Recommended Restaurant', cuisine: 'Local', priceRange: '$$$', recommendation: 'Reservations recommended' },
];

// Mock safety tips
const MOCK_SAFETY_TIPS: SafetyTip[] = [
  { category: 'general', title: 'Stay Aware', description: 'Keep your belongings secure in crowded areas', severity: 'info' },
  { category: 'transport', title: 'Use Licensed Taxis', description: 'Only use official taxis or ride-sharing apps', severity: 'warning' },
  { category: 'health', title: 'Stay Hydrated', description: 'Carry water, especially during warm weather', severity: 'info' },
  { category: 'scam', title: 'Common Scams', description: 'Be wary of unsolicited help or too-good deals', severity: 'warning' },
  { category: 'emergency', title: 'Emergency Numbers', description: 'Save local emergency numbers in your phone', severity: 'critical' },
];

// Mock packing items
const MOCK_PACKING_ITEMS: PackingItem[] = [
  { category: 'clothing', item: 'Comfortable walking shoes', quantity: 1, essential: true },
  { category: 'clothing', item: 'Light jacket', quantity: 1, essential: true },
  { category: 'clothing', item: 'T-shirts', quantity: 4, essential: true },
  { category: 'clothing', item: 'Pants/shorts', quantity: 3, essential: true },
  { category: 'toiletries', item: 'Sunscreen', quantity: 1, essential: true },
  { category: 'toiletries', item: 'Basic toiletries', quantity: 1, essential: true },
  { category: 'electronics', item: 'Phone charger', quantity: 1, essential: true },
  { category: 'electronics', item: 'Power adapter', quantity: 1, essential: true, notes: 'Check plug type for destination' },
  { category: 'documents', item: 'Passport', quantity: 1, essential: true },
  { category: 'documents', item: 'Travel insurance docs', quantity: 1, essential: true },
  { category: 'misc', item: 'Reusable water bottle', quantity: 1, essential: false },
  { category: 'misc', item: 'Day backpack', quantity: 1, essential: true },
];

// Mock cultural tips
const MOCK_CULTURAL_TIPS: CulturalTip[] = [
  { type: 'do', title: 'Learn basic greetings', description: 'Locals appreciate when visitors try to speak their language', importance: 'high' },
  { type: 'do', title: 'Respect local customs', description: 'Observe and follow local etiquette in religious sites', importance: 'high' },
  { type: 'do', title: 'Tip appropriately', description: 'Research tipping customs for your destination', importance: 'medium' },
  { type: 'dont', title: 'Don\'t be loud', description: 'Keep voice levels moderate in public spaces', importance: 'medium' },
  { type: 'dont', title: 'Don\'t photograph without permission', description: 'Ask before taking photos of people', importance: 'high' },
];

// Mock local phrases by destination
const MOCK_PHRASES: Record<string, LocalPhrase[]> = {
  default: [
    { english: 'Hello', local: 'Hello', pronunciation: 'heh-LOH', context: 'Greeting' },
    { english: 'Thank you', local: 'Thank you', pronunciation: 'thank-YOO', context: 'Gratitude' },
    { english: 'Please', local: 'Please', pronunciation: 'pleez', context: 'Polite request' },
  ],
  Tokyo: [
    { english: 'Hello', local: 'こんにちは', pronunciation: 'kon-nee-chee-wah', context: 'Daytime greeting' },
    { english: 'Thank you', local: 'ありがとう', pronunciation: 'ah-ree-gah-toh', context: 'Gratitude' },
    { english: 'Excuse me', local: 'すみません', pronunciation: 'soo-mee-mah-sen', context: 'Getting attention' },
    { english: 'Delicious', local: 'おいしい', pronunciation: 'oy-shee', context: 'Complimenting food' },
    { english: 'How much?', local: 'いくらですか', pronunciation: 'ee-koo-rah des-kah', context: 'Shopping' },
  ],
  Paris: [
    { english: 'Hello', local: 'Bonjour', pronunciation: 'bohn-ZHOOR', context: 'Greeting' },
    { english: 'Thank you', local: 'Merci', pronunciation: 'mehr-SEE', context: 'Gratitude' },
    { english: 'Please', local: 'S\'il vous plaît', pronunciation: 'seel voo PLEH', context: 'Polite request' },
    { english: 'Goodbye', local: 'Au revoir', pronunciation: 'oh ruh-VWAHR', context: 'Farewell' },
    { english: 'Excuse me', local: 'Excusez-moi', pronunciation: 'ex-koo-zay MWAH', context: 'Getting attention' },
  ],
};

/**
 * Generate mock AI content based on trip data
 */
export function generateMockAIContent(tripData: QuickTripFormData): AIGeneratedContent {
  const destinationName = tripData.destination?.name || 'default';
  const startDate = tripData.startDate ? new Date(tripData.startDate) : new Date();
  const endDate = tripData.endDate ? new Date(tripData.endDate) : new Date();
  
  // Calculate trip duration
  const tripDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  
  // Get activities for destination
  const activities = MOCK_ACTIVITIES[destinationName] || MOCK_ACTIVITIES.default;
  
  // Day-specific activities for variety
  const DAY_ACTIVITIES: PlannedActivity[][] = [
    // Day 1 - Arrival
    [
      { id: 'arr-1', name: 'Arrive at Airport', type: 'flight', startTime: '10:00', endTime: '10:30', duration: 30, location: { name: 'International Airport', address: 'JFK' }, bookingRequired: false },
      { id: 'arr-2', name: 'Hotel Check-in', type: 'hotel', startTime: '14:00', endTime: '15:00', duration: 60, location: { name: 'Grand Hotel Downtown' }, bookingRequired: true },
      { id: 'arr-3', name: 'Neighborhood Walk', type: 'activity', startTime: '16:00', endTime: '18:00', duration: 120, location: { name: 'Downtown District' }, bookingRequired: false },
    ],
    // Day 2 - Exploration
    [
      { id: 'day2-1', name: 'Breakfast at Local Café', type: 'restaurant', startTime: '08:30', endTime: '09:30', duration: 60, location: { name: 'Morning Brew Café' }, bookingRequired: false },
      { id: 'day2-2', name: 'City Museum Visit', type: 'attraction', startTime: '10:00', endTime: '13:00', duration: 180, location: { name: 'National Museum' }, cost: { amount: 25, currency: 'USD' }, bookingRequired: true },
      { id: 'day2-3', name: 'Lunch at Food Market', type: 'restaurant', startTime: '13:30', endTime: '14:30', duration: 60, location: { name: 'Central Food Hall' }, bookingRequired: false },
      { id: 'day2-4', name: 'Historic District Tour', type: 'tour', startTime: '15:00', endTime: '17:30', duration: 150, location: { name: 'Old Town' }, cost: { amount: 35, currency: 'USD' }, bookingRequired: true },
      { id: 'day2-5', name: 'Sunset at Viewpoint', type: 'attraction', startTime: '18:00', endTime: '19:30', duration: 90, location: { name: 'Sky Deck Observatory' }, bookingRequired: false },
    ],
    // Day 3 - Adventure
    [
      { id: 'day3-1', name: 'Morning Yoga', type: 'activity', startTime: '07:00', endTime: '08:00', duration: 60, location: { name: 'Rooftop Garden' }, bookingRequired: false },
      { id: 'day3-2', name: 'Day Trip to Countryside', type: 'tour', startTime: '09:00', endTime: '16:00', duration: 420, location: { name: 'Scenic Valley' }, cost: { amount: 75, currency: 'USD' }, bookingRequired: true },
      { id: 'day3-3', name: 'Local Cooking Class', type: 'activity', startTime: '17:00', endTime: '20:00', duration: 180, location: { name: 'Culinary Studio' }, cost: { amount: 60, currency: 'USD' }, bookingRequired: true },
    ],
    // Day 4 - Culture
    [
      { id: 'day4-1', name: 'Art Gallery Visit', type: 'attraction', startTime: '10:00', endTime: '12:30', duration: 150, location: { name: 'Modern Art Museum' }, cost: { amount: 20, currency: 'USD' }, bookingRequired: false },
      { id: 'day4-2', name: 'Lunch with a View', type: 'restaurant', startTime: '13:00', endTime: '14:30', duration: 90, location: { name: 'Skyline Restaurant' }, bookingRequired: true },
      { id: 'day4-3', name: 'Shopping District', type: 'activity', startTime: '15:00', endTime: '18:00', duration: 180, location: { name: 'Fashion Quarter' }, bookingRequired: false },
      { id: 'day4-4', name: 'Evening Show', type: 'activity', startTime: '20:00', endTime: '22:30', duration: 150, location: { name: 'Grand Theater' }, cost: { amount: 85, currency: 'USD' }, bookingRequired: true },
    ],
    // Day 5+ - Departure or more exploration
    [
      { id: 'dep-1', name: 'Hotel Checkout', type: 'hotel', startTime: '10:00', endTime: '11:00', duration: 60, location: { name: 'Grand Hotel Downtown' }, bookingRequired: false },
      { id: 'dep-2', name: 'Last Minute Shopping', type: 'activity', startTime: '11:30', endTime: '13:00', duration: 90, location: { name: 'Souvenir District' }, bookingRequired: false },
      { id: 'dep-3', name: 'Depart from Airport', type: 'flight', startTime: '16:00', endTime: '16:30', duration: 30, location: { name: 'International Airport', address: 'JFK' }, bookingRequired: false },
    ],
  ];

  // Generate day plans
  const itinerary: DayPlan[] = [];
  for (let i = 0; i < tripDays; i++) {
    const dayDate = new Date(startDate);
    dayDate.setDate(dayDate.getDate() + i);
    
    // Get activities for this day (cycle through if more days than templates)
    let dayActivities: PlannedActivity[];
    if (i === 0) {
      dayActivities = DAY_ACTIVITIES[0]; // Arrival
    } else if (i === tripDays - 1) {
      dayActivities = DAY_ACTIVITIES[4]; // Departure
    } else {
      // Cycle through middle days
      const middleDayIndex = ((i - 1) % 3) + 1;
      dayActivities = DAY_ACTIVITIES[middleDayIndex];
    }
    
    // Add unique IDs for each day
    dayActivities = dayActivities.map((activity, index) => ({
      ...activity,
      id: `${activity.id}-day${i}`,
    }));
    
    itinerary.push({
      dayNumber: i + 1,
      date: dayDate,
      title: i === 0 ? 'Arrival Day' : i === tripDays - 1 ? 'Departure Day' : `Day ${i + 1} - Exploration`,
      activities: dayActivities,
      meals: MOCK_MEALS,
      notes: i === 0 ? ['Check into accommodation', 'Get oriented with the area'] : [],
      weather: {
        condition: ['sunny', 'cloudy', 'sunny'][i % 3] as any,
        tempHigh: 22 + (i % 5),
        tempLow: 15 + (i % 3),
        humidity: 55 + (i * 5) % 20,
        precipitation: (i * 10) % 30,
      },
      estimatedCost: 100 + (i * 25) + Math.floor(Math.random() * 50),
    });
  }
  
  // Generate weather forecast
  const weatherForecast: WeatherDay[] = itinerary.map((day) => ({
    date: day.date,
    condition: ['sunny', 'cloudy', 'sunny', 'sunny', 'cloudy'][Math.floor(Math.random() * 5)] as any,
    tempHigh: 22 + Math.floor(Math.random() * 8),
    tempLow: 15 + Math.floor(Math.random() * 5),
    humidity: 50 + Math.floor(Math.random() * 30),
    precipitation: Math.floor(Math.random() * 30),
  }));
  
  // Budget estimate
  const budgetEstimate: BudgetEstimate = {
    total: {
      min: tripDays * 100,
      max: tripDays * 200,
      currency: 'USD',
    },
    breakdown: {
      accommodation: { min: tripDays * 50, max: tripDays * 100 },
      food: { min: tripDays * 30, max: tripDays * 60 },
      activities: { min: tripDays * 20, max: tripDays * 50 },
      transport: { min: tripDays * 10, max: tripDays * 30 },
      misc: { min: tripDays * 10, max: tripDays * 20 },
    },
    perDay: 150,
    tips: [
      'Book attractions in advance for discounts',
      'Use public transport to save money',
      'Eat at local spots for authentic and affordable meals',
    ],
  };
  
  // Emergency contacts
  const emergencyContacts: EmergencyContact[] = [
    { type: 'police', name: 'Police', number: '110', notes: 'For emergencies' },
    { type: 'ambulance', name: 'Ambulance', number: '119', notes: 'Medical emergencies' },
    { type: 'embassy', name: 'US Embassy', number: '+1-XXX-XXX-XXXX', notes: 'For US citizens' },
  ];
  
  return {
    itinerary,
    safetyTips: MOCK_SAFETY_TIPS,
    packingList: MOCK_PACKING_ITEMS,
    culturalTips: MOCK_CULTURAL_TIPS,
    localPhrases: MOCK_PHRASES[destinationName] || MOCK_PHRASES.default,
    weatherForecast,
    budgetEstimate,
    emergencyContacts,
    generatedAt: new Date(),
    confidence: 0.85,
  };
}
