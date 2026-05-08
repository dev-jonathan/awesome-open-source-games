import { Star } from 'lucide-react';
import { FinalGame } from './types';
import { useMemo } from 'react';

export function formatStars(stars: number) {
  if (stars >= 1000) return (stars / 1000).toFixed(1) + 'k';
  return stars.toString();
}

export function GameCardFallback({ game }: { game: FinalGame }) {
  const bgClass = useMemo(() => {
    const colors = [
      'from-indigo-500/20 to-slate-950',
      'from-purple-500/20 to-slate-950',
      'from-blue-500/20 to-slate-950',
    ];

    // Simple hash function to pick a color deterministically
    let hash = 0;
    const str = game.id || game.name;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % colors.length;
    return colors[index];
  }, [game.id, game.name]);

  return (
    <div
      className={`aspect-video w-full bg-gradient-to-br ${bgClass} border border-white/10 rounded-none flex flex-col items-center justify-center p-6 text-center group-hover:scale-105 transition-transform duration-500`}
    >
      <span
        className="text-xl md:text-2xl font-black text-white/90 tracking-tighter uppercase drop-shadow-lg"
        title={game.name}
      >
        {game.name}
      </span>

      {/* Bottom info (optional, keeping it subtle) */}
      <div className="absolute bottom-4 flex items-center gap-4 text-white/40 text-[10px] uppercase tracking-widest font-bold">
        {game.language && (
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 bg-indigo-500" />
            <span>{game.language}</span>
          </div>
        )}
        {game.stats && game.stats.stars > 0 && (
          <div className="flex items-center gap-1">
            <Star className="w-3 h-3 fill-white/20 stroke-none" />
            <span>{formatStars(game.stats.stars)}</span>
          </div>
        )}
      </div>
    </div>
  );
}
