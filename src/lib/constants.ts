// Pin categories used throughout the app
export const PIN_CATEGORIES = [
  'Attraction',
  'Restaurant', 
  'Hotel',
  'Museum',
  'Bar',
  'Park',
  'Transportation',
  'Shopping',
  'Entertainment',
  'Other'
] as const;

// Category colors for map markers
export const CATEGORY_COLORS: Record<string, string> = {
  'Museum': '#4285F4',
  'Attraction': '#EA4335',
  'Hotel': '#9C27B0',
  'Restaurant': '#FF9800',
  'Bar': '#FBBC05',
  'Park': '#34A853',
  'Transportation': '#E91E63',
  'Shopping': '#00B0FF',
  'Entertainment': '#FFEB3B',
  'Other': '#757575',
  'default': '#757575'
};

export type PinCategory = typeof PIN_CATEGORIES[number]; 