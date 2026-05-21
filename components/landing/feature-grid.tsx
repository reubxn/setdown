import {
  Activity,
  Trophy,
  Scale,
  TrendingDown,
  Sparkles,
  RefreshCw,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Feature {
  icon: typeof Activity;
  title: string;
  description: string;
  signIn?: boolean;
}

const FEATURES: Feature[] = [
  {
    icon: Activity,
    title: "Volume trends",
    description: "Track total volume over weeks and months for any exercise.",
  },
  {
    icon: Trophy,
    title: "Personal records",
    description: "Estimated 1RMs and PR history per exercise.",
  },
  {
    icon: Scale,
    title: "Muscle balance",
    description: "Push, pull, legs — see where you're skewed.",
  },
  {
    icon: TrendingDown,
    title: "Plateau detection",
    description: "Flag lifts that have stalled before they cost you progress.",
  },
  {
    icon: Sparkles,
    title: "AI coaching",
    description: "Talk to Claude about your training. Context-aware insights.",
    signIn: true,
  },
  {
    icon: RefreshCw,
    title: "Cross-device sync",
    description: "Same numbers on your phone and your laptop.",
    signIn: true,
  },
];

export function FeatureGrid() {
  return (
    <section className="mx-auto w-full max-w-[1200px] px-6 py-12 lg:py-20">
      <h2 className="text-2xl font-semibold tracking-tight text-[var(--text-primary)] sm:text-3xl">
        What you get
      </h2>
      <p className="mt-2 max-w-2xl text-sm text-[var(--text-secondary)] sm:text-base">
        The full analytics suite, no paywall.
      </p>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map((f) => (
          <Card key={f.title} padding="lg">
            <div className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-md)] bg-[var(--bg-sunken)] text-[var(--accent)]">
              <f.icon className="h-5 w-5" />
            </div>
            <div className="mt-4 flex items-center gap-2">
              <h3 className="text-base font-medium text-[var(--text-primary)]">
                {f.title}
              </h3>
              {f.signIn && <Badge variant="muted">Sign-in</Badge>}
            </div>
            <p className="mt-1.5 text-sm text-[var(--text-secondary)]">
              {f.description}
            </p>
          </Card>
        ))}
      </div>
    </section>
  );
}
