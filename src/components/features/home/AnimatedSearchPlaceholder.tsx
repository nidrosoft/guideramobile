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

const DESTINATION_PHRASES: Record<Continent, string[]> = {
  europe: [
    'What\'s Paris like in spring?',
    'Explore Barcelona for 5 days',
    'Do\'s & don\'ts in Italy',
    'Budget trip to Portugal',
    'A weekend in Amsterdam',
  ],
  asia: [
    'Discover Tokyo on a budget',
    'What to know before Bali',
    'Street food tour in Bangkok',
    'Cultural tips for South Korea',
    'Explore the Philippines',
  ],
  americas: [
    'What\'s Medellín really like?',
    'Road trip through Mexico',
    'Budget guide to Peru',
    'Explore Buenos Aires culture',
    'Best of Rio in 4 days',
  ],
  africa: [
    'Safari tips for Kenya',
    'What to know about Morocco',
    'Discover Cape Town beaches',
    'Culture guide to Ghana',
    'Hidden gems in Tanzania',
  ],
  oceania: [
    'Road trip across Australia',
    'Best of New Zealand in 7 days',
    'Explore Fiji on a budget',
    'Surfing spots in Bali',
    'What\'s Sydney really like?',
  ],
  middle_east: [
    'Discover Dubai on a budget',
    'Cultural tips for Jordan',
    'What to see in Istanbul',
    'Explore Oman\'s hidden gems',
    'Best of Egypt in 5 days',
  ],
};

// Snapshot-capability phrases — continent-neutral, action-based
// These highlight what the AI brief can do to invite curiosity
const CAPABILITY_PHRASES = [
  'How much is a week abroad?',
  'Do\'s & don\'ts before you fly',
  'Scams to avoid while traveling',
  'Learn key phrases before you go',
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

    // Collect phrases from continents the user is NOT on
    let pool: string[] = [];
    const continents = Object.keys(DESTINATION_PHRASES) as Continent[];

    for (const continent of continents) {
      if (continent === userContinent) continue; // skip user's continent
      pool.push(...DESTINATION_PHRASES[continent]);
    }

    // If user continent unknown, use all destination phrases
    if (!userContinent) {
      pool = continents.flatMap(c => DESTINATION_PHRASES[c]);
    }

    // Filter out phrases that mention user's city
    if (city) {
      pool = pool.filter(p => !phraseMatchesCity(p, city));
    }

    // Pick 6 continent-based phrases (shuffled)
    const destinationPicks = shuffle(pool).slice(0, 6);

    // Interleave: generic opener → destination → capability → destination → ...
    const shuffledCapabilities = shuffle([...CAPABILITY_PHRASES]);
    const interleaved: string[] = [];
    let dIdx = 0;
    let cIdx = 0;
    while (dIdx < destinationPicks.length || cIdx < shuffledCapabilities.length) {
      if (dIdx < destinationPicks.length) interleaved.push(destinationPicks[dIdx++]);
      if (cIdx < shuffledCapabilities.length && dIdx % 2 === 0) interleaved.push(shuffledCapabilities[cIdx++]);
    }
    // Append any remaining capability phrases
    while (cIdx < shuffledCapabilities.length) interleaved.push(shuffledCapabilities[cIdx++]);

    // Always start with a generic opener
    return [GENERIC_PHRASES[0], ...interleaved];
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
