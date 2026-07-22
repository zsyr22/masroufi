import type { ReactNode } from "react";

import { AppSidebar } from "@/components/layout/app-sidebar";

type AppLayoutProps = {
  children: ReactNode;
};

export function AppLayout({
  children,
}: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <AppSidebar />

      <main className="min-h-screen md:pl-64">
        <div className="mx-auto w-full max-w-[1600px] px-5 py-6 md:px-8 md:py-8">
          {children}
        </div>
      </main>
    </div>
  );
}