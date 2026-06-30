import Image from "next/image";
import { Search, ShieldCheck } from "lucide-react";
import { DashboardNav } from "./_components/dashboard-nav";
import { DashboardAccount } from "./_components/dashboard-account";
import { DashboardAuthGuard } from "./_components/dashboard-auth-guard";
import { WorkspaceSettingsProvider } from "./_components/workspace-settings-provider";

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <WorkspaceSettingsProvider>
    <div className="min-h-screen bg-[var(--comvexa-app-bg,#eef3f9)] text-slate-950 lg:flex">
      <aside className="border-b border-slate-200 bg-[var(--comvexa-sidebar-bg,#10233f)] text-[var(--comvexa-sidebar-title,#ffffff)] lg:fixed lg:inset-y-0 lg:flex lg:w-72 lg:flex-col lg:border-b-0">
        <div className="border-b border-[var(--comvexa-sidebar-border,rgba(255,255,255,0.10))] bg-white/[0.03] px-5 py-5">
          <div className="flex items-center gap-3">
          <Image
            src="/logo.png"
            alt="Comvexa logo"
            width={40}
            height={40}
            className="size-10 rounded-lg object-contain"
            priority
          />
          <div>
            <p className="font-semibold">Comvexa</p>
            <p className="text-xs text-[var(--comvexa-sidebar-muted,#bfdbfe)]">Global operations suite</p>
          </div>
          </div>
        </div>
        <DashboardNav />
      </aside>

      <div className="flex min-h-screen flex-1 flex-col lg:pl-72">
        <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/95 px-6 py-4 backdrop-blur-xl">
          <div className="mx-auto flex max-w-7xl flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-[var(--comvexa-accent,#2563eb)]">
                Comvexa Workspace
              </p>
              <h1 className="mt-1 text-xl font-semibold tracking-normal">Business Dashboard</h1>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <label className="flex h-11 min-w-72 items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-500">
                <Search size={17} />
                <input
                  type="search"
                  placeholder="Search customers, invoices, tasks"
                  className="w-full bg-transparent outline-none placeholder:text-slate-400"
                />
              </label>
              <span className="inline-flex h-11 items-center gap-2 rounded-lg bg-blue-50 px-4 text-sm font-semibold text-[var(--comvexa-accent,#2563eb)] ring-1 ring-blue-100">
                <ShieldCheck size={17} />
                Global workspace ready
              </span>
              <DashboardAccount />
            </div>
          </div>
        </header>
        <DashboardAuthGuard>{children}</DashboardAuthGuard>
      </div>
    </div>
    </WorkspaceSettingsProvider>
  );
}
