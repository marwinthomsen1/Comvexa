"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Brand } from "@/components/layout/brand";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Icon } from "@/components/ui/icon";
import { WorkspaceProvider } from "./workspace-provider";
const links = [
  ["/dashboard", "Overview", "grid"],
  ["/dashboard/projects", "Projects", "folder"],
  ["/editor", "Design studio", "image"],
  ["/dashboard/campaigns", "Campaigns", "link"],
  ["/dashboard/templates", "Templates", "spark"],
  ["/dashboard/settings", "Profile & settings", "user"],
];
export function WorkspaceShell({ children }) {
  const pathname = usePathname();
  return (
    <WorkspaceProvider>
      <div className="workspace-shell">
        <aside className="workspace-sidebar">
          <Brand />
          <div className="workspace-label">YOUR CREATIVE SPACE</div>
          <nav aria-label="Workspace navigation">
            {links.map(([href, label, icon]) => (
              <Link
                key={href}
                href={href}
                aria-current={
                  (
                    href === "/dashboard"
                      ? pathname === href
                      : pathname.startsWith(href)
                  )
                    ? "page"
                    : undefined
                }
              >
                <Icon name={icon} />
                <span>{label}</span>
              </Link>
            ))}
          </nav>
          <div className="sidebar-note">
            <Icon name="spark" />
            <strong>A space for what’s next.</strong>
            <p>
              Create in the design studio, or organize projects and campaigns.
            </p>
          </div>
          <Link className="back-home" href="/">
            ← Back to Comvexa
          </Link>
        </aside>
        <div className="workspace-body">
          <header className="workspace-topbar">
            <span>
              <span className="status-dot" />
              LOCAL PREVIEW
            </span>
            <div>
              <ThemeToggle />
              <Link className="account-link" href="/login">
                <Icon name="user" />
                Cloud login
              </Link>
            </div>
          </header>
          <main id="main-content" className="workspace-main">
            <div className="preview-banner">
              <Icon name="link" />
              <p>
                <strong>This is your browser-local preview.</strong> Projects,
                campaigns, and profile changes stay on this browser. No account
                is signed in. Don’t enter sensitive information.
              </p>
            </div>
            {children}
          </main>
          <footer className="workspace-footer">
            COMVEXA / CREATE ONCE. USE EVERYWHERE.
          </footer>
        </div>
      </div>
    </WorkspaceProvider>
  );
}
