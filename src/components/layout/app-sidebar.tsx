"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  WalletCards,
  ArrowLeftRight,
  Users,
  Repeat2,
  ChartNoAxesCombined,
  Settings,
} from "lucide-react";

import { cn } from "@/lib/utils";

const navigationItems = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Accounts",
    href: "/accounts",
    icon: WalletCards,
  },
  {
    label: "Transactions",
    href: "/transactions",
    icon: ArrowLeftRight,
  },
  {
    label: "People",
    href: "/people",
    icon: Users,
  },
  {
    label: "Subscriptions",
    href: "/subscriptions",
    icon: Repeat2,
  },
  {
    label: "Reports",
    href: "/reports",
    icon: ChartNoAxesCombined,
  },
];

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-screen w-64 flex-col border-r bg-background p-4">
      <div className="mb-8 px-3">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
          Personal Finance
        </p>

        <h1 className="mt-2 text-2xl font-semibold tracking-tight">
          Masroufi
        </h1>
      </div>

      <nav className="flex flex-1 flex-col gap-1">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <Icon className="size-4" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <Link
        href="/settings"
        className={cn(
          "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
          pathname === "/settings"
            ? "bg-accent text-accent-foreground"
            : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
        )}
      >
        <Settings className="size-4" />
        <span>Settings</span>
      </Link>
    </aside>
  );
}
