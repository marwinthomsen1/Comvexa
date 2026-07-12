import Image from "next/image";
import Link from "next/link";
import { DashboardNav } from "./_components/dashboard-nav";
import { DashboardAuthGuard } from "./_components/dashboard-auth-guard";
import { WorkspaceSettingsProvider } from "./_components/workspace-settings-provider";
import { DashboardHeader } from "./_components/dashboard-header";
import { DashboardBrandSubtitle } from "./_components/dashboard-brand-subtitle";
import { FirstPlanTutorial } from "./_components/first-plan-tutorial";
import { AiSupportChat } from "./_components/ai-support-chat";
import "./dashboard.css";

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <WorkspaceSettingsProvider>
    <div className="comvexa-dashboard-v2 min-h-screen bg-[var(--comvexa-app-bg,#f6f3eb)] pb-24 text-[var(--comvexa-text,#073d47)] lg:flex lg:pb-0">
      <a href="#dashboard-content" className="fixed left-4 top-3 z-[100] -translate-y-24 rounded-full bg-[var(--comvexa-text,#073d47)] px-5 py-3 text-sm font-bold text-white shadow-xl transition focus:translate-y-0">
        Skip to dashboard
      </a>

      <aside className="comvexa-dashboard-sidebar contents text-[var(--comvexa-sidebar-title,#ffffff)] lg:fixed lg:inset-y-0 lg:left-0 lg:z-30 lg:flex lg:w-[17rem] lg:flex-col lg:overflow-hidden lg:border-r lg:border-[var(--comvexa-sidebar-border,rgba(255,255,255,0.10))] lg:bg-[var(--comvexa-sidebar-bg,#073d47)]">
        <div className="hidden shrink-0 px-4 pb-3 pt-4 lg:block">
          <Link href="/dashboard" className="flex items-center gap-3 rounded-2xl px-2 py-2 transition hover:bg-white/[0.06]" aria-label="Comvexa dashboard home">
            <span className="relative grid size-11 shrink-0 place-items-center overflow-hidden rounded-2xl bg-white shadow-lg shadow-black/10">
              <Image
                src="/logo.png"
                alt=""
                width={44}
                height={44}
                className="size-full object-contain p-1"
                priority
              />
              <span className="absolute bottom-0.5 right-0.5 size-2.5 rounded-full bg-[#39d9c6] ring-2 ring-white" />
            </span>
            <span className="min-w-0">
              <span className="block text-lg font-black tracking-[-0.04em]">Comvexa</span>
              <span className="block truncate"><DashboardBrandSubtitle /></span>
            </span>
          </Link>
        </div>
        <DashboardNav />
      </aside>

      <div className="comvexa-dashboard-area relative z-0 flex min-h-screen min-w-0 flex-1 flex-col lg:pl-[17rem]">
        <DashboardHeader />
        <DashboardAuthGuard>
          <div id="dashboard-content" className="flex min-h-0 flex-1 flex-col">
            {children}
          </div>
          <FirstPlanTutorial />
          <AiSupportChat />
        </DashboardAuthGuard>
      </div>
    </div>
    </WorkspaceSettingsProvider>
  );
}
