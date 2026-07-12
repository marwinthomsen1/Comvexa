"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { hasOwnerDashboardAccess } from "@/src/lib/admin/access";
import { supabase } from "@/src/lib/supabase/client";
import { enableOwnerPlanAccess } from "./payment-status";

export function DashboardAuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    async function checkSession() {
      const { data } = await supabase.auth.getSession();

      if (!data.session) {
        router.replace("/login");
        return;
      }

      if (hasOwnerDashboardAccess(data.session.user.email)) {
        enableOwnerPlanAccess(window.localStorage.getItem("comvexa-selected-plan"), "monthly", data.session.user.email);
      }

      setIsChecking(false);
    }

    checkSession();
  }, [router]);

  if (isChecking) {
    return (
      <main className="flex min-h-screen flex-1 items-center justify-center p-6">
        <div className="flex items-center gap-3 rounded-2xl border border-[var(--comvexa-border,#d8e2dc)] bg-[var(--comvexa-surface,#fffefa)] px-6 py-5 text-sm font-bold text-[var(--comvexa-text,#073d47)] shadow-sm" role="status">
          <span className="size-3 animate-pulse rounded-full bg-[var(--comvexa-accent,#0c8b84)]" />
          Loading Comvexa workspace...
        </div>
      </main>
    );
  }

  return children;
}
