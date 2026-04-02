/**
 * ANIMATED SEARCH PLACEHOLDER
 * Smart typewriter effect — suggests destinations the user is NOT from.
 * Groups destinations by continent, filters out user's own continent,
 * and cycles through curiosity-driven, action-oriented phrases.
 */

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Text, Animated } from 'react-native';

// ─── Continent → Phrase pool ────────────────────────────────────────
// Each phrase is short enough to fit in the search bar (~35 chars max)
type Continent = 'europe' | 'asia' | 'americas' | 'africa' | 'oceania' | 'middle_east';

// Countries grouped by continent for random selection
const CONTINENT_COUNTRIES: Record<Continent, string[]> = {
  europe: ['France', 'Spain', 'Italy', 'Portugal', 'Greece', 'Netherlands', 'Germany', 'Switzerland', 'Croatia', 'Sweden', 'Austria', 'Ireland', 'Czech Republic', 'Norway', 'Belgium', 'Hungary', 'Poland', 'Romania', 'Denmark', 'Finland'],
  asia: ['Japan', 'Thailand', 'Vietnam', 'South Korea', 'Indonesia', 'India', 'Philippines', 'Malaysia', 'Taiwan', 'Cambodia', 'Nepal', 'Sri Lanka', 'Singapore', 'Myanmar', 'Laos', 'Mongolia', 'Uzbekistan', 'Georgia', 'Armenia', 'Kazakhstan'],
  americas: ['Mexico', 'Colombia', 'Peru', 'Brazil', 'Argentina', 'Costa Rica', 'Chile', 'Cuba', 'Ecuador', 'Guatemala', 'Bolivia', 'Uruguay', 'Panama', 'Jamaica', 'Dominican Republic', 'Puerto Rico', 'Honduras', 'Belize', 'Nicaragua', 'Canada'],
  africa: ['Morocco', 'South Africa', 'Kenya', 'Ghana', 'Tanzania', 'Egypt', 'Ethiopia', 'Senegal', 'Rwanda', 'Uganda', 'Namibia', 'Madagascar', 'Mozambique', 'Tunisia', 'Botswana', 'Zimbabwe', 'Nigeria', 'Zambia', 'Malawi', 'Cape Verde'],
  oceania: ['Australia', 'New Zealand', 'Fiji', 'Samoa', 'Tonga', 'Vanuatu', 'Papua New Guinea', 'Solomon Islands', 'Palau', 'Tahiti'],
  middle_east: ['Turkey', 'Jordan', 'Oman', 'UAE', 'Lebanon', 'Israel', 'Qatar', 'Saudi Arabia', 'Bahrain', 'Kuwait'],
};

// Snapshot-inspired phrase templates — {c} is replaced with a random country
// Each maps to a snapshot category to inspire curiosity
const SNAPSHOT_TEMPLATES = [
  // Culture & Social
  'Customs & etiquette in {c}',
  'Nightlife & social scene in {c}',
  "Do's & don'ts in {c}",
  // Getting Around
  'Public transit guide for {c}',
  'Airport arrival tips for {c}',
  // Safety & Risk
  'Safety tips for traveling in {c}',
  'Scams to watch for in {c}',
  'Solo female safety in {c}',
  // Money & Payments
  'Money-saving tips for {c}',
  'How much is a week in {c}?',
  // Health & Legal
  'Visa requirements for {c}',
  'Health & medication in {c}',
  // Food & Drink
  'Must-try street food in {c}',
  'Food etiquette in {c}',
  // Planning
  'Best time to visit {c}',
  'Hidden gems in {c}',
  // Language & Tech
  'Key phrases to know in {c}',
  'Essential apps for {c}',
];

// Generic phrases that always work (no destination)
const GENERIC_PHRASES = [
  'Where can we take you?',
  'Plan your dream getaway',
];

// Country → continent mapping (covers major countries)
const COUNTRY_CONTINENT: Record<string, Continent> = {
  // Europe
  france: 'europe', spain: 'europe', italy: 'europe', germany: 'europe',
  uk: 'europe', 'united kingdom': 'europe', portugal: 'europe', netherlands: 'europe',
  belgium: 'europe', switzerland: 'europe', austria: 'europe', greece: 'europe',
  sweden: 'europe', norway: 'europe', denmark: 'europe', finland: 'europe',
  ireland: 'europe', poland: 'europe', 'czech republic': 'europe', czechia: 'europe',
  hungary: 'europe', romania: 'europe', croatia: 'europe',
  // Asia
  japan: 'asia', china: 'asia', 'south korea': 'asia', korea: 'asia',
  india: 'asia', thailand: 'asia', vietnam: 'asia', indonesia: 'asia',
  malaysia: 'asia', singapore: 'asia', philippines: 'asia', taiwan: 'asia',
  cambodia: 'asia', myanmar: 'asia', nepal: 'asia', 'sri lanka': 'asia',
  // Americas
  'united states': 'americas', us: 'americas', usa: 'americas',
  canada: 'americas', mexico: 'americas', brazil: 'americas',
  colombia: 'americas', argentina: 'americas', peru: 'americas',
  chile: 'americas', ecuador: 'americas', cuba: 'americas',
  'costa rica': 'americas', panama: 'americas', jamaica: 'americas',
  'dominican republic': 'americas', guatemala: 'americas',
  // Africa
  morocco: 'africa', 'south africa': 'africa', kenya: 'africa',
  egypt: 'africa', nigeria: 'africa', ghana: 'africa', tanzania: 'africa',
  ethiopia: 'africa', senegal: 'africa', rwanda: 'africa', uganda: 'africa',
  // Oceania
  australia: 'oceania', 'new zealand': 'oceania', fiji: 'oceania',
  // Middle East
  uae: 'middle_east', 'united arab emirates': 'middle_east', dubai: 'middle_east',
  turkey: 'middle_east', jordan: 'middle_east', oman: 'middle_east',
  'saudi arabia': 'middle_east', qatar: 'middle_east', israel: 'middle_east',
  lebanon: 'middle_east',
};

