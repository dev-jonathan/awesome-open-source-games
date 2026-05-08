import { useMemo, useState, useEffect, useCallback } from 'react';
import Fuse from 'fuse.js';
import {
  FinalGame,
  FilterState,
  PRIMARY_CATEGORIES,
  SortOption,
} from './types';
import { SearchBar } from './SearchBar';
import { CategoryTabs } from './CategoryTabs';
import { AdvancedAccordion } from './AdvancedAccordion';
import { GameGrid } from './GameGrid';
import { SortSelector } from './SortSelector';
import { GameModal } from './GameModal';

import gamesData from '../../src/data/final_games.json';

const allGames = gamesData as FinalGame[];

const fuse = new Fuse(allGames, {
  keys: [
    { name: 'name', weight: 0.7 },
    { name: 'description', weight: 0.3 },
    { name: 'tags', weight: 0.2 },
  ],
  threshold: 0.2, // lowered to prevent false matches like Bombinhas for zombie
  includeScore: true,
  ignoreLocation: true,
});

export function GameExplorer() {
  const [filterState, setFilterState] = useState<FilterState>(() => {
    // Initial state from URL
    const params = new URLSearchParams(window.location.search);
    const q = params.get('q') || '';
    const catsParam = params.get('cat');
    const subcatsParam = params.get('sub');

    let cats: string[] = [];
    if (catsParam) {
      cats = catsParam.split(',');
    } else {
      cats = [...PRIMARY_CATEGORIES];
    }

    const subcats = subcatsParam ? subcatsParam.split(',') : [];

    return {
      query: q,
      categories: cats.filter((c) => PRIMARY_CATEGORIES.includes(c)),
      advancedCategories: cats.filter((c) => !PRIMARY_CATEGORIES.includes(c)),
      subcategories: subcats,
      sortBy: 'stars' as SortOption,
      showAdvanced: false,
    };
  });

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isAccordionOpen, setIsAccordionOpen] = useState(false);
  const [randomSeed, setRandomSeed] = useState(() => Math.random());
  const [selectedGame, setSelectedGame] = useState<FinalGame | null>(null);

  // Sync state to URL
  useEffect(() => {
    const params = new URLSearchParams();
    if (filterState.query) params.set('q', filterState.query);

    const allActiveCats = [
      ...filterState.categories,
      ...filterState.advancedCategories,
    ];
    if (allActiveCats.length > 0) {
      params.set('cat', allActiveCats.join(','));
    }

    if (filterState.subcategories.length > 0) {
      params.set('sub', filterState.subcategories.join(','));
    }

    const newRelativePathQuery =
      window.location.pathname +
      (params.toString() ? '?' + params.toString() : '');
    window.history.replaceState(null, '', newRelativePathQuery);
  }, [
    filterState.query,
    filterState.categories,
    filterState.advancedCategories,
    filterState.subcategories,
  ]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    allGames.forEach((g) => {
      if (g.category && !g.isCompany) {
        counts[g.category] = (counts[g.category] || 0) + 1;
      }
    });
    return counts;
  }, []);

  const subcategoryCounts = useMemo(() => {
    const counts: Record<string, Record<string, number>> = {};
    allGames.forEach((g) => {
      if (g.category && g.subcategory && !g.isCompany) {
        if (!counts[g.category]) counts[g.category] = {};
        counts[g.category][g.subcategory] =
          (counts[g.category][g.subcategory] || 0) + 1;
      }
    });
    return counts;
  }, []);

  const allCategoriesList = useMemo(() => {
    return Object.keys(categoryCounts).sort((a, b) => {
      const isAPrimary = PRIMARY_CATEGORIES.includes(a);
      const isBPrimary = PRIMARY_CATEGORIES.includes(b);
      if (isAPrimary && !isBPrimary) return -1;
      if (!isAPrimary && isBPrimary) return 1;
      return categoryCounts[b] - categoryCounts[a];
    });
  }, [categoryCounts]);

  const visibleGames = useMemo(() => {
    let result = allGames;

    if (filterState.query.length > 1) {
      // Global search - ignore category/subcategory filters
      result = fuse.search(filterState.query).map((r) => r.item);
    } else {
      // Filtered view
      // Filter companies out by default in filtered view
      result = result.filter((g) => !g.isCompany);

      // Filter by Categories
      const activeCats = [
        ...filterState.categories,
        ...filterState.advancedCategories,
      ];

      if (activeCats.length > 0) {
        result = result.filter((g) => activeCats.includes(g.category));
      } else {
        // If no categories are selected and no search, show nothing
        return [];
      }

      // Filter by Subcategories if any are selected
      if (filterState.subcategories.length > 0) {
        result = result.filter(
          (g) =>
            g.subcategory && filterState.subcategories.includes(g.subcategory),
        );
      }
    }

    result = [...result];
    if (filterState.sortBy === 'relevance') {
      result.sort(
        (a, b) =>
          (b.stats?.relevanceScore || 0) - (a.stats?.relevanceScore || 0),
      );
    } else if (filterState.sortBy === 'stars') {
      result.sort((a, b) => (b.stats?.stars || 0) - (a.stats?.stars || 0));
    } else if (filterState.sortBy === 'newest') {
      result.sort((a, b) => {
        const tA = a.stats?.lastPush ? new Date(a.stats.lastPush).getTime() : 0;
        const tB = b.stats?.lastPush ? new Date(b.stats.lastPush).getTime() : 0;
        return tB - tA;
      });
    } else if (filterState.sortBy === 'random') {
      const strToNum = (str: string) => {
        let hash = 0;
        if (!str) return hash;
        for (let i = 0; i < str.length; i++) {
          hash = str.charCodeAt(i) + ((hash << 5) - hash);
          hash = hash & hash;
        }
        return hash;
      };
      result.sort((a, b) => {
        const rA = Math.sin(strToNum(a.id) * randomSeed);
        const rB = Math.sin(strToNum(b.id) * randomSeed);
        return rA - rB;
      });
    }

    return result;
  }, [filterState, randomSeed]);

  const toggleCategory = (cat: string) => {
    setFilterState((prev) => {
      const isPrimary = PRIMARY_CATEGORIES.includes(cat);
      const list = isPrimary ? prev.categories : prev.advancedCategories;
      const isActive = list.includes(cat);
      const newList = isActive ? list.filter((c) => c !== cat) : [...list, cat];

      // If we uncheck a category, also uncheck its subcategories
      let newSubcats = prev.subcategories;
      if (isActive) {
        const subcatsForThisCat = Object.keys(subcategoryCounts[cat] || {});
        newSubcats = prev.subcategories.filter(
          (s) => !subcatsForThisCat.includes(s),
        );
      }

      return {
        ...prev,
        categories: isPrimary ? newList : prev.categories,
        advancedCategories: isPrimary ? prev.advancedCategories : newList,
        subcategories: newSubcats,
      };
    });
  };

  const toggleSubcategory = (sub: string, parentCat: string) => {
    setFilterState((prev) => {
      const isSubActive = prev.subcategories.includes(sub);
      const newSubcats = isSubActive
        ? prev.subcategories.filter((c) => c !== sub)
        : [...prev.subcategories, sub];

      // UX Improvement: If sub is being activated and parentCat is NOT active, activate parentCat
      const isParentActive =
        prev.categories.includes(parentCat) ||
        prev.advancedCategories.includes(parentCat);

      let newCategories = prev.categories;
      let newAdvancedCategories = prev.advancedCategories;

      if (!isSubActive && !isParentActive) {
        if (PRIMARY_CATEGORIES.includes(parentCat)) {
          newCategories = [...prev.categories, parentCat];
        } else {
          newAdvancedCategories = [...prev.advancedCategories, parentCat];
        }
      }

      return {
        ...prev,
        subcategories: newSubcats,
        categories: newCategories,
        advancedCategories: newAdvancedCategories,
      };
    });
  };

  const handleSortChange = (sort: SortOption) => {
    if (sort === 'random') setRandomSeed(Math.random());
    setFilterState((prev) => ({ ...prev, sortBy: sort }));
  };

  const handleSearch = useCallback((q: string) => {
    setFilterState((prev) => {
      if (prev.query === q) return prev;
      return { ...prev, query: q };
    });
  }, []);

  return (
    <div className="w-full relative pb-20 pt-8" id="games">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 mb-8 z-50 relative animate-in fade-in slide-in-from-bottom-2 duration-1000 fill-mode-both">
        <div className="flex flex-col-reverse md:flex-row md:items-center justify-between gap-6">
          <div className="flex flex-wrap items-center gap-4">
            <SortSelector
              currentSort={filterState.sortBy}
              onChange={handleSortChange}
            />
            <CategoryTabs
              categories={[
                ...filterState.categories,
                ...filterState.advancedCategories,
              ]}
              onToggle={toggleCategory}
              onOpenAdvanced={() => setIsDrawerOpen(true)}
              onToggleAdvanced2={() => setIsAccordionOpen(!isAccordionOpen)}
              isAdvancedOpen={isAccordionOpen}
            />
          </div>
          <SearchBar initialValue={filterState.query} onSearch={handleSearch} />
        </div>
        <AdvancedAccordion
          isOpen={isAccordionOpen}
          allCategories={allCategoriesList}
          categoryCounts={categoryCounts}
          subcategoryCounts={subcategoryCounts}
          filterState={filterState}
          onToggleCategory={toggleCategory}
          onToggleSubcategory={toggleSubcategory}
          onChangeSort={handleSortChange}
        />
      </div>

      <div className="relative z-0">
        <GameGrid games={visibleGames} onGameClick={setSelectedGame} />
      </div>

      {selectedGame && (
        <GameModal
          game={selectedGame}
          isOpen={!!selectedGame}
          onClose={() => setSelectedGame(null)}
        />
      )}
    </div>
  );
}
