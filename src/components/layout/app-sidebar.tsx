"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { navigationItems } from "@/components/layout/navigation-items";
import { LogoutButton } from "@/features/auth/components/logout-button";
import { cn } from "@/lib/utils";

export function AppSidebar() {
  const pathname = usePathname();
  const primaryItems = navigationItems.filter((item) => item.href !== "/settings");
  const settingsItem = navigationItems.find((item) => item.href === "/settings")!;
  const SettingsIcon = settingsItem.icon;

  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-sidebar-border bg-sidebar px-3 py-5 text-sidebar-foreground md:flex">
      <Link href="/dashboard" className="mb-7 flex items-center gap-3 px-2">
        <span className="flex size-10 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 text-base font-bold text-white shadow-lg shadow-violet-500/20">M</span>
        <div><h1 className="text-xl font-semibold tracking-tight">Masroufi</h1><p className="text-[11px] text-muted-foreground">Money, minus the boring.</p></div>
      </Link>

      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto pr-1">
        {primaryItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return <Link key={item.href} href={item.href} className={cn("group flex items-center gap-3 rounded-xl px-2.5 py-2.5 text-sm font-medium transition-all", isActive ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm" : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-foreground")}>
            <span className={cn("flex size-8 items-center justify-center rounded-lg transition-transform group-hover:scale-105", item.tone)}><Icon className="size-4" /></span><span>{item.label}</span>
          </Link>;
        })}
      </nav>

      <div className="mt-4 space-y-1 border-t pt-4">
        <Link href={settingsItem.href} className={cn("group flex items-center gap-3 rounded-xl px-2.5 py-2.5 text-sm font-medium", pathname.startsWith("/settings") ? "bg-sidebar-accent text-sidebar-accent-foreground" : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-foreground")}>
          <span className={cn("flex size-8 items-center justify-center rounded-lg", settingsItem.tone)}><SettingsIcon className="size-4" /></span><span>Settings</span>
        </Link>
        <LogoutButton />
      </div>
    </aside>
  );
}
