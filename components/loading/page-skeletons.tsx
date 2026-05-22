// Skeleton scaffolds for dashboard routes — mirror the real layout so the
// page doesn't reflow when data arrives.
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { PageShell } from "@/components/layout/page-shell";

function HeaderSkeleton({ withSubtitle = true }: { withSubtitle?: boolean }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <Skeleton className="h-8 w-48 lg:h-9 lg:w-64" />
        {withSubtitle ? <Skeleton className="mt-2 h-4 w-40" /> : null}
      </div>
    </div>
  );
}

function ChartCardSkeleton({ height = "h-64" }: { height?: string }) {
  return (
    <Card padding="md">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-24" />
        </div>
        <Skeleton className="h-7 w-24 shrink-0" />
      </div>
      <Skeleton className={`w-full ${height}`} />
    </Card>
  );
}

export function OverviewSkeleton() {
  return (
    <div className="mx-auto w-full max-w-[1600px] px-4 py-6 sm:px-6 lg:px-10 lg:py-8">
      <HeaderSkeleton />
      <div className="space-y-4 lg:space-y-6">
        <Card padding="lg">
          <div className="grid grid-cols-2 gap-x-6 gap-y-5 @md:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-8 w-24" />
                <Skeleton className="h-3 w-16" />
              </div>
            ))}
          </div>
        </Card>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-6">
          <ChartCardSkeleton />
          <ChartCardSkeleton />
        </div>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-6">
          <ChartCardSkeleton height="h-48" />
          <ChartCardSkeleton height="h-48" />
        </div>
        <ChartCardSkeleton height="h-40" />
      </div>
    </div>
  );
}

export function ExerciseListSkeleton() {
  return (
    <PageShell title="Exercises">
      <div className="mb-4 flex flex-wrap gap-2">
        <Skeleton className="h-9 w-full max-w-sm" />
        <Skeleton className="h-9 w-32" />
        <Skeleton className="h-9 w-32" />
      </div>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <Card key={i} padding="md">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1 space-y-2">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-3 w-28" />
                <Skeleton className="h-3 w-32" />
              </div>
              <Skeleton className="h-10 w-20 shrink-0" />
            </div>
          </Card>
        ))}
      </div>
    </PageShell>
  );
}

export function ExerciseDetailSkeleton() {
  return (
    <div className="mx-auto w-full max-w-[1600px] px-4 py-6 sm:px-6 lg:px-10 lg:py-8">
      <div className="mb-6 space-y-3">
        <Skeleton className="h-8 w-64 lg:h-9 lg:w-80" />
        <div className="flex flex-wrap gap-3">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-28" />
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-6">
        <Card padding="md" className="lg:col-span-2">
          <ChartCardInner height="h-80" />
        </Card>
        <ChartCardSkeleton />
        <ChartCardSkeleton />
      </div>
      <div className="mt-6">
        <Skeleton className="mb-3 h-4 w-24" />
        <Card padding="md">
          <div className="space-y-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-full" />
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

function ChartCardInner({ height = "h-64" }: { height?: string }) {
  return (
    <>
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-24" />
        </div>
        <Skeleton className="h-7 w-24 shrink-0" />
      </div>
      <Skeleton className={`w-full ${height}`} />
    </>
  );
}

export function HistoryListSkeleton() {
  return (
    <PageShell title="History">
      <div className="mb-6 flex flex-wrap gap-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-8 w-32" />
      </div>
      <div className="space-y-8">
        {Array.from({ length: 2 }).map((_, m) => (
          <section key={m}>
            <Skeleton className="mb-3 h-3 w-32" />
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Card key={i} padding="md">
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-24" />
                    <Skeleton className="h-3 w-40" />
                    <Skeleton className="h-3 w-28" />
                  </div>
                </Card>
              ))}
            </div>
          </section>
        ))}
      </div>
    </PageShell>
  );
}

export function SessionDetailSkeleton() {
  return (
    <div className="mx-auto w-full max-w-[1600px] px-4 py-6 sm:px-6 lg:px-10 lg:py-8 pb-8">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <Skeleton className="h-8 w-56 lg:h-9 lg:w-72" />
        <Skeleton className="h-5 w-24" />
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} padding="md">
            <Skeleton className="mb-3 h-4 w-40" />
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, j) => (
                <Skeleton key={j} className="h-6 w-full" />
              ))}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

export function InsightsSkeleton() {
  return (
    <div className="@container mx-auto w-full max-w-6xl px-4 py-6">
      <div className="mb-6 space-y-2">
        <Skeleton className="h-7 w-32" />
        <Skeleton className="h-4 w-72" />
      </div>
      <div className="grid gap-4 @lg:grid-cols-2">
        <ChartCardSkeleton />
        <ChartCardSkeleton />
        <ChartCardSkeleton height="h-40" />
        <Card padding="md" className="@lg:col-span-2">
          <Skeleton className="mb-3 h-4 w-40" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="mt-2 h-4 w-3/4" />
        </Card>
      </div>
    </div>
  );
}

export function ChatHistorySkeleton() {
  return (
    <div className="space-y-3" aria-label="Loading chat history">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className={i % 2 === 0 ? "flex justify-start" : "flex justify-end"}
        >
          <Skeleton
            className={`h-16 ${i % 2 === 0 ? "w-3/4" : "w-1/2"} rounded-lg`}
          />
        </div>
      ))}
    </div>
  );
}
