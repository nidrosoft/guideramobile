/**
 * Journeys module — PUBLIC API (spec §2.3).
 * The ONLY surface the rest of the app may import. No deep imports from outside.
 */
export { JourneysHomeSection } from './screens/JourneysHomeSection';
export { JourneysHubScreen } from './screens/JourneysHubScreen';
export { JourneyGuideScreen } from './screens/JourneyGuideScreen';
export { JourneySearchResultsScreen } from './screens/JourneySearchResultsScreen';
export { ToolkitScreen } from './screens/ToolkitScreen';
export { JourneyChatScreen } from './screens/JourneyChatScreen';
export { BriefingResultScreen } from './screens/BriefingResultScreen';
export { BriefingSheet } from './components/briefing/BriefingSheet';
export { JourneysCommunityEntry } from './screens/JourneysCommunityEntry';

export { JOURNEYS_ROUTES, openJourney, openGuide, openJourneysHub, openToolkit, openChat } from './navigation/routes';
export { JOURNEYS_CONFIG } from './config/journeys.config';

export { prefetchJourneyCatalog } from './services/journeyContent.service';
export { useJourneyCatalog } from './hooks/useJourneyCatalog';

export type { JourneyCategory, JourneyGuide, JourneyContinent, GuideStub } from './types';
