import React, { ReactNode } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Gamepad2Icon, Code2Icon, TrophyIcon } from 'lucide-react';

export default function Features() {
  return (
    <section
      className="py-16 md:py-32 dark:bg-transparent bg-transparent relative z-10"
      id="features"
    >
      <div className="@container mx-auto max-w-5xl px-6">
        <div className="text-center">
          <h2 className="text-balance text-4xl font-semibold lg:text-5xl text-white animate-in fade-in slide-in-from-bottom-2 duration-1000 fill-mode-both">
            The Best of Open Source Gaming
          </h2>
          <p className="mt-4 text-white/60 max-w-2xl mx-auto">
            A curated collection of games that are not only fun to play, but
            also free to study, modify, and distribute.
          </p>
        </div>
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-1000 delay-300 fill-mode-both">
          <Card className="@min-4xl:max-w-full @min-4xl:grid-cols-3 @min-4xl:divide-x @min-4xl:divide-y-0 mx-auto mt-8 grid max-w-sm divide-y overflow-hidden shadow-zinc-950/5 *:text-center md:mt-16 bg-black/40 border-white/10 backdrop-blur-md">
            <div className="group shadow-zinc-950/5">
              <CardHeader className="pb-3">
                <CardDecorator>
                  <Gamepad2Icon
                    className="size-6 text-indigo-400"
                    aria-hidden
                  />
                </CardDecorator>

                <h3 className="mt-6 font-medium text-xl text-white">
                  100% Free & Open
                </h3>
              </CardHeader>

              <CardContent>
                <p className="mb-4 md:mb-0 text-sm text-white/60">
                  Games that respect your freedom and are completely free to
                  play forever.
                </p>
              </CardContent>
            </div>

            <div className="group shadow-zinc-950/5">
              <CardHeader className="pb-3">
                <CardDecorator>
                  <Code2Icon className="size-6 text-purple-400" aria-hidden />
                </CardDecorator>

                <h3 className="mt-6 font-medium text-xl text-white">
                  Learn & Contribute
                </h3>
              </CardHeader>

              <CardContent>
                <p className="mb-4 md:mb-0 mt-3 text-sm text-white/60">
                  Every project is open source. Dive into the code and learn
                  from the pros.
                </p>
              </CardContent>
            </div>

            <div className="group shadow-zinc-950/5">
              <CardHeader className="pb-3">
                <CardDecorator>
                  <TrophyIcon className="size-6 text-amber-400" aria-hidden />
                </CardDecorator>

                <h3 className="mt-6 font-medium text-xl text-white">
                  Curated Selection
                </h3>
              </CardHeader>

              <CardContent>
                <p className="mb-4 md:mb-0 mt-3 text-sm text-white/60">
                  Hand-picked high-quality projects across all genres and
                  platforms.
                </p>
              </CardContent>
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
}

const CardDecorator = ({ children }: { children: ReactNode }) => (
  <div className="mask-radial-from-40% mask-radial-to-60% relative mx-auto size-36 duration-200 [--color-border:color-mix(in_oklab,var(--color-zinc-950)10%,transparent)] group-hover:[--color-border:color-mix(in_oklab,var(--color-zinc-950)20%,transparent)] dark:[--color-border:color-mix(in_oklab,var(--color-white)15%,transparent)] dark:group-hover:[--color-border:color-mix(in_oklab,var(--color-white)20%,transparent)]">
    <div
      aria-hidden
      className="absolute inset-0 bg-[linear-gradient(to_right,var(--color-border)_1px,transparent_1px),linear-gradient(to_bottom,var(--color-border)_1px,transparent_1px)] bg-size-[24px_24px] dark:opacity-30"
    />

    <div className="bg-black absolute inset-0 m-auto flex size-12 items-center justify-center border-l border-t border-white/10">
      {children}
    </div>
  </div>
);
