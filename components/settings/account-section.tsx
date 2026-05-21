"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { useRouter } from "next/navigation";
import { api } from "@/convex/_generated/api";
import { useAuth, type AuthUser } from "@/context/auth-context";
import { Card, CardHeader, CardBody } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";

export function AccountSection({ user }: { user: AuthUser }) {
  const { signOut } = useAuth();
  const router = useRouter();
  const deleteAccount = useMutation(api.mutations.deleteAccount.default);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    setError(null);
    setBusy(true);
    try {
      await deleteAccount({});
      await signOut();
      router.replace("/");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete account");
      setBusy(false);
    }
  }

  return (
    <Card>
      <CardHeader title="Account" subtitle="Your signed-in identity" />
      <CardBody>
        <div className="flex items-center gap-4">
          {user.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={user.image}
              alt=""
              className="h-12 w-12 rounded-full"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--accent)] text-base font-semibold text-black">
              {(user.name ?? user.email ?? "?").slice(0, 1).toUpperCase()}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-medium text-[var(--text-primary)]">
              {user.name ?? "—"}
            </div>
            <div className="truncate text-xs text-[var(--text-muted)]">
              {user.email ?? "—"}
            </div>
          </div>
          <Badge variant="muted">Google</Badge>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          <Button variant="secondary" size="sm" onClick={() => signOut()}>
            Sign out
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={() => {
              setConfirmText("");
              setError(null);
              setConfirmOpen(true);
            }}
          >
            Delete account
          </Button>
        </div>
      </CardBody>

      <Modal
        open={confirmOpen}
        onClose={() => !busy && setConfirmOpen(false)}
        title="Delete account"
        description="This permanently removes your workouts, insights, chat history, and body measurements. This cannot be undone."
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
              onClick={handleDelete}
              loading={busy}
              disabled={busy || confirmText !== "delete"}
            >
              Delete forever
            </Button>
          </>
        }
      >
        <p className="mb-3">
          Type <span className="font-mono text-[var(--text-primary)]">delete</span> to confirm.
        </p>
        <input
          type="text"
          value={confirmText}
          onChange={(e) => setConfirmText(e.target.value)}
          className="w-full rounded-md border border-[var(--border-subtle)] bg-[var(--bg-base)] px-3 py-2 text-sm text-[var(--text-primary)] focus:border-[var(--border-strong)] focus:outline-none"
          placeholder="delete"
          autoComplete="off"
        />
        {error && (
          <p className="mt-3 text-xs text-[var(--danger)]">{error}</p>
        )}
      </Modal>
    </Card>
  );
}
