import type { LucideIcon } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type StatCardProps = {
  title: string;
  value: string;
  description?: string;
  icon: LucideIcon;
  tone?: "default" | "success" | "warning" | "danger";
};

const toneClasses = {
  default: {
    card: "border-violet-500/15 bg-gradient-to-br from-violet-500/10 via-card to-transparent shadow-[0_14px_38px_-30px_rgba(139,92,246,0.42)]",
    icon: "bg-violet-500/12 text-violet-500 ring-violet-500/15",
    glow: "bg-violet-500/10",
  },
  success: {
    card: "border-emerald-500/15 bg-gradient-to-br from-emerald-500/10 via-card to-transparent shadow-[0_14px_38px_-30px_rgba(16,185,129,0.42)]",
    icon: "bg-emerald-500/12 text-emerald-500 ring-emerald-500/15",
    glow: "bg-emerald-500/10",
  },
  warning: {
    card: "border-amber-500/15 bg-gradient-to-br from-amber-500/10 via-card to-transparent shadow-[0_14px_38px_-30px_rgba(245,158,11,0.42)]",
    icon: "bg-amber-500/12 text-amber-500 ring-amber-500/15",
    glow: "bg-amber-500/10",
  },
  danger: {
    card: "border-rose-500/15 bg-gradient-to-br from-rose-500/10 via-card to-transparent shadow-[0_14px_38px_-30px_rgba(244,63,94,0.42)]",
    icon: "bg-rose-500/12 text-rose-500 ring-rose-500/15",
    glow: "bg-rose-500/10",
  },
};

export function StatCard({
  title,
  value,
  description,
  icon: Icon,
  tone = "default",
}: StatCardProps) {
  const classes = toneClasses[tone];

  return (
    <Card
      className={cn(
        "relative overflow-hidden",
        classes.card
      )}
    >
      <div
        className={cn(
          "pointer-events-none absolute -right-8 -top-8 size-28 rounded-full blur-3xl",
          classes.glow
        )}
      />
      <CardContent className="relative p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
              {title}
            </p>
            <p className="mt-3 text-2xl font-semibold tracking-tight text-foreground">
              {value}
            </p>
          </div>
          <div
            className={cn(
              "flex size-11 shrink-0 items-center justify-center rounded-2xl ring-1",
              classes.icon
            )}
          >
            <Icon className="size-5" />
          </div>
        </div>
        {description ? (
          <p className="mt-4 text-xs leading-5 text-muted-foreground">
            {description}
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
