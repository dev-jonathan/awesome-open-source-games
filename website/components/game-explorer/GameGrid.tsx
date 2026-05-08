import { useState, useEffect } from 'react';
import { FinalGame } from './types';
import { GameCard } from './GameCard';

export function GameGrid({
  games,
  onGameClick,
}: {
  games: FinalGame[];
  onGameClick: (game: FinalGame) => void;
}) {
  const [cols, setCols] = useState(4);

  useEffect(() => {
    const updateCols = () => {
      if (window.innerWidth >= 1280) setCols(4);
      else if (window.innerWidth >= 768) setCols(3);
      else setCols(2);
    };
    updateCols();
    window.addEventListener('resize', updateCols);
    return () => window.removeEventListener('resize', updateCols);
  }, []);

  if (games.length === 0) {
    return (
      <div className="py-20 text-center text-muted-foreground w-full">
        No games found matching your filters.
      </div>
    );
  }

  // Render left-to-right horizontally by dealing cards into columns
  const columnsItems: FinalGame[][] = Array.from({ length: cols }, () => []);
  games.forEach((game, i) => {
    columnsItems[i % cols].push(game);
  });

  return (
    <div
      className={`grid gap-4 max-w-[1600px] mx-auto w-full pt-4 px-4 sm:px-6 lg:px-8 ${
        cols === 4 ? 'grid-cols-4' : cols === 3 ? 'grid-cols-3' : 'grid-cols-2'
      }`}
    >
      {columnsItems.map((col, colIdx) => (
        <div key={colIdx} className="flex flex-col gap-4">
          {col.map((g) => (
            <GameCard key={g.id} game={g} onClick={() => onGameClick(g)} />
          ))}
        </div>
      ))}
    </div>
  );
}
