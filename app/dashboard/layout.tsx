import Image from "next/image";
import { DashboardNav } from "./_components/dashboard-nav";
import { DashboardAuthGuard } from "./_components/dashboard-auth-guard";
import { WorkspaceSettingsProvider } from "./_components/workspace-settings-provider";
import { DashboardHeader } from "./_components/dashboard-header";
import { DashboardBrandSubtitle } from "./_components/dashboard-brand-subtitle";
import { FirstPlanTutorial } from "./_components/first-plan-tutorial";
import { AiSupportChat } from "./_components/ai-support-chat";

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <WorkspaceSettingsProvider>
    <div className="min-h-screen bg-[var(--comvexa-app-bg,#eef3f9)] text-[var(--comvexa-text,#020617)] lg:flex">
      <aside className="relative z-30 border-b border-slate-200 bg-[var(--comvexa-sidebar-bg,#10233f)] text-[var(--comvexa-sidebar-title,#ffffff)] lg:fixed lg:inset-y-0 lg:flex lg:w-72 lg:flex-col lg:border-b-0">
        <div className="border-b border-[var(--comvexa-sidebar-border,rgba(255,255,255,0.10))] bg-white/[0.03] px-4 py-3 lg:px-5 lg:py-5">
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
            <DashboardBrandSubtitle />
          </div>
          </div>
        </div>
        <DashboardNav />
      </aside>

      <div className="comvexa-dashboard-area relative z-0 flex min-h-screen flex-1 flex-col lg:pl-72">
        <DashboardHeader />
        <DashboardAuthGuard>
          {children}
          <FirstPlanTutorial />
          <AiSupportChat />
        </DashboardAuthGuard>
      </div>
    </div>
    </WorkspaceSettingsProvider>
  );
}
