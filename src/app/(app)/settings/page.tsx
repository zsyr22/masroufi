import { redirect } from "next/navigation";
import {
  CircleUserRound,
  CloudCog,
  Database,
  Info,
  LockKeyhole,
  MoonStar,
  ShieldCheck,
} from "lucide-react";

import { ThemeSwitcher } from "@/components/layout/theme-switcher";
import { PageHeader } from "@/components/shared/page-header";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { PasswordForm } from "@/features/settings/components/password-form";
import { createClient } from "@/lib/supabase/server";

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  return (
    <div className="space-y-8">
      <PageHeader
        title="Settings"
        description="Manage your profile, security, appearance, and data preferences."
      />

      <div className="grid gap-5 xl:grid-cols-[1fr_1.35fr]">
        <div className="space-y-5">
          <Card className="border-violet-500/15 bg-gradient-to-br from-violet-500/8 via-card to-transparent">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <CircleUserRound className="size-5" />
                </div>
                <div>
                  <CardTitle>Account</CardTitle>
                  <CardDescription>Your signed-in Masroufi identity.</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Email</p>
                <p className="mt-1 break-all font-medium">{user.email ?? "No email available"}</p>
              </div>
              <Separator />
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium">Account status</p>
                  <p className="text-xs text-muted-foreground">Authenticated Supabase user</p>
                </div>
                <Badge variant="outline">Active</Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="border-sky-500/15 bg-gradient-to-br from-sky-500/8 via-card to-transparent">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <MoonStar className="size-5" />
                </div>
                <div>
                  <CardTitle>Appearance</CardTitle>
                  <CardDescription>Choose how Masroufi looks on this device.</CardDescription>
                </div>
              </div>
              <CardAction>
                <ThemeSwitcher />
              </CardAction>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-6 text-muted-foreground">
                Theme preferences are stored locally and applied automatically when you return.
              </p>
            </CardContent>
          </Card>

          <Card className="border-emerald-500/15 bg-gradient-to-br from-emerald-500/8 via-card to-transparent">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Database className="size-5" />
                </div>
                <div>
                  <CardTitle>Data & privacy</CardTitle>
                  <CardDescription>How your financial information is stored.</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-start gap-3">
                <ShieldCheck className="mt-0.5 size-4 text-primary" />
                <p className="text-muted-foreground">Your records are protected by per-user Row Level Security.</p>
              </div>
              <div className="flex items-start gap-3">
                <CloudCog className="mt-0.5 size-4 text-primary" />
                <p className="text-muted-foreground">Data is synchronized through your private Supabase account.</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-5">
          <Card className="border-rose-500/15 bg-gradient-to-br from-rose-500/8 via-card to-transparent">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <LockKeyhole className="size-5" />
                </div>
                <div>
                  <CardTitle>Security</CardTitle>
                  <CardDescription>Change your password without leaving Masroufi.</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <PasswordForm />
            </CardContent>
          </Card>

          <Card className="border-amber-500/15 bg-gradient-to-br from-amber-500/8 via-card to-transparent">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Info className="size-5" />
                </div>
                <div>
                  <CardTitle>About Masroufi</CardTitle>
                  <CardDescription>Your personal finance workspace.</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/8 bg-background/45 p-4">
                <p className="text-xs text-muted-foreground">Version</p>
                <p className="mt-1 font-semibold">0.1.0</p>
              </div>
              <div className="rounded-2xl border border-white/8 bg-background/45 p-4">
                <p className="text-xs text-muted-foreground">Currencies</p>
                <p className="mt-1 font-semibold">AED & USD</p>
              </div>
              <div className="rounded-2xl border border-white/8 bg-background/45 p-4">
                <p className="text-xs text-muted-foreground">Storage</p>
                <p className="mt-1 font-semibold">Supabase</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
