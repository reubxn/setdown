// <InsightCard kind="overview" content="…" generatedAt={Date.now()} onRefresh={…} />
"use client";

import { useMemo } from "react";
import { RefreshCw, Sparkles } from "lucide-react";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { IconButton } from "@/components/ui/icon-button";

const TITLES: Record<string, string> = {
  overview: "Overview",
  plateau: "Plateau watch",
  balance: "Balance",
  streak: "Consistency",
  exercise: "Exercise insight",
};

export interface InsightCardProps {
  kind: "overview" | "exercise" | "plateau" | "balance" | "streak";
  content: string;
  generatedAt: number;
  onRefresh?: () => void;
  refreshing?: boolean;
}

export function InsightCard({
  kind,
  content,
  generatedAt,
  onRefresh,
  refreshing,
}: InsightCardProps) {
  const age = useMemo(() => formatAge(generatedAt), [generatedAt]);
  return (
    <Card>
      <CardHeader
        title={
          <span className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-[var(--accent)]" />
            <span>{TITLES[kind] ?? kind}</span>
          </span>
        }
        action={
          onRefresh ? (
            <IconButton
              aria-label="Refresh insight"
              icon={
                <RefreshCw
                  className={refreshing ? "h-4 w-4 animate-spin" : "h-4 w-4"}
                />
              }
              size="sm"
              onClick={onRefresh}
              disabled={refreshing}
            />
          ) : undefined
        }
      />
      <CardBody>
        <p className="whitespace-pre-wrap text-sm leading-relaxed text-[var(--text-primary)]">
          {content}
        </p>
        <p className="mt-3 text-[11px] text-[var(--text-muted)]">
          Generated {age}
        </p>
      </CardBody>
    </Card>
  );
}

function formatAge(ts: number): string {
  const diff = Date.now() - ts;
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return `${Math.floor(days / 7)}w ago`;
}
