"use client";

import { useState } from "react";
import { Activity, MoreHorizontal, Settings, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardBody,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import {
  Dropdown,
  DropdownItem,
  DropdownLabel,
  DropdownSeparator,
} from "@/components/ui/dropdown";
import { IconButton } from "@/components/ui/icon-button";
import { Metric } from "@/components/ui/metric";
import { Modal } from "@/components/ui/modal";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { Skeleton } from "@/components/ui/skeleton";
import { SlideOver } from "@/components/ui/slide-over";
import { Tabs } from "@/components/ui/tabs";
import { ToastProvider, useToast } from "@/components/ui/toast-provider";
import { Tooltip } from "@/components/ui/tooltip";

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border-t border-[var(--border-subtle)] pt-6">
      <h2 className="text-xs font-medium uppercase tracking-wide text-[var(--text-muted)] mb-3">
        {title}
      </h2>
      <div className="flex flex-wrap items-start gap-4">{children}</div>
    </section>
  );
}

function ToastDemo() {
  const toast = useToast();
  return (
    <div className="flex flex-wrap gap-2">
      <Button variant="ghost" size="sm" onClick={() => toast.info("Heads up", "Just letting you know.")}>
        info toast
      </Button>
      <Button variant="ghost" size="sm" onClick={() => toast.success("Saved", "Your changes are live.")}>
        success toast
      </Button>
      <Button variant="ghost" size="sm" onClick={() => toast.warn("Careful", "Quota almost gone.")}>
        warn toast
      </Button>
      <Button variant="ghost" size="sm" onClick={() => toast.danger("Error", "Something broke.")}>
        danger toast
      </Button>
    </div>
  );
}

function PageInner() {
  const [tab, setTab] = useState<"a" | "b" | "c">("a");
  const [range, setRange] = useState<"w" | "m" | "q" | "y">("m");
  const [modal, setModal] = useState(false);
  const [slide, setSlide] = useState(false);

  return (
    <main className="mx-auto max-w-5xl px-6 py-10 space-y-10 text-[var(--text-primary)]">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">
          design system smoke test
        </h1>
        <p className="text-sm text-[var(--text-muted)] mt-1">
          track 1.1 — every primitive rendered for visual review.
        </p>
      </header>

      <Section title="buttons">
        <Button variant="primary">primary</Button>
        <Button variant="secondary">secondary</Button>
        <Button variant="ghost">ghost</Button>
        <Button variant="danger">danger</Button>
        <Button variant="primary" loading>
          loading
        </Button>
        <Button variant="primary" disabled>
          disabled
        </Button>
        <Button variant="primary" size="sm">
          sm
        </Button>
        <Button variant="primary" size="lg">
          lg
        </Button>
        <Button leftIcon={<Activity className="h-4 w-4" />}>with icon</Button>
      </Section>

      <Section title="icon button">
        <IconButton aria-label="more" icon={<MoreHorizontal className="h-4 w-4" />} />
        <IconButton aria-label="settings" variant="solid" icon={<Settings className="h-4 w-4" />} />
        <IconButton aria-label="delete" variant="accent" icon={<Trash2 className="h-4 w-4" />} />
        <IconButton aria-label="small" size="sm" icon={<Activity className="h-4 w-4" />} />
        <IconButton aria-label="large" size="lg" icon={<Activity className="h-5 w-5" />} />
      </Section>

      <Section title="badges">
        <Badge variant="accent">accent</Badge>
        <Badge variant="muted">muted</Badge>
        <Badge variant="success">pr</Badge>
        <Badge variant="warn">stale</Badge>
        <Badge variant="danger">error</Badge>
      </Section>

      <Section title="cards">
        <Card className="w-72">
          <CardHeader
            title="Volume this week"
            subtitle="all exercises"
            action={<Badge variant="accent">+8%</Badge>}
          />
          <CardBody>12,430 kg across 4 sessions.</CardBody>
          <CardFooter>updated 2h ago</CardFooter>
        </Card>
        <Card className="w-60" interactive>
          <CardBody>interactive card — hover me.</CardBody>
        </Card>
      </Section>

      <Section title="metrics">
        <Card className="w-56">
          <Metric
            label="Workouts"
            value="24"
            delta={{ value: "+3", direction: "up" }}
            hint="vs last month"
          />
        </Card>
        <Card className="w-56">
          <Metric
            label="Volume"
            value="12,430"
            unit="kg"
            delta={{ value: "-2%", direction: "down" }}
          />
        </Card>
        <Card className="w-56">
          <Metric label="Streak" value="6" unit="wks" />
        </Card>
      </Section>

      <Section title="tabs">
        <div className="w-full">
          <Tabs
            value={tab}
            onChange={setTab}
            items={[
              { value: "a", label: "Overview" },
              { value: "b", label: "Charts" },
              { value: "c", label: "Notes" },
            ]}
            aria-label="demo tabs"
          />
          <div className="text-xs text-[var(--text-muted)] mt-3">
            selected: {tab}
          </div>
        </div>
      </Section>

      <Section title="segmented control">
        <SegmentedControl
          value={range}
          onChange={setRange}
          aria-label="range"
          options={[
            { value: "w", label: "Week" },
            { value: "m", label: "Month" },
            { value: "q", label: "Quarter" },
            { value: "y", label: "Year" },
          ]}
        />
        <SegmentedControl
          size="sm"
          value={range}
          onChange={setRange}
          options={[
            { value: "w", label: "W" },
            { value: "m", label: "M" },
            { value: "q", label: "Q" },
            { value: "y", label: "Y" },
          ]}
        />
      </Section>

      <Section title="dropdown">
        <Dropdown
          align="start"
          trigger={<Button variant="secondary">open menu</Button>}
        >
          <DropdownLabel>Account</DropdownLabel>
          <DropdownItem>Profile</DropdownItem>
          <DropdownItem>Settings</DropdownItem>
          <DropdownSeparator />
          <DropdownItem variant="danger">Sign out</DropdownItem>
        </Dropdown>
      </Section>

      <Section title="tooltip">
        <Tooltip label="Copy to clipboard">
          <Button variant="ghost" size="sm">
            hover me
          </Button>
        </Tooltip>
        <Tooltip label="Below" side="bottom">
          <Button variant="ghost" size="sm">
            below
          </Button>
        </Tooltip>
      </Section>

      <Section title="modal + slide-over">
        <Button onClick={() => setModal(true)}>open modal</Button>
        <Button variant="secondary" onClick={() => setSlide(true)}>
          open slide-over
        </Button>
        <Modal
          open={modal}
          onClose={() => setModal(false)}
          title="Delete dataset?"
          description="This removes all workout records from your account."
          footer={
            <>
              <Button variant="ghost" onClick={() => setModal(false)}>
                Cancel
              </Button>
              <Button variant="danger" onClick={() => setModal(false)}>
                Delete
              </Button>
            </>
          }
        >
          This action can&apos;t be undone.
        </Modal>
        <SlideOver
          open={slide}
          onClose={() => setSlide(false)}
          title="AI coach"
          description="Ask anything about your training."
        >
          <p>This is the slide-over body. Chat lives here.</p>
        </SlideOver>
      </Section>

      <Section title="skeleton">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-24 w-64" />
        <div className="space-y-2 w-64">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      </Section>

      <Section title="toast">
        <ToastDemo />
      </Section>
    </main>
  );
}

export default function DevUiPage() {
  return (
    <ToastProvider>
      <PageInner />
    </ToastProvider>
  );
}
