"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { createClient } from "@/lib/supabase/client";

export function AuthRecoveryHandler() {
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;

    async function recoverSession() {
      const hash = new URLSearchParams(window.location.hash.slice(1));
      const accessToken = hash.get("access_token");
      const refreshToken = hash.get("refresh_token");
      const type = hash.get("type");

      if (type !== "recovery" || !accessToken || !refreshToken) {
        return;
      }

      const supabase = createClient();
      const { error } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });

      if (cancelled) {
        return;
      }

      if (error) {
        window.history.replaceState(
          {},
          "",
          "/login?recovery_error=invalid_or_expired"
        );
        router.replace("/login?recovery_error=invalid_or_expired");
        return;
      }

      // Remove the tokens from the address bar immediately.
      window.history.replaceState({}, "", "/reset-password");
      router.replace("/reset-password");
      router.refresh();
    }

    void recoverSession();

    return () => {
      cancelled = true;
    };
  }, [router]);

  return null;
}
