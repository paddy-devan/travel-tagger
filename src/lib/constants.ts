// Single source of truth for categories
export const CATEGORIES = {
  'Attraction': { color: '#EA4335' },
  'Restaurant': { color: '#FF9800' },
  'Hotel': { color: '#9C27B0' },
  'Museum': { color: '#4285F4' },
  'Bar': { color: '#FBBC05' },
  'Park': { color: '#34A853' },
  'Transportation': { color: '#E91E63' },
  'Shopping': { color: '#00B0FF' },
  'Entertainment': { color: '#FFEB3B' },
  'The Moon': { color: '#FFEB3B' },
  'Other': { color: '#757575' }
} as const;

// Derived arrays and mappings (no duplication!)
export const PIN_CATEGORIES = Object.keys(CATEGORIES) as (keyof typeof CATEGORIES)[];
export const CATEGORY_COLORS = Object.fromEntries(
  Object.entries(CATEGORIES).map(([name, { color }]) => [name, color])
);

// Helper function with fallback
export const getCategoryColor = (category: string | null): string => {
  if (!category || !(category in CATEGORIES)) return '#757575';
  return CATEGORIES[category as keyof typeof CATEGORIES].color;
};

export type PinCategory = keyof typeof CATEGORIES; 