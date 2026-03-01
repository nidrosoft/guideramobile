/**
 * DESIGN SYSTEM — ICON COLOR PALETTE
 *
 * Used for category icons, chart legends, agent avatars.
 * Each color has a solid value plus bg (8%) and border (15%) variants.
 */

export const iconColors = {
  primary: '#3FC39E',
  purple: '#A855F7',
  blue: '#3B82F6',
  yellow: '#EAB308',
  green: '#28C840',
  pink: '#EC4899',
  orange: '#F97316',
  cyan: '#06B6D4',
};

// Helper to get icon color by index (cycles through colors)
export const getIconColor = (index: number): string => {
  const vals = Object.values(iconColors);
  return vals[index % vals.length];
};

// Helper to get icon container styles (bg + border) for a given color
export const getIconContainerStyle = (color: string) => ({
  backgroundColor: `${color}10`,  // ~6% opacity
  borderWidth: 1,
  borderColor: `${color}1A`,      // ~10% opacity
});
