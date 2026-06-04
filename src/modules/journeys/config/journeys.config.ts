/**
 * Journeys module — feature flags & tunables (spec §2.4).
 */
export const JOURNEYS_CONFIG = {
  enabled: true,
  homeSection: { enabled: true, maxCards: 8 },
  communityEntry: { enabled: true },
  search: { enabled: true },
  toolkit: { enabled: true },
  chat: { enabled: true },

  ai: {
    model: process.env.JOURNEYS_CLAUDE_MODEL ?? 'claude-sonnet-4-20250514',
    maxTokensGuide: 4096,
    maxTokensSearch: 1500,
    promptVersionGuide: 3,
    promptVersionSearch: 2,
    usePromptCaching: true,
  },

  cache: {
    guideStaleDays: 120,
    searchProfileStaleDays: 180,
  },

  pro: {
    providers: true,
    toolkitFull: true,
    peerMatching: true,
    aftercareDeepDive: false,
  },
} as const;
