"use client";

import Link from "next/link";
import { ArrowRight, Github } from "lucide-react";
import { useDataset } from "@/context/dataset-context";
import { SignInButton } from "@/components/auth/sign-in-button";
import { Hero } from "@/components/landing/hero";
import { FeatureGrid } from "@/components/landing/feature-grid";
import { ScreenshotStrip } from "@/components/landing/screenshot-strip";
import { PrivacyNote } from "@/components/landing/privacy-note";

export default function HomePage() {
  const { dataset, loading } = useDataset();

  return (
    <main className="min-h-dvh bg-[var(--bg-base)] text-[var(--text-primary)]">
      <header className="mx-auto flex w-full max-w-[1200px] items-center justify-between px-6 py-5">
        <Link href="/" className="text-base font-semibold tracking-tight">
          setdown
        </Link>
        <SignInButton />
      </header>

      {!loading && dataset && (
        <div className="mx-auto w-full max-w-[1200px] px-6">
          <Link
            href="/overview"
            className="flex items-center justify-between gap-3 rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-4 py-3 text-sm transition-colors hover:border-[var(--border-strong)]"
          >
            <span className="text-[var(--text-secondary)]">
              You have an existing dataset.
            </span>
            <span className="inline-flex items-center gap-1.5 font-medium text-[var(--accent)]">
              Continue to your dashboard
              <ArrowRight className="h-4 w-4" />
            </span>
          </Link>
        </div>
      )}

      <Hero />
      <FeatureGrid />
      <ScreenshotStrip />
      <PrivacyNote />

      <footer className="border-t border-[var(--border-subtle)] mt-8">
        <div className="mx-auto flex w-full max-w-[1200px] flex-col items-start justify-between gap-4 px-6 py-8 text-sm text-[var(--text-muted)] sm:flex-row sm:items-center">
          <p>setdown — your Strong data, in your hands.</p>
          <a
            href="https://github.com/reubxn/setdown"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 hover:text-[var(--text-primary)]"
          >
            <Github className="h-4 w-4" />
            GitHub
          </a>
        </div>
      </footer>
    </main>
  );
}
