import { SortOption } from './types';
import { ChevronDown, Star, TrendingUp, Calendar, Shuffle } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';

const SORT_OPTIONS: { value: SortOption; label: string; icon: any }[] = [
  { value: 'stars', label: 'Most Stars', icon: Star },
  { value: 'relevance', label: 'Relevance', icon: TrendingUp },
  { value: 'newest', label: 'Newest', icon: Calendar },
  { value: 'random', label: 'Random', icon: Shuffle },
];

export function SortSelector({
  currentSort,
  onChange,
}: {
  currentSort: SortOption;
  onChange: (sort: SortOption) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const currentOption =
    SORT_OPTIONS.find((o) => o.value === currentSort) || SORT_OPTIONS[0];
  const Icon = currentOption.icon;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={`relative ${isOpen ? 'z-50' : 'z-30'}`} ref={containerRef}>
      <Button
        variant="outline"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 rounded-none bg-black/30 border-white/20 text-white hover:bg-white/10 transition-all min-w-[160px] justify-between group h-10 cursor-pointer"
      >
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4 text-indigo-400" />
          <span className="text-sm font-medium">{currentOption.label}</span>
        </div>
        <ChevronDown
          className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
        />
      </Button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-full bg-[#0a0a0a] border border-white/10 shadow-2xl animate-in fade-in slide-in-from-top-1 duration-200 z-50">
          {SORT_OPTIONS.map((option) => {
            const OptionIcon = option.icon;
            const isActive = currentSort === option.value;
            return (
              <button
                key={option.value}
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                className={`cursor-pointer w-full flex items-center gap-2 px-4 py-2.5 text-sm transition-colors text-left ${
                  isActive
                    ? 'bg-indigo-500/20 text-white font-semibold'
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                }`}
              >
                <OptionIcon
                  className={`w-4 h-4 ${isActive ? 'text-indigo-400' : 'text-white/20'}`}
                />
                {option.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
