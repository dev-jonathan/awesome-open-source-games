import HeroSection from '@/components/hero-section';
import { GameExplorer } from '@/components/game-explorer/GameExplorer';
import Dither from '@/components/Dither';
import { HeroHeader } from '@/components/header';
import Features from '@/components/features';
import FooterSection from '@/components/footer';
import CallToAction from '@/components/call-to-action';
// ── Shared wave parameters (must be identical for Dither + GameIconLayer) ──
const WAVE_COLOR: [number, number, number] = [0.45, 0.45, 0.45];
const WAVE_SPEED = 0.05;
const WAVE_FREQUENCY = 4;
const WAVE_AMPLITUDE = 0.3;

const svgModules = Object.keys(
  import.meta.glob('/public/svgs/*.svg', { eager: true }),
);
const GAME_ICONS: string[] = svgModules.map((path) =>
  path.replace('/public', ''),
);

export default function App() {
  return (
    <main className="min-h-screen bg-background text-foreground overflow-x-hidden">
      <div
        className="absolute w-full h-[100dvh] max-h-[155rem] sm:max-h-[115rem] md:max-h-[125rem] lg:max-h-[190rem] xl:max-h-[195rem] z-0 pointer-events-none"
        style={{
          maskImage: 'linear-gradient(to bottom, black 65%, transparent 100%)',
          WebkitMaskImage:
            'linear-gradient(to bottom, black 65%, transparent 100%)',
        }}
      >
        <Dither
          waveColor={WAVE_COLOR}
          disableAnimation={false}
          enableMouseInteraction
          mouseRadius={0.3}
          colorNum={3}
          pixelSize={3}
          waveAmplitude={WAVE_AMPLITUDE}
          waveFrequency={WAVE_FREQUENCY}
          waveSpeed={WAVE_SPEED}
          icons={GAME_ICONS}
          maxIcons={42}
        />
      </div>
      <div className="relative z-10 mx-auto w-full">
        <HeroHeader />
        <HeroSection />
        <GameExplorer />
        <Features />
        <CallToAction />
        <FooterSection />
      </div>
    </main>
  );
}
