"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { SegmentedControl } from "@/components/ui/segmented-control";
import type { Units } from "@/context/preferences-context";

export interface UploadUnitsPromptProps {
  open: boolean;
  onConfirm: (units: Units) => void;
}

export function UploadUnitsPrompt({ open, onConfirm }: UploadUnitsPromptProps) {
  const [units, setUnits] = useState<Units>("kg");

  return (
    <Modal
      open={open}
      onClose={() => {}}
      closeOnBackdrop={false}
      title="Are these weights in kg or lb?"
      description="We'll use this to label your numbers across the app."
      footer={
        <Button variant="primary" onClick={() => onConfirm(units)}>
          Continue
        </Button>
      }
    >
      <SegmentedControl<Units>
        value={units}
        onChange={setUnits}
        options={[
          { value: "kg", label: "kg" },
          { value: "lb", label: "lb" },
        ]}
        aria-label="Weight units"
      />
    </Modal>
  );
}
