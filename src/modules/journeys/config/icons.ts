/**
 * Icon key -> iconsax-react-native component map (spec §16.1, adapted to the
 * app's icon library). DB stores string keys; the client maps to components.
 */
import {
  Health, Building, Buildings2, Briefcase, Sun1, Heart, Profile2User, Teacher,
  Routing, Routing2, Map1, People, Global, Star1, Activity, Lovely,
  MedalStar, Clock,
  type Icon,
} from 'iconsax-react-native';

export type JourneyIcon = Icon;

export const ICONS: Record<string, Icon> = {
  // journeys
  stethoscope: Health,
  building: Building,
  briefcase: Briefcase,
  sun: Sun1,
  heart: Heart,
  baby: Lovely,
  shield: Profile2User,
  cap: Teacher,
  footprints: Routing,
  mountain: Map1,
  dna: Profile2User,
  heartpulse: Activity,
  landmark: Buildings2,
  backpack: Briefcase,
  handshake: People,
  users: Profile2User,
  // sub-hubs
  smile: Health,
  sparkles: Star1,
  activity: Activity,
  // quick-fact icons
  'trending-down': Routing2,
  clock: Clock,
  languages: Global,
  'badge-check': MedalStar,
};

export const getIcon = (key?: string | null): Icon => ICONS[key ?? ''] ?? Global;
