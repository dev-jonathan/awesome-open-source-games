import { Image } from '@unpic/react';
import { Star } from 'lucide-react';
import { FinalGame } from './types';
import { GameCardFallback, formatStars } from './GameCardFallback';
import { useState, useEffect, useRef } from 'react';
import { formatCategory } from '@/lib/utils';

export function GameCard({
  game,
  onClick,
}: {
  game: FinalGame;
  onClick: () => void;
}) {
  const envBase = import.meta.env.BASE_URL;
  const baseUrl = import.meta.env.VITE_IMAGE_BASE_URL || (envBase.endsWith('/') ? envBase.slice(0, -1) : envBase);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isHovering, setIsHovering] = useState(false);
  const [isPreviewActive, setIsPreviewActive] = useState(false);
  const hoverTimerRef = useRef<NodeJS.Timeout | null>(null);

  const images = game.images || [];
  const hasMultipleImages = images.length > 1;

  // Filter tags to remove duplicates with category/subcategory
  const displayTags = (game.tags || []).filter(
    (tag) =>
      tag.toLowerCase() !== game.category.toLowerCase() &&
      tag.toLowerCase() !== game.subcategory?.toLowerCase(),
  );

  useEffect(() => {
    if (isHovering && hasMultipleImages) {
      hoverTimerRef.current = setTimeout(() => {
        setIsPreviewActive(true);
      }, 300); // Faster preview start
    } else {
      if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
      setIsPreviewActive(false);
      setCurrentImageIndex(0);
    }
    return () => {
      if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
    };
  }, [isHovering, hasMultipleImages]);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isPreviewActive && hasMultipleImages) {
      interval = setInterval(() => {
        setCurrentImageIndex((prev) => (prev + 1) % images.length);
      }, 1000); // Faster image rotation
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPreviewActive, hasMultipleImages, images.length]);

  return (
    <article
      className="masonry-item group cursor-pointer"
      onClick={onClick}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      <div className="relative overflow-hidden rounded-none ring-1 ring-white/10 group-hover:ring-white/30 transition-all bg-slate-900/50 h-full">
        {game.hasImage && images.length > 0 ? (
          <div className="relative w-full h-full overflow-hidden">
            {/* The first image is relative to maintain the card's natural height in masonry */}
            <div
              className={`relative w-full h-full transition-opacity duration-700 ease-in-out ${currentImageIndex === 0 ? 'opacity-100' : 'opacity-0'}`}
            >
              <Image
                src={`${baseUrl}${images[0]}`}
                layout="fullWidth"
                alt={game.name}
                className="w-full h-auto block"
              />
            </div>

            {/* Other images are absolute overlays */}
            {images.slice(1).map((img, idx) => {
              const actualIdx = idx + 1;
              return (
                <div
                  key={img}
                  className={`absolute inset-0 w-full h-full transition-opacity duration-700 ease-in-out ${
                    actualIdx === currentImageIndex
                      ? 'opacity-100 z-10'
                      : 'opacity-0 z-0'
                  }`}
                >
                  <Image
                    src={`${baseUrl}${img}`}
                    layout="fullWidth"
                alt={`${game.name} preview ${actualIdx + 1}`}
                className="w-full h-full object-cover"
                  />
                </div>
              );
            })}

            {/* Subtle progress indicators */}
            {isPreviewActive && hasMultipleImages && (
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1 z-20">
                {images.map((_, idx) => (
                  <div
                    key={idx}
                    className={`h-0.5 transition-all duration-300 ${idx === currentImageIndex ? 'w-3 bg-white' : 'w-1 bg-white/30'}`}
                  />
                ))}
              </div>
            )}
          </div>
        ) : (
          <GameCardFallback game={game} />
        )}

        {/* Gradient overlay on hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10" />

        {/* Category & Badges at the top */}
        <div className="absolute top-2 left-2 flex flex-wrap gap-1.5 z-20 pointer-events-none">
          <span className="text-[10px] px-2 py-0.5 rounded-none bg-black/80 backdrop-blur-md text-white/90 border border-white/10 shadow-sm uppercase font-bold tracking-wider">
            {formatCategory(game.category)}
          </span>

          {/* Subcategory & Tags on hover at the top */}
          <div className="flex flex-wrap gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            {game.subcategory && (
              <span className="text-[10px] px-2 py-0.5 bg-indigo-500/50 backdrop-blur-md border border-white/10 text-white uppercase font-bold tracking-wider shadow-sm">
                {game.subcategory.length > 8
                  ? `${game.subcategory.substring(0, 8)}...`
                  : game.subcategory}
              </span>
            )}

            {displayTags.length > 0 && (
              <>
                {displayTags.slice(0, 2).map((tag) => (
                  <span
                    key={tag}
                    className="text-[10px] px-2 py-0.5 bg-black/60 backdrop-blur-md border border-white/5 text-white/70 uppercase tracking-tighter"
                  >
                    {tag.length > 8 ? `${tag.substring(0, 8)}...` : tag}
                  </span>
                ))}
                {displayTags.length > 2 && (
                  <span className="text-[10px] px-1.5 py-0.5 bg-black/40 backdrop-blur-sm text-white/30 uppercase tracking-tighter border border-white/5">
                    +{displayTags.length - 2}
                  </span>
                )}
              </>
            )}
          </div>
        </div>

        {/* Info on hover */}
        <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none z-20">
          <h3 className="font-bold text-white text-base leading-tight drop-shadow-md">
            {game.name}
          </h3>
          <p className="text-white/80 text-xs mt-1.5 line-clamp-2 drop-shadow-sm leading-relaxed">
            {game.description}
          </p>

          <div className="flex items-center gap-3 mt-3 text-white/70 text-xs font-medium tracking-wider">
            {game.stats && game.stats.stars > 0 && (
              <span className="flex items-center gap-1 bg-white/10 px-2 py-0.5 rounded-none backdrop-blur-md text-white">
                <Star className="w-3 h-3 text-amber-400" fill="currentColor" />{' '}
                {formatStars(game.stats.stars)}
              </span>
            )}
            {game.language && (
              <span className="flex items-center gap-1 drop-shadow-sm border border-white/10 bg-white/5 px-2 py-0.5 rounded-none backdrop-blur-md">
                <span className="w-2 h-2 rounded-none bg-indigo-400 shadow-sm"></span>
                {formatCategory(game.language)}
              </span>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
