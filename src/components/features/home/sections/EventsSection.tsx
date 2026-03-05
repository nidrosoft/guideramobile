/**
 * EVENTS SECTION
 * 
 * Displays events you may like with stacked cards.
 * Uses AI event discovery (Gemini + Google Search grounding)
 * to fetch real events based on user location.
 */

import { useState, useEffect, useMemo } from 'react';
import * as Location from 'expo-location';
import StackedEventCards from '@/components/features/home/StackedEventCards';
import type { EventCardData } from '@/components/features/home/StackedEventCards';
import { useEvents } from '@/hooks/useEvents';
import { eventsService, DiscoveredEvent } from '@/services/events.service';

const DEFAULT_CITY = 'San Diego';
const DEFAULT_COUNTRY = 'United States';

// Map suburbs/small cities to their nearest major metro area (~30mi radius)
// This ensures broader event coverage instead of hyper-local results
const METRO_AREA_MAP: Record<string, string> = {
  // San Diego metro
  'La Mesa': 'San Diego', 'El Cajon': 'San Diego', 'Chula Vista': 'San Diego',
  'National City': 'San Diego', 'Santee': 'San Diego', 'Lemon Grove': 'San Diego',
  'Spring Valley': 'San Diego', 'Escondido': 'San Diego', 'Oceanside': 'San Diego',
  'Carlsbad': 'San Diego', 'Encinitas': 'San Diego', 'Poway': 'San Diego',
  'San Marcos': 'San Diego', 'Vista': 'San Diego', 'Imperial Beach': 'San Diego',
  'Coronado': 'San Diego', 'Del Mar': 'San Diego', 'Solana Beach': 'San Diego',
  // Los Angeles metro
  'Santa Monica': 'Los Angeles', 'Burbank': 'Los Angeles', 'Glendale': 'Los Angeles',
  'Pasadena': 'Los Angeles', 'Long Beach': 'Los Angeles', 'Torrance': 'Los Angeles',
  'Inglewood': 'Los Angeles', 'Culver City': 'Los Angeles', 'Beverly Hills': 'Los Angeles',
  'West Hollywood': 'Los Angeles', 'Compton': 'Los Angeles', 'Downey': 'Los Angeles',
  'Pomona': 'Los Angeles', 'Alhambra': 'Los Angeles', 'Arcadia': 'Los Angeles',
  // San Francisco metro
  'Oakland': 'San Francisco', 'Berkeley': 'San Francisco', 'Daly City': 'San Francisco',
  'San Mateo': 'San Francisco', 'Fremont': 'San Francisco', 'Hayward': 'San Francisco',
  'Palo Alto': 'San Francisco', 'Mountain View': 'San Francisco', 'Sunnyvale': 'San Francisco',
  'Redwood City': 'San Francisco', 'San Rafael': 'San Francisco',
  // New York metro
  'Brooklyn': 'New York', 'Queens': 'New York', 'Bronx': 'New York',
  'Jersey City': 'New York', 'Hoboken': 'New York', 'Newark': 'New York',
  'Yonkers': 'New York', 'White Plains': 'New York', 'Stamford': 'New York',
  // Chicago metro
  'Evanston': 'Chicago', 'Oak Park': 'Chicago', 'Naperville': 'Chicago',
  'Schaumburg': 'Chicago', 'Skokie': 'Chicago', 'Cicero': 'Chicago',
  // Other major metros
  'Arlington': 'Dallas', 'Plano': 'Dallas', 'Irving': 'Dallas', 'Frisco': 'Dallas',
  'Fort Worth': 'Dallas', 'Mesa': 'Phoenix', 'Tempe': 'Phoenix', 'Scottsdale': 'Phoenix',
  'Chandler': 'Phoenix', 'Gilbert': 'Phoenix', 'Bellevue': 'Seattle', 'Tacoma': 'Seattle',
  'Redmond': 'Seattle', 'Kirkland': 'Seattle', 'Aurora': 'Denver', 'Lakewood': 'Denver',
  'Pembroke Pines': 'Miami', 'Hialeah': 'Miami', 'Fort Lauderdale': 'Miami',
  'Hollywood': 'Miami', 'Coral Gables': 'Miami', 'Miami Beach': 'Miami',
  'Cambridge': 'Boston', 'Somerville': 'Boston', 'Brookline': 'Boston',
};

function resolveMetroArea(city: string): string | undefined {
  return METRO_AREA_MAP[city];
}

export default function EventsSection() {
  const [city, setCity] = useState(DEFAULT_CITY);
  const [country, setCountry] = useState(DEFAULT_COUNTRY);

  // Attempt to resolve user location to city/country
  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') return;

        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        const [geo] = await Location.reverseGeocodeAsync({
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
        });

        if (geo?.city) setCity(geo.city);
        if (geo?.country) setCountry(geo.country);
      } catch {
        // Fall back to defaults
      }
    })();
  }, []);

  const metroArea = resolveMetroArea(city);

  const { events: discoveredEvents, loading } = useEvents({
    city: metroArea || city,
    country,
    enabled: true,
  });

  const eventCards: EventCardData[] = useMemo(() => {
    return discoveredEvents.map((e: DiscoveredEvent) => ({
      id: e.id,
      eventName: e.event_name,
      category: e.category,
      venue: e.venue || '',
      city: e.city,
      date: eventsService.formatEventDate(e.date_start),
      time: e.time_info || 'See details',
      ticketPrice: e.ticket_price || (e.is_free ? 'Free' : 'See details'),
      attendees: e.estimated_attendees || '',
      rating: e.rating,
      image: e.image_url || '',
    }));
  }, [discoveredEvents]);

  return <StackedEventCards events={eventCards} loading={loading} />;
}
