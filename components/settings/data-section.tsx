"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useDataset } from "@/context/dataset-context";
import { Card, CardHeader, CardBody } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";

export function DataSection() {
  const router = useRouter();
  const { dataset, clearData } = useDataset();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  async function handleClearLocal() {
    setBusy(true);
    try {
      await clearData();
      setConfirmOpen(false);
      router.replace("/upload");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card>
      <CardHeader title="Data" subtitle="Your data lives in this browser." />
      <CardBody>
        {dataset && (
          <div className="mb-4 rounded-md border border-[var(--border-subtle)] bg-[var(--bg-sunken)] p-3 text-xs">
            <div className="text-[var(--text-secondary)]">
              {dataset.fileName}
            </div>
            <div className="text-[var(--text-muted)]">
              {dataset.sessions.length} sessions · {dataset.exercises.length}{" "}
              exercises
            </div>
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          <Link href="/upload?replace=1">
            <Button variant="secondary" size="sm">
              Update from new export
            </Button>
          </Link>
          <Button
            variant="danger"
            size="sm"
            onClick={() => setConfirmOpen(true)}
          >
            Clear local data
          </Button>
        </div>

        <p className="mt-4 text-xs text-[var(--text-muted)]">
          Updating from a new export replaces your workouts with the ones in
          that file. Clearing removes them from this browser entirely.
        </p>
      </CardBody>

      <Modal
        open={confirmOpen}
        onClose={() => !busy && setConfirmOpen(false)}
        title="Clear local data"
        description="Permanently removes the workouts stored in this browser."
        footer={
          <>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setConfirmOpen(false)}
              disabled={busy}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={handleClearLocal}
              loading={busy}
            >
              Clear everything
            </Button>
          </>
        }
      >
        <p>This cannot be undone.</p>
      </Modal>
    </Card>
  );
}
