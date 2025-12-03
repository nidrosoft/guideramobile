// Trip Planner Plugin Types

export enum ActivityType {
  FLIGHT = 'flight',
  HOTEL = 'hotel',
  RESTAURANT = 'restaurant',
  ATTRACTION = 'attraction',
  ACTIVITY = 'activity',
  TRANSPORT = 'transport',
  COFFEE = 'coffee',
  SHOPPING = 'shopping',
  CUSTOM = 'custom',
}

export interface Activity {
  id: string;
  type: ActivityType;
  title: string;
  subtitle?: string;
  time: string;
  duration?: string;
  location?: string;
  icon?: string; // For custom activities (emoji)
  color?: string; // For custom activities
}

export interface DayItinerary {
  dayNumber: number;
  date: string;
  activities: Activity[];
}

export interface TripPlan {
  tripId: string;
  days: DayItinerary[];
}
