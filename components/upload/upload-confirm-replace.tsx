// <UploadConfirmReplace open onConfirm onCancel fileName="x.csv" />
"use client";

import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";

export interface UploadConfirmReplaceProps {
  open: boolean;
  fileName?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function UploadConfirmReplace({
  open,
  fileName,
  onConfirm,
  onCancel,
}: UploadConfirmReplaceProps) {
  return (
    <Modal
      open={open}
      onClose={onCancel}
      title="Catch up with your latest export?"
      description={
        fileName
          ? `We'll update your workouts from ${fileName}.`
          : "We'll update your workouts from the new export."
      }
      footer={
        <>
          <Button variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
          <Button variant="primary" onClick={onConfirm}>
            Update
          </Button>
        </>
      }
    >
      <p>
        Your AI chat history and body measurements stay put — we&apos;re just
        catching your workouts up to the new export.
      </p>
    </Modal>
  );
}
