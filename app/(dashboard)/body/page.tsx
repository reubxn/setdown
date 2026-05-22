"use client";

import { useState } from "react";
import { Lock } from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { BodyLog } from "@/components/analytics/body-log";
import { LoginModal } from "@/components/auth/login-modal";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { BodySkeleton } from "@/components/loading/page-skeletons";

export default function BodyPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const [loginOpen, setLoginOpen] = useState(false);

  return (
    <div className="@container mx-auto w-full max-w-5xl px-4 py-6">
      <header className="mb-6 flex flex-col gap-1">
        <h1 className="text-2xl font-semibold text-[var(--text-primary)]">
          Body
        </h1>
        <p className="text-sm text-[var(--text-muted)]">
          Track weight, body fat, and measurements over time.
        </p>
      </header>

      {isLoading ? (
        <BodySkeleton />
      ) : isAuthenticated ? (
        <BodyLog />
      ) : (
        <>
          <EmptyState
            icon={Lock}
            title="Sign in to log measurements"
            description="Body measurements save to your account so they sync across devices. Workouts can stay on this device — measurements can't."
            action={
              <Button onClick={() => setLoginOpen(true)}>
                Sign in to continue
              </Button>
            }
          />
          <LoginModal
            open={loginOpen}
            onClose={() => setLoginOpen(false)}
            title="Sign in to log measurements"
            subtitle="Body measurements need an account — workouts don't."
          />
        </>
      )}
    </div>
  );
}
