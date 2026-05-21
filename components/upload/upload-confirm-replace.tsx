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
      title="Replace your workout data?"
      description={
        fileName
          ? `We'll replace your existing workouts with ${fileName}.`
          : "We'll replace your existing workouts with the new file."
      }
      footer={
        <>
          <Button variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
          <Button variant="primary" onClick={onConfirm}>
            Replace
          </Button>
        </>
      }
    >
      <p>
        We&apos;ll keep your AI chat history and body measurements, but replace
        your workouts.
      </p>
    </Modal>
  );
}
