"use client";

import { Button } from "@/components/ui/button";
import { posthog } from "@/lib/posthog/client";

export function CTAFinal() {
  return (
    <section className="relative overflow-hidden border-t border-zinc-700 py-24">
      {/* Blue radial glow background */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 60% 50% at 50% 100%, rgba(59,130,246,0.25) 0%, transparent 70%)",
        }}
      />

      <div className="relative z-10 flex flex-col items-center gap-6 px-4 text-center">
        <h2
          className="font-extrabold text-white"
          style={{
            fontSize: "40px",
            lineHeight: 1.15,
            fontFamily: "var(--font-inter)",
          }}
        >
          Ready to ship your first internal tool?
        </h2>

        <p className="text-zinc-400 text-base">
          Free plan · No credit card · Deploy in minutes.
        </p>

        <Button
          className="bg-blue-500 hover:bg-blue-400 text-white px-8 font-semibold"
          style={{ height: "52px", borderRadius: "10px" }}
          onClick={() => posthog.capture("final_cta_clicked")}
        >
          Start building for free
        </Button>

        <a
          href="#"
          className="text-zinc-500 text-sm hover:text-zinc-300 transition-colors"
          onClick={() => posthog.capture("schedule_demo_clicked")}
        >
          or schedule a demo →
        </a>
      </div>
    </section>
  );
}
