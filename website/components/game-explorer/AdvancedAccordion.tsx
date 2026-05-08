import { FilterState, SortOption } from './types';
import { Check, ChevronDown, ChevronRight } from 'lucide-react';
import { formatCategory } from '@/lib/utils';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';

export function AdvancedAccordion({
  isOpen,
  allCategories,
  categoryCounts,
  subcategoryCounts,
  filterState,
  onToggleCategory,
  onToggleSubcategory,
  onChangeSort,
}: {
  isOpen: boolean;
  allCategories: string[];
  categoryCounts: Record<string, number>;
  subcategoryCounts: Record<string, Record<string, number>>;
  filterState: FilterState;
  onToggleCategory: (cat: string) => void;
  onToggleSubcategory: (sub: string, parentCat: string) => void;
  onChangeSort: (sort: SortOption) => void;
}) {
  const [expandedCats, setExpandedCats] = useState<string[]>([]);

  if (!isOpen) return null;

  const toggleExpand = (cat: string) => {
    setExpandedCats((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat],
    );
  };

  return (
    <div className="w-full bg-[#0a0a0a] border border-white/10 mt-4 p-5 animate-in slide-in-from-top-2 duration-300">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-sm text-white/80">
        {/* Sort Column */}
        <div className="space-y-4">
          <h3 className="uppercase tracking-widest text-xs font-bold text-white/50 border-b border-white/10 pb-2">
            Sort Results
          </h3>
          <div className="flex flex-wrap gap-2">
            {(['relevance', 'stars', 'newest', 'random'] as SortOption[]).map(
              (s) => (
                <Button
                  key={s}
                  variant={filterState.sortBy === s ? 'default' : 'outline'}
                  onClick={() => onChangeSort(s)}
                  className={`rounded-none px-4 py-2 border text-center transition-all h-auto ${
                    filterState.sortBy === s
                      ? 'bg-indigo-500/20 border-indigo-500 text-white font-medium hover:bg-indigo-500/30'
                      : 'bg-black/20 border-white/10 hover:border-white/30 text-white/70 hover:text-white'
                  }`}
                >
                  {s === 'random'
                    ? '🎲 Random'
                    : s.charAt(0).toUpperCase() + s.slice(1)}
                </Button>
              ),
            )}
          </div>
          {filterState.sortBy === 'random' && (
            <p className="text-xs text-white/40 mt-1 pl-1">
              Click Random again to reshuffle.
            </p>
          )}
        </div>

        {/* Categories Column */}
        <div className="space-y-4">
          <h3 className="uppercase tracking-widest text-xs font-bold text-white/50 border-b border-white/10 pb-2">
            Categories & Filters
          </h3>
          <ScrollArea className="h-96 pr-4">
            <div className="space-y-2">
              {allCategories.map((cat) => {
                const count = categoryCounts[cat] || 0;
                const active =
                  filterState.advancedCategories.includes(cat) ||
                  filterState.categories.includes(cat);
                const isExpanded = expandedCats.includes(cat);
                const subs = subcategoryCounts[cat] || {};
                const hasSubs = Object.keys(subs).length > 0;

                return (
                  <div key={cat} className="space-y-1">
                    <div
                      className={`w-full flex items-center justify-between px-3 py-2 transition-colors border ${
                        active
                          ? 'bg-white/10 border-white/20 text-white font-medium'
                          : 'bg-black/20 border-white/5 hover:border-white/10'
                      }`}
                    >
                      <button
                        onClick={() => onToggleCategory(cat)}
                        className="flex items-center gap-3 flex-1 text-left"
                      >
                        <span
                          className={`w-4 h-4 flex items-center justify-center border ${active ? 'bg-indigo-500 border-indigo-500' : 'border-white/30'}`}
                        >
                          {active && <Check className="w-3 h-3 text-white" />}
                        </span>
                        {formatCategory(cat)}
                        <span
                          className={`text-[10px] ml-1 px-1.5 py-0.5 rounded-full ${active ? 'bg-white/10 text-white/60' : 'bg-white/5 text-white/30'}`}
                        >
                          {count}
                        </span>
                      </button>

                      {hasSubs && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => toggleExpand(cat)}
                          className="h-8 w-8 hover:bg-white/10 transition-colors rounded-none"
                        >
                          {isExpanded ? (
                            <ChevronDown className="w-4 h-4" />
                          ) : (
                            <ChevronRight className="w-4 h-4" />
                          )}
                        </Button>
                      )}
                    </div>

                    {/* Subcategories */}
                    {isExpanded && hasSubs && (
                      <div className="ml-6 pl-4 border-l border-white/5 space-y-1 mt-1 pb-2">
                        {Object.entries(subs)
                          .sort((a, b) => b[1] - a[1])
                          .map(([sub, subCount]) => {
                            const subActive =
                              filterState.subcategories.includes(sub);
                            return (
                              <button
                                key={sub}
                                onClick={() => onToggleSubcategory(sub, cat)}
                                className={`w-full flex items-center justify-between px-3 py-1.5 transition-colors border ${
                                  subActive
                                    ? 'bg-indigo-500/10 border-indigo-500/30 text-white'
                                    : 'bg-transparent border-transparent hover:bg-white/5 text-white/50 hover:text-white/80'
                                }`}
                              >
                                <span className="flex items-center gap-3">
                                  <span
                                    className={`w-3.5 h-3.5 flex items-center justify-center border ${subActive ? 'bg-indigo-500 border-indigo-500' : 'border-white/20'}`}
                                  >
                                    {subActive && (
                                      <Check className="w-2.5 h-2.5 text-white" />
                                    )}
                                  </span>
                                  {sub}
                                </span>
                                <span className="text-[10px] opacity-40">
                                  {subCount}
                                </span>
                              </button>
                            );
                          })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  );
}
