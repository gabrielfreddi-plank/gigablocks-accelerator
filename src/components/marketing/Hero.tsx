import { Button } from "@/components/ui/button";

export function Hero() {
  return (
    <section className="relative w-full flex flex-col items-center justify-center text-center px-6 py-32 md:py-40 overflow-hidden">
      {/* Radial glow background */}
      <div
        className="pointer-events-none absolute inset-0 z-0"
        style={{
          background:
            "radial-gradient(ellipse 60% 40% at 50% 0%, rgba(59,130,246,0.15) 0%, transparent 70%)",
        }}
      />

      <div className="relative z-10 flex flex-col items-center gap-6 max-w-4xl mx-auto">
        {/* Badge */}
        <span className="inline-flex items-center gap-2 rounded-full bg-zinc-800 px-4 py-1.5 text-sm text-zinc-300">
          <span className="size-2 rounded-full bg-blue-500" />
          Launching soon — join the waitlist →
        </span>

        {/* Headline */}
        <h1 className="font-extrabold leading-tight tracking-tight text-white text-[40px] md:text-[72px]">
          Build internal tools at the speed of thought.
        </h1>

        {/* Subtitle */}
        <p className="text-zinc-400 text-lg md:text-xl max-w-[700px]">
          Gigablocks is an open-beta platform to build, deploy, and iterate on
          internal tools — right from your browser.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center gap-3 mt-2">
          <Button
            className="bg-blue-500 hover:bg-blue-600 text-white border-transparent px-6 py-2.5 text-base h-auto rounded-lg"
          >
            Start building free
          </Button>
          <Button
            className="bg-zinc-800 hover:bg-zinc-700 text-white border-transparent px-6 py-2.5 text-base h-auto rounded-lg"
          >
            View live demo →
          </Button>
        </div>

        {/* Social proof */}
        <p className="text-zinc-500 text-sm mt-1">
          Open beta · No credit card required · Ship your first tool today
        </p>
      </div>
    </section>
  );
}
