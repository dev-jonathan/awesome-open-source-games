import { Search } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';

export function SearchBar({
  onSearch,
  initialValue = '',
}: {
  onSearch: (query: string) => void;
  initialValue?: string;
}) {
  const [val, setVal] = useState(initialValue);

  useEffect(() => {
    const timer = setTimeout(() => {
      onSearch(val);
    }, 200);
    return () => clearTimeout(timer);
  }, [val, onSearch]);

  return (
    <div className="relative w-full max-w-md">
      <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none z-10">
        <Search className="w-5 h-5 text-white/50" />
      </div>
      <Input
        type="text"
        className="block w-full p-2.5 pl-10 text-sm rounded-none bg-black/30 border-white/20 text-white placeholder:text-white/50 focus-visible:ring-2 focus-visible:ring-white/30 focus-visible:border-transparent outline-none transition-all h-10"
        placeholder="Search games..."
        value={val}
        onChange={(e) => setVal(e.target.value)}
      />
    </div>
  );
}
