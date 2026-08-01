import type { ReactNode } from "react";
import { Sparkles } from "lucide-react";

type PageHeaderProps = {
  title: string;
  description?: string;
  action?: ReactNode;
};

export function PageHeader({ title, description, action }: PageHeaderProps) {
  return (
    <header className="relative overflow-hidden rounded-[1.75rem] border border-white/8 bg-gradient-to-br from-violet-500/8 via-card/95 to-emerald-500/6 px-5 py-5 sm:px-7 sm:py-6">
      <div className="pointer-events-none absolute -right-16 -top-20 size-48 rounded-full bg-violet-500/8 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-20 left-1/4 size-40 rounded-full bg-emerald-500/7 blur-3xl" />

      <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-violet-500/15 bg-violet-500/8 px-2.5 py-1 text-[11px] font-medium text-violet-400">
            <Sparkles className="size-3" /> Masroufi workspace
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            {title}
          </h1>
          {description ? (
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              {description}
            </p>
          ) : null}
        </div>

        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
    </header>
  );
}
