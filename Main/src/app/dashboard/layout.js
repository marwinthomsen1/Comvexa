import WorkspaceAccount from "@/features/reliability/workspace-account";
import { WorkspaceShell } from "@/features/workspace/workspace-shell";
export const metadata = { title: "Your creative space — Comvexa" };
export default function DashboardLayout({ children }) {
  return <WorkspaceAccount><WorkspaceShell>{children}</WorkspaceShell></WorkspaceAccount>;
}
