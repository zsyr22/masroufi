"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { navigationItems } from "@/components/layout/navigation-items";
import { LogoutButton } from "@/features/auth/components/logout-button";
import { cn } from "@/lib/utils";

export function MobileNavigation() {
  const pathname = usePathname(); const [open, setOpen] = useState(false);
  return <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b bg-background/90 px-5 backdrop-blur md:hidden">
    <Link href="/dashboard" className="flex items-center gap-2"><span className="flex size-8 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 text-sm font-bold text-white">M</span><span className="font-semibold">Masroufi</span></Link>
    <Dialog open={open} onOpenChange={setOpen}><DialogTrigger render={<Button variant="outline" size="icon" aria-label="Open navigation" />}><Menu className="size-5" /></DialogTrigger>
      <DialogContent className="top-0 left-auto right-0 h-dvh max-w-[20rem] translate-x-0 translate-y-0 content-start rounded-none p-5 sm:max-w-[22rem]">
        <DialogHeader className="pr-10"><DialogTitle>Masroufi</DialogTitle><DialogDescription>Everything for your money, without the paperwork mood.</DialogDescription></DialogHeader>
        <nav className="mt-4 flex flex-col gap-1 overflow-y-auto">{navigationItems.map((item) => { const Icon = item.icon; const active = pathname === item.href || pathname.startsWith(`${item.href}/`); return <Link key={item.href} href={item.href} onClick={() => setOpen(false)} className={cn("flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium", active ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:bg-accent/60 hover:text-foreground")}><span className={cn("flex size-8 items-center justify-center rounded-lg", item.tone)}><Icon className="size-4" /></span>{item.label}</Link>; })}</nav>
        <div className="mt-auto border-t pt-4"><LogoutButton /></div>
      </DialogContent>
    </Dialog>
  </header>;
}
