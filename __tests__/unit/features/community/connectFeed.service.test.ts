const mockRpc = jest.fn();
const mockFrom = jest.fn();
const mockDiscoverGroups = jest.fn();
const mockUpcomingEvents = jest.fn();

jest.mock('@/lib/supabase/client', () => ({
  supabase: {
    rpc: (...args: any[]) => mockRpc(...args),
    from: (...args: any[]) => mockFrom(...args),
  },
}));

jest.mock('@/services/community/group.service', () => ({
  groupService: {
    discoverGroups: (...args: any[]) => mockDiscoverGroups(...args),
    getUserGroups: jest.fn(),
  },
}));

jest.mock('@/services/community/event.service', () => ({
  eventService: {
    getUpcomingEvents: (...args: any[]) => mockUpcomingEvents(...args),
  },
}));

import { getDiscoverCoreFeed } from '@/features/community/services/connectFeed.service';

describe('connectFeed.service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRpc.mockResolvedValue({
      data: {
        groups: [
          {
            id: 'group-1',
            name: 'Guidera Welcome Lounge',
            coverImage: 'cover.jpg',
            groupPhotoUrl: 'avatar.jpg',
            description: 'Official starter group',
            memberCount: 2,
            isOfficial: true,
            isVerified: true,
            privacy: 'public',
            category: 'interest',
            tags: ['official'],
          },
        ],
        events: [],
        destinations: [],
        cursors: { groups: '95:group-1', events: null, destinations: null },
      },
      error: null,
    });
    mockDiscoverGroups.mockResolvedValue([]);
    mockUpcomingEvents.mockResolvedValue([]);
    mockFrom.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      limit: jest.fn().mockResolvedValue({ data: [], error: null }),
    });
  });

  it('loads the Discover core feed through one bundled RPC', async () => {
    const result = await getDiscoverCoreFeed({
      userId: 'user-1',
      memberGroupIds: new Set(['group-1']),
      limit: 6,
    });

    expect(mockRpc).toHaveBeenCalledTimes(1);
    expect(mockRpc).toHaveBeenCalledWith('connect_discover_feed', {
      p_user_id: 'user-1',
      p_groups_limit: 6,
      p_groups_cursor: null,
      p_events_limit: 5,
      p_events_cursor: null,
      p_destinations_limit: 8,
      p_destinations_cursor: null,
    });
    expect(result.trendingGroups[0]).toMatchObject({
      id: 'group-1',
      isMember: true,
      isOfficial: true,
    });
    expect(result.cursors.groups).toBe('95:group-1');
  });

  it('falls back to existing reads when the bundled RPC is missing from the API schema cache', async () => {
    mockRpc.mockResolvedValueOnce({
      data: null,
      error: {
        code: 'PGRST202',
        message: 'Could not find the function public.connect_discover_feed in the schema cache',
      },
    });
    mockDiscoverGroups.mockResolvedValueOnce([
      {
        id: 'group-fallback',
        name: 'US Weekend Explorers',
        coverPhotoUrl: 'cover.jpg',
        memberCount: 2,
        isOfficial: true,
        privacy: 'public',
        category: 'destination',
        tags: ['weekend'],
      },
    ]);

    const result = await getDiscoverCoreFeed({
      userId: 'user-1',
      memberGroupIds: new Set(['group-fallback']),
    });

    expect(mockDiscoverGroups).toHaveBeenCalledWith({ limit: 6 });
    expect(result.trendingGroups[0]).toMatchObject({
      id: 'group-fallback',
      isMember: true,
      isOfficial: true,
    });
  });
});
