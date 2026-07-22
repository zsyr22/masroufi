import type { ReactNode } from "react";

import { AppSidebar } from "@/components/layout/app-sidebar";

type AppLayoutProps = {
  children: ReactNode;
};

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="flex min-h-screen bg-muted/20">
      <AppSidebar />

      <main className="min-w-0 flex-1 p-8">
        {children}
      </main>
    </div>
  );
}
