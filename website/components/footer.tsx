'use client';

import { useState } from 'react';
import SunglassIcon from '@/components/sunglass-icon';
import { X, Heart, Code2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function FooterSection() {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <footer className="py-16 md:py-32 z-10 relative">
      <div className="mx-auto max-w-5xl px-6">
        <a href="/" aria-label="go home" className="mx-auto block size-fit">
          <SunglassIcon size={30} className="text-foreground" />
        </a>

        <div className="my-8 flex flex-wrap justify-center gap-6 text-sm">
          <button
            onClick={() => setModalOpen(true)}
            className="text-muted-foreground hover:text-primary block duration-150 cursor-pointer"
          >
            <span>About & Stack</span>
          </button>
          <a
            href="https://github.com/michelpereira/awesome-open-source-games"
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground hover:text-primary block duration-150"
          >
            <span>GitHub Repo</span>
          </a>
        </div>
        <span className="text-muted-foreground block text-center text-sm font-mono uppercase tracking-widest text-xs">
          Built for awesome community • Open Source Always.
        </span>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => setModalOpen(false)}
          />
          <div className="relative bg-[#050505] border border-white/10 w-full max-w-lg p-8 shadow-2xl text-left animate-in fade-in zoom-in-95 fill-mode-both max-h-[90vh] overflow-y-auto custom-scrollbar">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setModalOpen(false)}
              className="absolute top-4 right-4 text-white/50 hover:text-white rounded-none h-8 w-8 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </Button>
            <h3 className="text-xl font-bold font-bitcount mb-4 flex items-center gap-2">
              <Heart className="w-5 h-5 text-indigo-500" />
              About & Credits
            </h3>
            <p className="text-sm text-white/70 leading-relaxed mb-4">
              <strong>Awesome Open Source Games</strong> is a community-driven
              directory that helps you discover, play, and contribute to the
              best open-source games, engines, and resources available.
            </p>
            <p className="text-sm text-white/70 leading-relaxed mb-4">
              A huge thanks to the main contributors of the awesome list, the
              talented developers behind these games, and the creators of the
              frontend assets.
            </p>
            <h4 className="text-[11px] font-bold uppercase tracking-widest text-white/40 mb-2 flex items-center gap-2 mt-6">
              <Code2 className="w-3.5 h-3.5" />
              Stack & Libraries
            </h4>
            <div className="flex flex-wrap gap-2 text-xs text-white/60 mb-6">
              {[
                { name: 'Shadcn UI', url: 'https://github.com/shadcn-ui/ui' },
                { name: 'React', url: 'https://github.com/facebook/react' },
                { name: 'Vite', url: 'https://github.com/vitejs/vite' },
                { name: 'Fuse.js', url: 'https://github.com/krisk/Fuse' },
                {
                  name: 'Tailwind',
                  url: 'https://github.com/tailwindlabs/tailwindcss',
                },
                {
                  name: 'Geist Font',
                  url: 'https://github.com/vercel/geist-font',
                },
                {
                  name: 'Bitcount Font',
                  url: 'https://fonts.google.com/specimen/Bitcount?preview.script=Latn',
                },
                {
                  name: 'Streamline Icons',
                  url: 'https://github.com/webalys-hq/streamline-vectors',
                },
                {
                  name: 'Lucide Icons',
                  url: 'https://github.com/lucide-icons/lucide',
                },
                {
                  name: 'Pixelarticons',
                  url: 'https://github.com/halfmage/pixelarticons',
                },
              ].map((lib) => (
                <a
                  key={lib.name}
                  href={lib.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="border border-white/10 bg-white/5 px-2 py-1 hover:bg-white/10 transition-colors"
                >
                  {lib.name}
                </a>
              ))}
            </div>

            <h4 className="text-[11px] font-bold uppercase tracking-widest text-white/40 mb-2 flex items-center gap-2 mt-6">
              <AlertTriangle className="w-3.5 h-3.5" />
              Disclaimer & Policies
            </h4>
            <p className="text-xs text-white/50 leading-relaxed mb-6">
              This site is an informational directory aggregating third-party
              content. The games and source codes are not hosted or vetted by
              us. We hold no legal responsibility for any damages or issues
              arising from installing or running these projects on your machine.
              Always review the code yourself. If you are the owner of any
              content or image and wish for it to be removed, please open an
              issue on our GitHub repository.
            </p>

            <p className="text-xs text-white/50 pt-4 border-t border-white/10">
              Site inspired by a template of{' '}
              <a
                href="https://v0.app/templates/v0-irl-event-landing-custom-3d-lanyard-IegtBb6qiEV"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:underline"
              >
                @juandave
              </a>
              .
            </p>
          </div>
        </div>
      )}
    </footer>
  );
}
