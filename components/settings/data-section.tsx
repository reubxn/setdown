"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useDataset } from "@/context/dataset-context";
import { Card, CardHeader, CardBody } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";

export function DataSection({ isAuthenticated }: { isAuthenticated: boolean }) {
  const router = useRouter();
  const { dataset, clearData } = useDataset();
  const wipeData = useMutation(api.mutations.wipeData.default);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  async function handleClearLocal() {
    if (!confirm("Clear all local workout data? This cannot be undone.")) return;
    await clearData();
    sessionStorage.removeItem("setdown-chat-messages");
    router.replace("/upload");
  }

  async function handleWipeServer() {
    setBusy(true);
    try {
      await wipeData({});
      setConfirmOpen(false);
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card>
      <CardHeader
        title="Data"
        subtitle={
          isAuthenticated
            ? "Your workouts live in your account."
            : "Your data lives in this browser."
        }
      />
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
          {isAuthenticated ? (
            <Button
              variant="danger"
              size="sm"
              onClick={() => setConfirmOpen(true)}
            >
              Wipe all server data
            </Button>
          ) : (
            <Button variant="danger" size="sm" onClick={handleClearLocal}>
              Clear local data
            </Button>
          )}
        </div>

        <p className="mt-4 text-xs text-[var(--text-muted)]">
          Updating from a new export keeps your AI chat history and body
          measurements. Wiping clears workouts, insights, chats, and
          measurements.
        </p>
      </CardBody>

      <Modal
        open={confirmOpen}
        onClose={() => !busy && setConfirmOpen(false)}
        title="Wipe server data"
        description="Permanently removes all of your workouts, insights, chats, and body measurements. Your account stays."
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
              onClick={handleWipeServer}
              loading={busy}
            >
              Wipe everything
            </Button>
          </>
        }
      >
        <p>This cannot be undone.</p>
      </Modal>
    </Card>
  );
}
