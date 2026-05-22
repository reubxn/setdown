"use client";

import { useState } from "react";

export function DashboardPreview() {
  const [hidden, setHidden] = useState(false);

  if (hidden) return null;

  return (
    <section
      aria-label="Dashboard preview"
      className="relative mx-auto w-full max-w-[1400px] overflow-hidden px-6 pb-24 pt-4 lg:pb-32"
      style={{ perspective: "2400px" }}
    >
      <div
        className="pointer-events-none absolute inset-x-0 top-1/2 -z-10 mx-auto h-[60%] max-w-[1100px] -translate-y-1/2 rounded-full opacity-60 blur-3xl"
        style={{
          background:
            "radial-gradient(closest-side, rgba(29,78,216,0.35), rgba(29,78,216,0))",
        }}
      />
      <div
        className="relative mx-auto w-full max-w-[1200px] origin-top rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--bg-elevated)] shadow-[0_60px_120px_-30px_rgba(0,0,0,0.8)]"
        style={{
          transform: "rotateX(22deg) rotateZ(-6deg)",
          transformStyle: "preserve-3d",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/dashboard-preview.png"
          alt="setdown dashboard preview"
          onError={() => setHidden(true)}
          className="block h-auto w-full rounded-[var(--radius-lg)]"
        />
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 rounded-b-[var(--radius-lg)]"
          style={{
            background:
              "linear-gradient(to bottom, transparent, var(--bg-base) 92%)",
          }}
        />
      </div>
    </section>
  );
}
