"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { supabase } from "@/src/lib/supabase/client";

type Workspace = {
  companyName: string;
  fullName: string;
};

export function DashboardAccount() {
  const router = useRouter();
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
        <p className="text-sm font-semibold text-slate-800">{workspace.companyName}</p>
        <p className="text-xs text-slate-500">{workspace.fullName}</p>
      </div>
      <button
        type="button"
        onClick={handleSignOut}
        className="inline-flex h-11 items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
      >
        <LogOut size={16} />
        Sign out
      </button>
    </div>
  );
}
