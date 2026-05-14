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

  // Distribute games into columns in ROW-FIRST order so the browser
  // fetches images in the same order the user sees them (left→right, top→bottom).
  // e.g. with 4 cols: game[0]→col0, game[1]→col1, game[2]→col2, game[3]→col3
  //                    game[4]→col0, game[5]→col1 ...  (same as before visually)
  // The key fix is that we assign a global `index` per card so GameCard
  // knows whether to eager-load (first 2 rows visible ≈ cols*2 cards).
  const columnsItems: { game: FinalGame; globalIndex: number }[][] = Array.from(
    { length: cols },
    () => [],
  );
  games.forEach((game, i) => {
    columnsItems[i % cols].push({ game, globalIndex: i });
  });

  // First 2 rows across all columns are considered "above the fold"
  const aboveFoldCount = cols * 2;

  return (
    <div
      className={`grid gap-4 max-w-[1600px] mx-auto w-full pt-4 px-4 sm:px-6 lg:px-8 ${
        cols === 4 ? 'grid-cols-4' : cols === 3 ? 'grid-cols-3' : 'grid-cols-2'
      }`}
    >
      {columnsItems.map((col, colIdx) => (
        <div key={colIdx} className="flex flex-col gap-4">
          {col.map(({ game, globalIndex }) => (
            <GameCard
              key={game.id}
              game={game}
              priority={globalIndex < aboveFoldCount}
              onClick={() => onGameClick(game)}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