// Also skip phrases that mention user's city directly
function phraseMatchesCity(phrase: string, city: string): boolean {
  if (!city) return false;
  return phrase.toLowerCase().includes(city.toLowerCase());
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ─── Timing ─────────────────────────────────────────────────────────
const TYPING_SPEED = 45;
const DELETING_SPEED = 25;
const PAUSE_AFTER_TYPING = 2500;
const PAUSE_AFTER_DELETING = 300;

interface Props {
  style?: any;
  userCity?: string;
  userCountry?: string;
}

export default function AnimatedSearchPlaceholder({ style, userCity, userCountry }: Props) {
  // Build a smart, filtered phrase list on mount
  const phrases = useMemo(() => {
    const country = (userCountry || '').toLowerCase().trim();
    const city = (userCity || '').trim();
    const userContinent = COUNTRY_CONTINENT[country];

    // Collect countries from continents the user is NOT on
    const continents = Object.keys(CONTINENT_COUNTRIES) as Continent[];
    let countryPool: string[] = [];
    for (const continent of continents) {
      if (continent === userContinent) continue;
      countryPool.push(...CONTINENT_COUNTRIES[continent]);
    }
    if (!userContinent) {
      countryPool = continents.flatMap(c => CONTINENT_COUNTRIES[c]);
    }
    // Remove user's own country/city from the pool
    if (country) {
      countryPool = countryPool.filter(c => c.toLowerCase() !== country);
    }
    if (city) {
      countryPool = countryPool.filter(c => c.toLowerCase() !== city.toLowerCase());
    }

    // Shuffle countries and templates independently
    const shuffledCountries = shuffle(countryPool);
    const shuffledTemplates = shuffle([...SNAPSHOT_TEMPLATES]);

    // Generate dynamic phrases by pairing templates with random countries
    const generated: string[] = [];
    const usedCountries = new Set<string>();
    for (let i = 0; i < Math.min(shuffledTemplates.length, 12); i++) {
      // Pick a country not yet used in this cycle for variety
      let pickedCountry = shuffledCountries[i % shuffledCountries.length];
      if (usedCountries.has(pickedCountry) && shuffledCountries.length > 12) {
        const unused = shuffledCountries.find(c => !usedCountries.has(c));
        if (unused) pickedCountry = unused;
      }
      usedCountries.add(pickedCountry);
      generated.push(shuffledTemplates[i].replace('{c}', pickedCountry));
    }

    // Filter out anything too long for the search bar (~42 chars max)
    const filtered = generated.filter(p => p.length <= 42);

    // Always start with a generic opener
    return [GENERIC_PHRASES[0], ...filtered.slice(0, 10)];
  }, [userCity, userCountry]);

  const [displayText, setDisplayText] = useState('');
  const phraseIndex = useRef(0);
  const charIndex = useRef(0);
  const isDeleting = useRef(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const phrasesRef = useRef(phrases);
  phrasesRef.current = phrases;
  const opacity = useRef(new Animated.Value(1)).current;

  const tick = useCallback(() => {
    const allPhrases = phrasesRef.current;
    const currentPhrase = allPhrases[phraseIndex.current % allPhrases.length];

    if (!isDeleting.current) {
      charIndex.current += 1;
      setDisplayText(currentPhrase.substring(0, charIndex.current));

      if (charIndex.current === currentPhrase.length) {
        timeoutRef.current = setTimeout(() => {
          isDeleting.current = true;
          tick();
        }, PAUSE_AFTER_TYPING);
        return;
      }
      timeoutRef.current = setTimeout(tick, TYPING_SPEED);
    } else {
      charIndex.current -= 1;
      setDisplayText(currentPhrase.substring(0, charIndex.current));

      if (charIndex.current === 0) {
        isDeleting.current = false;
        phraseIndex.current = (phraseIndex.current + 1) % allPhrases.length;
        timeoutRef.current = setTimeout(tick, PAUSE_AFTER_DELETING);
        return;
      }
      timeoutRef.current = setTimeout(tick, DELETING_SPEED);
    }
  }, []);

  useEffect(() => {
    timeoutRef.current = setTimeout(tick, TYPING_SPEED);
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [tick]);

  useEffect(() => {
    const blink = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0, duration: 400, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1, duration: 400, useNativeDriver: true }),
      ])
    );
    blink.start();
    return () => blink.stop();
  }, [opacity]);

  return (
    <Text style={style} numberOfLines={1}>
      {displayText}
      <Animated.Text style={{ opacity }}>|</Animated.Text>
    </Text>
  );
}
