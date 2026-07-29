import Link from "next/link";
import { ArrowLeftRight, Plus, ReceiptText, ShoppingBasket, Sparkles } from "lucide-react";

const actions = [
  { href: "/transactions/new", label: "Expense / income", caption: "Quick money entry", icon: Plus, tone: "from-emerald-500/15 to-emerald-500/5 text-emerald-600" },
  { href: "/purchases/new", label: "New purchase", caption: "Receipt with products", icon: ShoppingBasket, tone: "from-amber-500/18 to-orange-500/5 text-amber-700 dark:text-amber-300" },
  { href: "/bills", label: "Pay a bill", caption: "DEWA, internet, mobile", icon: ReceiptText, tone: "from-sky-500/15 to-blue-500/5 text-sky-600" },
  { href: "/transfers/new", label: "Move money", caption: "Between your accounts", icon: ArrowLeftRight, tone: "from-cyan-500/15 to-blue-500/5 text-cyan-600" },
  { href: "/subscriptions", label: "Subscriptions", caption: "Renewals and payments", icon: Sparkles, tone: "from-fuchsia-500/15 to-violet-500/5 text-fuchsia-600" },
];

export function QuickActions() {
  return (
    <section>
      <div className="mb-3"><h2 className="text-sm font-semibold">Quick actions</h2><p className="text-xs text-muted-foreground">Everything you record most, one click away.</p></div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {actions.map((action) => {
          const Icon = action.icon;
          return <Link key={action.href} href={action.href} className={`group rounded-2xl border bg-gradient-to-br p-4 transition hover:-translate-y-0.5 hover:shadow-md ${action.tone}`}><span className="flex size-10 items-center justify-center rounded-xl bg-background/70 shadow-sm"><Icon className="size-4" /></span><p className="mt-4 text-sm font-semibold text-foreground">{action.label}</p><p className="mt-1 text-xs text-muted-foreground">{action.caption}</p></Link>;
        })}
      </div>
    </section>
  );
}
