"use client";

import { Suspense, useCallback, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Dropzone } from "@/components/upload/dropzone";
import { UploadProgress } from "@/components/upload/upload-progress";
import { UploadConfirmReplace } from "@/components/upload/upload-confirm-replace";
import { useDataset } from "@/context/dataset-context";
import { useAuth } from "@/context/auth-context";
import {
  uploadCsvFile,
  type UploadProgress as UploadProgressState,
} from "@/lib/upload-orchestrator";

function UploadPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isReplace = searchParams.get("replace") === "1";
  const { dataset, refresh } = useDataset();
  const { isAuthenticated } = useAuth();

  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [progress, setProgress] = useState<UploadProgressState>({
    stage: "idle",
  });

  const runUpload = useCallback(
    async (file: File) => {
      setProgress({ stage: "reading" });
      try {
        await uploadCsvFile(file, {
          isAuthenticated,
          onProgress: setProgress,
        });
        await refresh();
        router.replace("/overview");
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Upload failed. Try again.";
        setProgress({ stage: "error", error: message });
      }
    },
    [isAuthenticated, refresh, router],
  );

  const onFileSelected = useCallback(
    (file: File) => {
      const hasExisting = isReplace || dataset !== null;
      if (hasExisting) {
        setPendingFile(file);
        return;
      }
      void runUpload(file);
    },
    [dataset, isReplace, runUpload],
  );

  const showProgress =
    progress.stage !== "idle" && progress.stage !== "error";

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-2xl flex-col justify-center px-4 py-8 sm:px-8 lg:py-16">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold tracking-tight lg:text-3xl">
          Upload your Strong export
        </h1>
        <p className="mt-2 text-sm text-[var(--text-muted)]">
          {isAuthenticated
            ? "We'll save it to your account."
            : "We'll save it to this browser. Sign in to sync across devices."}
        </p>
      </div>

      {showProgress ? (
        <UploadProgress stage={progress.stage} rowCount={progress.rowCount} />
      ) : (
        <>
          <Dropzone size="md" onFileSelected={onFileSelected} />
          {progress.stage === "error" && progress.error ? (
            <div className="mt-4 rounded-md border border-[var(--danger)]/40 bg-[var(--danger)]/10 px-3 py-2 text-sm text-[var(--danger)]">
              {progress.error}
            </div>
          ) : null}
        </>
      )}

      <UploadConfirmReplace
        open={pendingFile !== null}
        fileName={pendingFile?.name}
        onCancel={() => setPendingFile(null)}
        onConfirm={() => {
          const file = pendingFile;
          setPendingFile(null);
          if (file) void runUpload(file);
        }}
      />
    </div>
  );
}

export default function UploadPage() {
  return (
    <div className="min-h-dvh bg-[var(--bg-base)] lg:flex lg:items-center lg:justify-center">
      <Suspense
        fallback={
          <p className="p-8 text-center text-sm text-[var(--text-muted)]">
            Loading…
          </p>
        }
      >
        <UploadPageInner />
      </Suspense>
    </div>
  );
}
