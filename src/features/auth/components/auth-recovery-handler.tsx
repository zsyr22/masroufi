"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { createClient } from "@/lib/supabase/client";

function getHashParameters() {
  if (typeof window === "undefined") {
    return new URLSearchParams();
  }

  return new URLSearchParams(window.location.hash.replace(/^#/, ""));
}

export function AuthRecoveryHandler() {
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    let cancelled = false;

    async function recoverSession() {
      const hash = getHashParameters();
      const accessToken = hash.get("access_token");
      const refreshToken = hash.get("refresh_token");
      const recoveryType = hash.get("type");
      const query = new URLSearchParams(window.location.search);
      const code = query.get("code");

      try {
        if (accessToken && refreshToken) {
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (!error && !cancelled) {
            window.history.replaceState({}, "", "/reset-password");
            router.replace("/reset-password");
            router.refresh();
          }

          return;
        }

        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);

          if (!error && !cancelled) {
            router.replace("/reset-password");
            router.refresh();
          }

          return;
        }

        if (recoveryType === "recovery" && !cancelled) {
          router.replace("/reset-password");
        }
      } catch {
        // The login page will display the normal form if recovery fails.
      }
    }

    void recoverSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" && !cancelled) {
        router.replace("/reset-password");
        router.refresh();
      }
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [router]);

  return null;
}
