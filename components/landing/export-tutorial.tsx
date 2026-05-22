import Image from "next/image";

const steps = [
  {
    src: "/tutorial/step-1.jpg",
    caption: "In Strong, open Settings and tap Export Workouts.",
  },
  {
    src: "/tutorial/step-2.jpg",
    caption: "Tap the blue Export Workouts button.",
  },
  {
    src: "/tutorial/step-3.jpg",
    caption: "Choose Save to Files, then drop the CSV above.",
  },
];

export function ExportTutorial() {
  return (
    <section className="mx-auto w-full max-w-[1200px] px-6 pb-16">
      <h2 className="text-sm font-medium tracking-wide uppercase text-[var(--text-muted)]">
        How to export from Strong
      </h2>
      <ol className="mt-4 grid gap-6 sm:grid-cols-3">
        {steps.map((step, i) => (
          <li
            key={step.src}
            className="rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-4"
          >
            <div className="relative aspect-[9/19] w-full overflow-hidden rounded-[var(--radius-md)] bg-[var(--bg-sunken)]">
              <Image
                src={step.src}
                alt={`Step ${i + 1}`}
                fill
                sizes="(min-width: 640px) 33vw, 100vw"
                className="object-contain"
              />
            </div>
            <p className="mt-3 text-sm text-[var(--text-secondary)]">
              <span className="font-medium text-[var(--text-primary)]">
                {i + 1}.
              </span>{" "}
              {step.caption}
            </p>
          </li>
        ))}
      </ol>
    </section>
  );
}
