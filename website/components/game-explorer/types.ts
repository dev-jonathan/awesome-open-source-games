export interface GameStats {
  stars: number;
  commits: number;
  lastPush: string | null;
  relevanceScore: number;
}

export interface FinalGame {
  id: string;
  name: string;
  link: string;
  links?: string[];
  description: string;
  category: string;
  subcategory?: string;
  tags?: string[];
  isAdvanced?: boolean;
  isCompany?: boolean;
  hasImage: boolean;
  images?: string[];
  stats?: GameStats;
  language?: string;
}

export type SortOption = 'relevance' | 'stars' | 'newest' | 'random';

export interface FilterState {
  query: string;
  categories: string[];
  advancedCategories: string[];
  subcategories: string[];
  sortBy: SortOption;
  showAdvanced: boolean;
}

export const PRIMARY_CATEGORIES = ['Browser-Based', 'Native', 'Mobile Games'];
