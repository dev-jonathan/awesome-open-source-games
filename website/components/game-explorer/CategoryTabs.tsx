import { PRIMARY_CATEGORIES } from './types';
import { Settings2, X } from 'lucide-react';
import { formatCategory } from '@/lib/utils';
import { Button } from '@/components/ui/button';

export function CategoryTabs({
  categories,
  onToggle,
  onOpenAdvanced,
  onToggleAdvanced2,
  isAdvancedOpen,
}: {
  categories: string[];
  onToggle: (cat: string) => void;
  onOpenAdvanced: () => void;
  onToggleAdvanced2: () => void;
  isAdvancedOpen: boolean;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {PRIMARY_CATEGORIES.map((cat) => {
        const isActive = categories.includes(cat);
        return (
          <Button
            key={cat}
            variant={isActive ? 'default' : 'outline'}
            onClick={() => onToggle(cat)}
            className={`rounded-none text-sm font-medium transition-all duration-200 flex items-center gap-2 h-10 ${
              isActive
                ? 'bg-white text-black border-transparent shadow-md hover:bg-white/90'
                : 'bg-black/30 border-white/20 text-white/70 hover:bg-white/10 hover:text-white'
            }`}
          >
            {formatCategory(cat)}
            {isActive && <X className="w-3.5 h-3.5 opacity-60" />}
          </Button>
        );
      })}

      <Button
        variant={isAdvancedOpen ? 'default' : 'outline'}
        onClick={onToggleAdvanced2}
        className={`rounded-none text-sm font-medium transition-all duration-200 flex items-center gap-2 h-10 ${
          isAdvancedOpen
            ? 'bg-indigo-500 text-white border-transparent shadow-md hover:bg-indigo-600'
            : 'bg-black/30 border-white/20 text-white hover:bg-white/10'
        }`}
      >
        <Settings2 className="w-4 h-4" />
        Advanced
        {isAdvancedOpen && <X className="w-3.5 h-3.5 opacity-60" />}
      </Button>
    </div>
  );
}
