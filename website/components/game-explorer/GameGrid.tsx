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

  // Distribute row-first (i % cols) so visual row 0 = games[0..cols-1] (correct sort order).
  // e.g. cols=4: col0=[0,4,8..], col1=[1,5,9..], col2=[2,6,10..], col3=[3,7,11..]
  const columnsItems: { game: FinalGame; index: number }[][] = Array.from(
    { length: cols },
    () => [],
  );
  games.forEach((game, i) => {
    columnsItems[i % cols].push({ game, index: i });
  });

  // The first two visual rows = indices 0..(cols*2 - 1). Mark those as priority
  // so the browser fetches their images with high priority regardless of DOM position.
  const aboveFoldCount = cols * 2;

  return (
    <div
      className={`grid gap-4 max-w-[1600px] mx-auto w-full pt-4 px-4 sm:px-6 lg:px-8 ${
        cols === 4 ? 'grid-cols-4' : cols === 3 ? 'grid-cols-3' : 'grid-cols-2'
      }`}
    >
      {columnsItems.map((col, colIdx) => (
        <div key={colIdx} className="flex flex-col gap-4">
          {col.map(({ game, index }) => (
            <GameCard
              key={game.id}
              game={game}
              onClick={() => onGameClick(game)}
              priority={index < aboveFoldCount}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
