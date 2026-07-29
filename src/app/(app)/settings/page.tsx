import { redirect } from "next/navigation";
import { CircleUserRound, Info, MoonStar, ShieldCheck } from "lucide-react";

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
import { PasswordForm } from "@/features/settings/components/password-form";
import { createClient } from "@/lib/supabase/server";

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Settings"
        description="Manage your account, security, and app appearance."
      />

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <CircleUserRound className="size-5" />
              </div>
              <div>
                <CardTitle>Account</CardTitle>
                <CardDescription>Your signed-in Masroufi account.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-1">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Email</p>
            <p className="break-all font-medium">{user.email ?? "No email available"}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <MoonStar className="size-5" />
              </div>
              <div>
                <CardTitle>Appearance</CardTitle>
                <CardDescription>Choose light, dark, or system theme.</CardDescription>
              </div>
            </div>
            <CardAction>
              <ThemeSwitcher />
            </CardAction>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Your theme preference is saved automatically on this device.
            </p>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <ShieldCheck className="size-5" />
              </div>
              <div>
                <CardTitle>Security</CardTitle>
                <CardDescription>Use at least eight characters for your new password.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <PasswordForm />
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Info className="size-5" />
              </div>
              <div>
                <CardTitle>About Masroufi</CardTitle>
                <CardDescription>Personal finance and expense tracking.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-x-8 gap-y-3 text-sm">
            <div>
              <p className="text-muted-foreground">Version</p>
              <p className="font-medium">0.1.0</p>
            </div>
            <div>
              <p className="text-muted-foreground">Default currencies</p>
              <p className="font-medium">AED and USD</p>
            </div>
            <div>
              <p className="text-muted-foreground">Data storage</p>
              <p className="font-medium">Supabase</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
