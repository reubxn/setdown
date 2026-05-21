"use client";

import { Suspense } from "react";
import { CsvUploader } from "@/components/upload/csv-uploader";

export default function UploadPage() {
  return (
    <div className="min-h-dvh bg-[var(--bg-primary)] lg:flex lg:items-center lg:justify-center">
      <Suspense
        fallback={
          <p className="p-8 text-center text-sm text-[var(--text-muted)]">
            Loading…
          </p>
        }
      >
        <CsvUploader />
      </Suspense>
    </div>
  );
}
