/**
 * ICON COLOR PALETTE
 * 
 * Top 5 colors for icons throughout the app
 * Use these consistently for all icon backgrounds
 */

export const iconColors = {
  purple: '#8B5CF6',   // Purple - for location, time
  blue: '#3B82F6',     // Blue - for language, info
  yellow: '#F59E0B',   // Yellow/Gold - for ratings, stars
  green: '#10B981',    // Green - for verified, success
  pink: '#EC4899',     // Pink - for favorites, highlights
};

// Helper to get icon color by index (cycles through colors)
export const getIconColor = (index: number): string => {
  const colors = Object.values(iconColors);
  return colors[index % colors.length];
};
