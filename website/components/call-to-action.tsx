import { Button } from '@/components/ui/button';

export default function CallToAction() {
  return (
    <section className="py-16 mx-2 relative z-10">
      <div className="mx-auto max-w-5xl rounded-none border border-white/10 bg-black/40 backdrop-blur-md px-6 py-12 md:py-20 lg:py-32">
        <div className="text-center">
          <h2 className="text-balance text-4xl font-semibold lg:text-5xl text-white animate-in fade-in slide-in-from-bottom-2 duration-1000 fill-mode-both">
            Support the Project
          </h2>
          <p className="mt-4 text-white/60 animate-in fade-in slide-in-from-bottom-2 duration-1000 delay-150 fill-mode-both">
            If you find this directory useful, please consider giving us a star
            on GitHub!
          </p>
          <div className="mt-12 flex flex-wrap justify-center gap-4 animate-in fade-in slide-in-from-bottom-2 duration-1000 delay-300 fill-mode-both">
            <Button asChild size="lg" className="rounded-none px-8">
              <a
                href="https://github.com/michelpereira/awesome-open-source-games"
                target="_blank"
                rel="noopener noreferrer"
              >
                <span>Star on GitHub</span>
              </a>
            </Button>

            <Button
              asChild
              size="lg"
              variant="outline"
              className="rounded-none px-8 bg-white/5 border-white/10 text-white hover:bg-white/10"
            >
              <a
                href="https://github.com/michelpereira/awesome-open-source-games/blob/main/contributing.md"
                target="_blank"
                rel="noopener noreferrer"
              >
                <span>View Guide</span>
              </a>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
