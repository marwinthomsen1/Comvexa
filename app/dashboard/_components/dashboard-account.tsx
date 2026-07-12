"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, LogOut, Settings, UserRound } from "lucide-react";
import { supabase } from "@/src/lib/supabase/client";
import { useDashboardText } from "./dashboard-i18n";

type Workspace = {
  companyName: string;
  fullName: string;
};

export function DashboardAccount({ compact = false }: { compact?: boolean }) {
  const router = useRouter();
  const { text } = useDashboardText();
  const containerRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
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

    void loadWorkspace();
  }, []);

  useEffect(() => {
    if (!open) {
      return;
    }

    function closeMenu(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    window.addEventListener("mousedown", closeMenu);
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      window.removeEventListener("mousedown", closeMenu);
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.replace("/login");
  }

  const initials = workspace.fullName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "CV";

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="flex h-11 items-center gap-2 rounded-2xl border border-[var(--comvexa-border,#d8e2dc)] bg-[var(--comvexa-surface,#fffefa)] p-1.5 pr-2 text-left shadow-sm transition hover:bg-[var(--comvexa-soft-surface,#eef9f5)]"
        aria-label="Open account menu"
        aria-expanded={open}
      >
        <span className="grid size-8 place-items-center rounded-xl bg-[var(--comvexa-action,#073d47)] text-[11px] font-black text-[var(--comvexa-on-action,#ffffff)]">
          {initials}
        </span>
        {!compact ? (
          <span className="hidden min-w-0 sm:block">
            <span className="block max-w-28 truncate text-xs font-black text-[var(--comvexa-text,#073d47)]">{workspace.companyName}</span>
            <span className="block max-w-28 truncate text-[10px] text-[var(--comvexa-muted,#5d7477)]">{workspace.fullName}</span>
          </span>
        ) : null}
        <ChevronDown size={14} className={`hidden text-[var(--comvexa-muted,#5d7477)] transition sm:block ${open ? "rotate-180" : ""}`} />
      </button>

      {open ? (
        <div className="absolute right-0 top-[calc(100%+0.65rem)] z-50 w-72 overflow-hidden rounded-2xl border border-[var(--comvexa-border,#d8e2dc)] bg-[var(--comvexa-surface,#fffefa)] shadow-[0_24px_60px_rgba(7,61,71,0.18)]">
          <div className="border-b border-[var(--comvexa-border,#d8e2dc)] bg-[var(--comvexa-soft-surface,#eef9f5)] p-4">
            <div className="flex items-center gap-3">
              <span className="grid size-10 place-items-center rounded-2xl bg-[var(--comvexa-accent-soft,#dffff8)] text-[var(--comvexa-accent,#0c8b84)]"><UserRound size={18} /></span>
              <div className="min-w-0">
                <p className="truncate text-sm font-black text-[var(--comvexa-text,#073d47)]">{workspace.companyName}</p>
                <p className="mt-0.5 truncate text-xs text-[var(--comvexa-muted,#5d7477)]">{workspace.fullName}</p>
              </div>
            </div>
          </div>
          <div className="p-2">
            <Link href="/dashboard/settings" onClick={() => setOpen(false)} className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold text-[var(--comvexa-text,#073d47)] hover:bg-[var(--comvexa-soft-surface,#eef9f5)]">
              <Settings size={16} />
              Workspace settings
            </Link>
            <button type="button" onClick={handleSignOut} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-bold text-[var(--comvexa-danger,#c7432f)] hover:bg-[var(--comvexa-danger-soft,#fff0eb)]">
              <LogOut size={16} />
              {text.signOut}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
