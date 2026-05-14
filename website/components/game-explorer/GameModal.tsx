import { FinalGame } from './types';
import {
  X,
  ExternalLink,
  Star,
  GitCommit,
  Clock,
  Hash,
  Globe,
  Code2,
  ChevronLeft,
  ChevronRight,
  Github,
} from 'lucide-react';

import { useState, useEffect } from 'react';
import { formatCategory } from '@/lib/utils';
import { formatStars } from './GameCardFallback';
import { Button } from '@/components/ui/button';

const envBase = import.meta.env.BASE_URL;
const baseUrl =
  import.meta.env.VITE_IMAGE_BASE_URL ||
  (envBase.endsWith('/') ? envBase.slice(0, -1) : envBase);

export function GameModal({
  game,
  isOpen,
  onClose,
}: {
  game: FinalGame | null;
  isOpen: boolean;
  onClose: () => void;
}) {
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [prevGameId, setPrevGameId] = useState<string | null>(null);

  // Reset image index immediately when game changes
  if (game?.id !== prevGameId) {
    setActiveImageIndex(0);
    setPrevGameId(game?.id || null);
  }

  useEffect(() => {
    if (isOpen) {
      const scrollbarWidth =
        window.innerWidth - document.documentElement.clientWidth;
      document.body.style.overflow = 'hidden';
      if (scrollbarWidth > 0) {
        document.body.style.paddingRight = `${scrollbarWidth}px`;
      }
    } else {
      document.body.style.overflow = 'unset';
      document.body.style.paddingRight = '0px';
    }
    return () => {
      document.body.style.overflow = 'unset';
      document.body.style.paddingRight = '0px';
    };
  }, [isOpen]);

  if (!game) return null;

  const images = game.images || [];
  const hasImages = images.length > 0;

  const nextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const stats = [
    {
      label: 'Stars',
      value: game.stats?.stars ? formatStars(game.stats.stars) : '0',
      icon: Star,
      color: 'text-amber-400',
    },
    {
      label: 'Commits',
      value: game.stats?.commits ? game.stats.commits.toLocaleString() : '0',
      icon: GitCommit,
      color: 'text-blue-400',
    },
    {
      label: 'Last Update',
      value: game.stats?.lastPush
        ? new Date(game.stats.lastPush).toLocaleDateString()
        : 'N/A',
      icon: Clock,
      color: 'text-green-400',
    },
    {
      label: 'Language',
      value: game.language || 'Unknown',
      icon: Code2,
      color: 'text-indigo-400',
    },
  ];

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 md:p-10 pointer-events-auto">
      <div
        onClick={onClose}
        className="absolute inset-0 bg-black/95 backdrop-blur-2xl cursor-zoom-out animate-in fade-in duration-300"
      />

      <div className="relative w-full max-w-7xl h-full md:h-[85vh] max-h-[900px] bg-[#0a0a0a] border border-white/10 shadow-[0_0_100px_-20px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col md:flex-row z-10 animate-in zoom-in-95 fade-in duration-300 fill-mode-both">
        {/* Close Button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="absolute top-4 right-4 z-50 h-10 w-10 bg-black/50 hover:bg-white/10 text-white/50 hover:text-white transition-colors border border-white/5 backdrop-blur-md rounded-none cursor-pointer"
        >
          <X className="w-6 h-6" />
        </Button>

        {/* Left Side: Images */}
        <div className="w-full md:w-[65%] h-[400px] md:h-auto bg-black/40 flex flex-col border-r border-white/5 overflow-hidden">
          <div className="flex-1 relative flex items-center justify-center p-4 group bg-[#050505]">
            {hasImages ? (
              <>
                <img
                  src={`${baseUrl}${images[activeImageIndex]}`}
                  width={1200}
                  height={900}
                  alt={game.name}
                  loading="eager"
                  fetchPriority="high"
                  className="max-w-full max-h-full object-contain shadow-2xl"
                />

                {images.length > 1 && (
                  <>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={prevImage}
                      className="absolute left-4 h-14 w-14 bg-black/60 text-white border border-white/10 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity hover:bg-indigo-500 rounded-none border-none cursor-pointer"
                    >
                      <ChevronLeft className="w-8 h-8" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={nextImage}
                      className="absolute right-4 h-14 w-14 bg-black/60 text-white border border-white/10 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity hover:bg-indigo-500 rounded-none border-none cursor-pointer"
                    >
                      <ChevronRight className="w-8 h-8" />
                    </Button>
                  </>
                )}
              </>
            ) : (
              <div className="text-white/10 flex flex-col items-center gap-4">
                <Globe className="w-24 h-24 opacity-20" />
                <span className="text-sm uppercase tracking-widest font-bold">
                  No Preview Available
                </span>
              </div>
            )}
          </div>

          {/* Thumbnails */}
          {images.length > 1 && (
            <div className="h-24 md:h-28 p-3 border-t border-white/5 bg-black/20 overflow-x-auto custom-scrollbar">
              <div className="flex gap-2 h-full">
                {images.map((img, idx) => (
                  <button
                    key={img}
                    onClick={() => setActiveImageIndex(idx)}
                    className={`relative h-full aspect-video flex-shrink-0 border overflow-hidden transition-all cursor-pointer ${
                      activeImageIndex === idx
                        ? 'border-indigo-500 ring-2 ring-indigo-500'
                        : 'border-white/10 hover:border-white/30'
                    }`}
                  >
                    <img
                      src={`${baseUrl}${img}`}
                      alt={`Thumbnail ${idx + 1}`}
                      loading="lazy"
                      fetchPriority="low"
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Side: Info */}
        <div className="w-full md:w-[35%] flex flex-col h-full overflow-hidden bg-black/20">
          <div className="flex-1 overflow-y-auto custom-scrollbar p-6 md:p-8">
            <div className="mb-6">
              <div className="flex flex-wrap gap-2 mb-4">
                <span className="text-[11px] px-2.5 py-1 bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 uppercase font-bold tracking-wider">
                  {formatCategory(game.category)}
                </span>
                {game.subcategory && (
                  <span className="text-[11px] px-2.5 py-1 bg-white/5 border border-white/10 text-white/60 uppercase font-bold tracking-wider">
                    {game.subcategory}
                  </span>
                )}
              </div>

              <h2 className="text-2xl md:text-3xl font-bold text-white mb-4 leading-tight">
                {game.name}
              </h2>

              <p className="text-white/70 text-sm md:text-base leading-relaxed mb-6">
                {game.description}
              </p>

              <div className="grid grid-cols-2 gap-3 mb-6">
                {stats.map((stat) => (
                  <div
                    key={stat.label}
                    className="p-3 bg-white/5 border border-white/5 flex flex-col gap-1"
                  >
                    <div className="flex items-center gap-2 text-white/30 uppercase text-[10px] font-bold tracking-tighter">
                      <stat.icon className={`w-3.5 h-3.5 ${stat.color}`} />
                      {stat.label}
                    </div>
                    <div className="text-white font-mono text-sm">
                      {stat.value}
                    </div>
                  </div>
                ))}
              </div>

              {game.tags && game.tags.length > 0 && (
                <div className="mb-6">
                  <div className="text-[10px] uppercase font-bold text-white/30 tracking-widest mb-3 flex items-center gap-2">
                    <Hash className="w-3.5 h-3.5" />
                    Tags
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {game.tags.map((tag) => (
                      <span
                        key={tag}
                        className="text-[10px] px-2.5 py-1 bg-white/5 border border-white/5 text-white/50 uppercase tracking-tighter hover:text-white/80 transition-colors"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="p-6 md:p-8 mt-auto border-t border-white/5 flex flex-col gap-3">
            {(game.links && game.links.length > 0 ? game.links : [game.link])
              .filter(Boolean)
              .map((link, idx) => {
                const isGithub = link.includes('github.com');
                return (
                  <Button
                    key={idx}
                    asChild
                    className="flex items-center justify-center gap-3 w-full py-6 bg-white text-black font-bold uppercase tracking-widest hover:bg-indigo-500 hover:text-white transition-all group/btn text-sm rounded-none cursor-pointer"
                  >
                    <a href={link} target="_blank" rel="noopener noreferrer">
                      {isGithub ? (
                        <Github className="w-5 h-5" />
                      ) : (
                        <ExternalLink className="w-5 h-5" />
                      )}
                      {isGithub ? 'View Source' : 'Other Source'}
                    </a>
                  </Button>
                );
              })}
          </div>
        </div>
      </div>
    </div>
  );
}
