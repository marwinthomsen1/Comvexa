"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { supabase } from "@/src/lib/supabase/client";
import { useDashboardText } from "./dashboard-i18n";

type Workspace = {
  companyName: string;
  fullName: string;
};

export function DashboardAccount() {
  const router = useRouter();
  const { text } = useDashboardText();
  const [workspace, setWorkspace] = useState<Workspace>({
    companyName: "Workspace",
    fullName: "Account",
  });

  useEffect(() => {
    async function loadWorkspace() {
      const { data: sessionData } = await supabase.auth.getSession();
      const user = sessionData.session?.user;

      if (!user) {
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, companies(name)")
        .eq("id", user.id)
        .single();

      const company = Array.isArray(profile?.companies)
        ? profile?.companies[0]
        : profile?.companies;

      setWorkspace({
        companyName: company?.name ?? "Workspace",
        fullName: profile?.full_name ?? user.email ?? "Account",
      });
    }

    loadWorkspace();
  }, []);

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.replace("/login");
  }

  return (
    <div className="flex items-center gap-3">
      <div className="hidden text-right sm:block">
        <p className="text-sm font-semibold text-[var(--comvexa-text,#1e293b)]">{workspace.companyName}</p>
        <p className="text-xs text-[var(--comvexa-muted,#64748b)]">{workspace.fullName}</p>
      </div>
      <button
        type="button"
        onClick={handleSignOut}
        className="inline-flex h-11 items-center gap-2 rounded-lg border px-4 text-sm font-semibold shadow-sm comvexa-theme-surface hover:opacity-90"
      >
        <LogOut size={16} />
        {text.signOut}
      </button>
    </div>
  );
}
