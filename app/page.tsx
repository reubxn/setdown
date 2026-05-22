"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useDataset } from "@/context/dataset-context";
import { useAuth } from "@/context/auth-context";
import { SignInButton } from "@/components/auth/sign-in-button";
import { Hero } from "@/components/landing/hero";
import { ExportTutorial } from "@/components/landing/export-tutorial";
import { PrivacyNote } from "@/components/landing/privacy-note";

export default function HomePage() {
  const router = useRouter();
  const { dataset, loading } = useDataset();
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  const shouldRedirect =
    (!authLoading && isAuthenticated) || (!loading && !!dataset);

  useEffect(() => {
    if (shouldRedirect) {
      router.replace("/overview");
    }
  }, [shouldRedirect, router]);

  if (shouldRedirect) return null;

  return (
    <main className="min-h-dvh bg-[var(--bg-base)] text-[var(--text-primary)]">
      <header className="mx-auto flex w-full max-w-[1200px] items-center justify-between px-6 py-5">
        <Link href="/" className="text-base font-semibold tracking-tight">
          setdown
        </Link>
        <SignInButton />
      </header>

      <Hero />
      <ExportTutorial />
      <PrivacyNote />
    </main>
  );
}
