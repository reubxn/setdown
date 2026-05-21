import Image from "next/image";

const SHOTS = [
  { src: "/screenshots/overview.png", alt: "Overview dashboard" },
  { src: "/screenshots/exercise.png", alt: "Exercise detail page" },
  { src: "/screenshots/history.png", alt: "History view" },
  { src: "/screenshots/insights.png", alt: "AI insights" },
];

export function ScreenshotStrip() {
  return (
    <section className="w-full overflow-hidden py-12 lg:py-16">
      <div className="mx-auto max-w-[1200px] px-6">
        <h2 className="text-2xl font-semibold tracking-tight text-[var(--text-primary)] sm:text-3xl">
          See it in action
        </h2>
      </div>
      <div className="mt-8 flex gap-4 overflow-x-auto px-6 pb-6 [scrollbar-width:thin]">
        {SHOTS.map((s) => (
          <div
            key={s.src}
            className="relative aspect-[16/10] w-[480px] shrink-0 overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--bg-elevated)]"
          >
            <Image
              src={s.src}
              alt={s.alt}
              fill
              sizes="480px"
              className="object-cover"
              unoptimized
            />
          </div>
        ))}
      </div>
    </section>
  );
}
