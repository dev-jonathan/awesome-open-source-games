import { Button } from '@/components/ui/button';

import DecryptedText from '@/components/DecryptedText';

export default function HeroSection() {
  return (
    <div className="relative">
      <section className="lg:h-[80vh] flex items-center">
        <div className="pb-16 pt-12 md:pb-20 lg:pb-56 lg:pt-44 lg:grid lg:grid-cols-2 lg:grid-rows-1 grid-cols-1 grid-rows-1 w-full">
          <div className="relative mx-auto flex max-w-xl flex-col px-6 lg:block w-full">
            <div className="mx-auto max-w-2xl text-center lg:ml-0 lg:text-left lg:w-fit">
              <div className="mt-28 md:mt-32 lg:mt-16">
                <DecryptedText
                  text="A Curated List of Awesome Open-Source Games"
                  animateOn="view"
                  revealDirection="start"
                  sequential
                  useOriginalCharsOnly={false}
                  speed={70}
                  className="font-mono text-muted-foreground bg-black rounded-none uppercase"
                />
              </div>
              <h1 className="max-w-2xl text-wrap sm:text-nowrap text-5xl font-bitcount tracking-[-0.03em] leading-[0.9] font-bold md:text-[4rem] lg:text-[5.5rem] animate-in fade-in slide-in-from-bottom-4 duration-1000 fill-mode-both">
                Awesome Open
              </h1>
              <h1 className="max-w-2xl text-wrap sm:text-nowrap text-5xl font-bitcount tracking-[-0.03em] leading-[0.9]  font-bold md:text-[4rem] lg:text-[5.5rem]  animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-200 fill-mode-both">
                Source Games
              </h1>
              <p className="mt-4 w-full md:max-w-[30rem] lg:max-w-none text-pretty text-lg text-muted-foreground bg-black p-1 rounded-none animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-500 fill-mode-both">
                Discover, play, and contribute to the largest community-driven list of open-source games, engines, and resources.
              </p>
              <div className="mt-12 flex flex-col items-center justify-center gap-2 sm:flex-row lg:justify-start animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-700 fill-mode-both">
                <Button
                  asChild
                  size="lg"
                  className="px-5 text-base rounded-none"
                >
                  <a href="#games">
                    <span className="text-nowrap">Explore Games</span>
                  </a>
                </Button>
                <Button
                  key={2}
                  asChild
                  size="lg"
                  variant="ghost"
                  className="px-5 text-base bg-black/30 backdrop-blur-sm hover:bg-black/40 rounded-none"
                >
                  <a
                    href="https://github.com/michelpereira/awesome-open-source-games"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <span className="text-nowrap">GitHub Repo</span>
                  </a>
                </Button>
              </div>
            </div>
          </div>
          <div className="hidden lg:flex lg:absolute lg:top-0 lg:right-0 lg:w-1/2 relative w-full h-[50vh] lg:h-[80vh] items-center justify-center select-none pt-10 lg:pt-0 pointer-events-none"></div>
        </div>
      </section>
    </div>
  );
}
