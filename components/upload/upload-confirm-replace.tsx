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
        This replaces the workouts stored in this browser with the ones in your
        new export.
      </p>
    </Modal>
  );
}
