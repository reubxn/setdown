"use client";

import { useState } from "react";
import { useConvex } from "convex/react";
import { Download, FileText } from "lucide-react";
import { api } from "@/convex/_generated/api";
import { Card, CardHeader, CardBody } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function ExportSection({
  isAuthenticated,
}: {
  isAuthenticated: boolean;
}) {
  const convex = useConvex();
  const exportData = () => convex.query(api.queries.exportUserData.default, {});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleExport() {
    setError(null);
    setBusy(true);
    try {
      const data = await exportData();
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `setdown-export-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Export failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card>
      <CardHeader title="Export" subtitle="Download your data" />
      <CardBody>
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-sm text-[var(--text-primary)]">
                <Download className="h-4 w-4 text-[var(--text-muted)]" aria-hidden />
                Workouts JSON
              </div>
              <div className="text-xs text-[var(--text-muted)]">
                Full dump of your account data.
              </div>
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleExport}
              loading={busy}
              disabled={!isAuthenticated || busy}
            >
              {isAuthenticated ? "Download" : "Sign in"}
            </Button>
          </div>

          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-sm text-[var(--text-primary)]">
                <FileText className="h-4 w-4 text-[var(--text-muted)]" aria-hidden />
                Yearly wrapped PDF
              </div>
              <div className="text-xs text-[var(--text-muted)]">
                A printable year-end recap.
              </div>
            </div>
            <Badge variant="muted">Soon</Badge>
          </div>

          {error && (
            <p className="text-xs text-[var(--danger)]">{error}</p>
          )}
        </div>
      </CardBody>
    </Card>
  );
}
