"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/src/lib/supabase/client";

export function AdminMfaGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    async function checkMfa() {
      const { data: sessionData } = await supabase.auth.getSession();

      if (!sessionData.session) {
        router.replace("/login");
        return;
      }

      const { data: assurance, error } =
        await supabase.auth.mfa.getAuthenticatorAssuranceLevel();

      if (
        !error &&
        assurance?.currentLevel === "aal1" &&
        assurance.nextLevel === "aal2"
      ) {
        window.sessionStorage.setItem("comvexa-mfa-return-to", "/admin");
        router.replace("/mfa-verify");
        return;
      }

      setChecking(false);
    }

    void checkMfa();
  }, [router]);

  if (checking) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 p-6 text-white">
        <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-6 py-5 text-sm font-semibold">
          <span className="size-3 animate-pulse rounded-full bg-cyan-300" />
          Checking account security...
        </div>
      </main>
    );
  }

  return children;
}
