/**
 * FEED TYPES
 * 
 * Type definitions for the group feed system including
 * posts, comments, reactions, and social connections.
 */

export type PostType =
  | 'general'
  | 'checkin'
  | 'question'
  | 'tip'
  | 'buddy_request'
  | 'photo_journal'
  | 'safety_alert'
  | 'hidden_gem'
  | 'cost_report';

export type PostStatus = 'draft' | 'pending' | 'published' | 'rejected' | 'removed';

export type ReactionType = 'love' | 'been_there' | 'helpful' | 'want_to_go' | 'fire';

export type PostSortOption = 'recent' | 'popular' | 'pinned';

export type BuddyStatus = 'pending' | 'accepted' | 'declined' | 'blocked';

export interface PostAuthor {
  id: string;
  firstName: string;
  lastName: string;
  avatar: string;
  isVerified: boolean;
  country?: string;
  countryCode?: string;
}

export interface PostLocation {
  name: string;
  lat?: number;
  lng?: number;
  verified: boolean;
}

export interface ReactionsCount {
  love: number;
  been_there: number;
  helpful: number;
  want_to_go: number;
  fire: number;
}

export interface FeedPost {
  id: string;
  groupId: string;
  author: PostAuthor;
  postType: PostType;
  content: string;
  photos: string[];
  tags: string[];
  location?: PostLocation;
  status: PostStatus;
  isPinned: boolean;
  isAnswered: boolean;
  reactionsCount: ReactionsCount;
  commentCount: number;
  myReaction?: ReactionType | null;
  createdAt: string;
  updatedAt: string;
  // Buddy request specific
  buddyDetails?: BuddyRequestDetails;
  // Cost report specific
  costItems?: CostReportItem[];
}

export interface BuddyRequestDetails {
  destination: string;
  startDate: string;
  endDate: string;
  groupSizeMin: number;
  groupSizeMax: number;
  vibeTags: string[];
  budgetRange: string;
  languages: string[];
  interestedCount: number;
}

export interface CostReportItem {
  category: string;
  label: string;
  amount: number;
  currency: string;
}

export interface FeedComment {
  id: string;
  postId: string;
  author: PostAuthor;
  content: string;
  likeCount: number;
  isLiked: boolean;
  isAuthorReply: boolean;
  parentCommentId: string | null;
  replies?: FeedComment[];
  createdAt: string;
}

export interface ReactionConfig {
  type: ReactionType;
  icon: string;
  label: string;
  activeColor: string;
}

export const REACTION_CONFIGS: ReactionConfig[] = [
  { type: 'love', icon: 'heart', label: 'Love', activeColor: '#EF4444' },
  { type: 'been_there', icon: 'airplane', label: 'Been There', activeColor: '#3B82F6' },
  { type: 'helpful', icon: 'lamp-charge', label: 'Helpful', activeColor: '#F59E0B' },
  { type: 'want_to_go', icon: 'flag', label: 'Want to Go', activeColor: '#8B5CF6' },
  { type: 'fire', icon: 'flash', label: 'Fire', activeColor: '#F97316' },
];

export const POST_TYPE_CONFIGS: Record<PostType, { label: string; icon: string; color: string }> = {
  general: { label: 'Post', icon: 'edit-2', color: '#6B7280' },
  checkin: { label: 'Check-in', icon: 'location', color: '#3B82F6' },
  question: { label: 'Question', icon: 'message-question', color: '#8B5CF6' },
  tip: { label: 'Travel Tip', icon: 'lamp-charge', color: '#F59E0B' },
  buddy_request: { label: 'Find Buddy', icon: 'people', color: '#EC4899' },
  photo_journal: { label: 'Photo Journal', icon: 'camera', color: '#06B6D4' },
  safety_alert: { label: 'Safety Alert', icon: 'shield-tick', color: '#EF4444' },
  hidden_gem: { label: 'Hidden Gem', icon: 'discover', color: '#10B981' },
  cost_report: { label: 'Cost Report', icon: 'wallet-2', color: '#F97316' },
};

export interface TravelerProfile {
  id: string;
  firstName: string;
  lastName: string;
  avatar: string;
  coverPhoto?: string;
  bio?: string;
  city?: string;
  country?: string;
  countryCode?: string;
  isVerified: boolean;
  stats: {
    tripsCount: number;
    countriesVisited: number;
    reviewsCount: number;
    groupsCount: number;
  };
  travelInterests: string[];
  countriesVisited: string[];
  mutualGroups: string[];
  buddyStatus: BuddyStatus | null;
  isFollowing: boolean;
}
