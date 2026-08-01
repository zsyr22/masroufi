import Link from "next/link";
import {
  ArrowLeftRight,
  ArrowUpRight,
  Plus,
  ReceiptText,
  ShoppingBasket,
  Sparkles,
} from "lucide-react";

const actions = [
  {
    href: "/transactions/new",
    label: "Expense / income",
    caption: "Quick money entry",
    icon: Plus,
    card: "border-emerald-500/15 from-emerald-500/14 via-card to-transparent hover:border-emerald-500/30 hover:shadow-[0_20px_60px_-35px_rgba(16,185,129,0.7)]",
    iconClass: "bg-emerald-500/12 text-emerald-500 ring-emerald-500/15",
  },
  {
    href: "/purchases/new",
    label: "New purchase",
    caption: "Receipt with products",
    icon: ShoppingBasket,
    card: "border-amber-500/15 from-amber-500/14 via-card to-transparent hover:border-amber-500/30 hover:shadow-[0_20px_60px_-35px_rgba(245,158,11,0.7)]",
    iconClass: "bg-amber-500/12 text-amber-500 ring-amber-500/15",
  },
  {
    href: "/bills",
    label: "Pay a bill",
    caption: "DEWA, internet, mobile",
    icon: ReceiptText,
    card: "border-sky-500/15 from-sky-500/14 via-card to-transparent hover:border-sky-500/30 hover:shadow-[0_20px_60px_-35px_rgba(14,165,233,0.7)]",
    iconClass: "bg-sky-500/12 text-sky-500 ring-sky-500/15",
  },
  {
    href: "/transfers/new",
    label: "Move money",
    caption: "Between your accounts",
    icon: ArrowLeftRight,
    card: "border-cyan-500/15 from-cyan-500/14 via-card to-transparent hover:border-cyan-500/30 hover:shadow-[0_20px_60px_-35px_rgba(6,182,212,0.7)]",
    iconClass: "bg-cyan-500/12 text-cyan-500 ring-cyan-500/15",
  },
  {
    href: "/subscriptions",
    label: "Subscriptions",
    caption: "Renewals and payments",
    icon: Sparkles,
    card: "border-fuchsia-500/15 from-fuchsia-500/14 via-card to-transparent hover:border-fuchsia-500/30 hover:shadow-[0_20px_60px_-35px_rgba(217,70,239,0.7)]",
    iconClass: "bg-fuchsia-500/12 text-fuchsia-500 ring-fuchsia-500/15",
  },
];

export function QuickActions() {
  return (
    <section>
      <div className="mb-3 flex items-end justify-between gap-4">
        <div>
          <h2 className="text-sm font-semibold">Quick actions</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Everything you record most, one click away.
          </p>
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <Link
              key={action.href}
              href={action.href}
              className={`group relative overflow-hidden rounded-2xl border bg-gradient-to-br p-4 transition duration-300 hover:-translate-y-1 ${action.card}`}
            >
              <div className="flex items-start justify-between gap-3">
                <span
                  className={`flex size-11 items-center justify-center rounded-2xl ring-1 transition duration-300 group-hover:scale-105 ${action.iconClass}`}
                >
                  <Icon className="size-5" />
                </span>
                <ArrowUpRight className="size-4 text-muted-foreground/50 transition duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-foreground" />
              </div>
              <p className="mt-5 text-sm font-semibold text-foreground">
                {action.label}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {action.caption}
              </p>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
