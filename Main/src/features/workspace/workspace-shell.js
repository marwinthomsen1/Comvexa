"use client";
import "./creative-home.css";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Brand } from "@/components/layout/brand";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { StudioIcon as Icon } from "@/components/ui/studio-icon";
import { WorkspaceProvider } from "./workspace-provider";
const links = [
 ["/dashboard", "Home", "grid"],
 ["/dashboard/designs", "My Designs", "image"],
 ["/dashboard/templates", "Templates", "spark"],
 ["/dashboard/packages", "Design Packages", "layers"],
 ["/dashboard/campaigns", "Campaigns", "link"],
];
export function WorkspaceShell({ children }) {
  const pathname = usePathname();
  return (
    <WorkspaceProvider>
      <div className="workspace-shell">
        <aside className="workspace-sidebar">
          <Brand href="/dashboard" />
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
                      : pathname.startsWith(href) || (href === "/dashboard/campaigns" && pathname.startsWith("/dashboard/connected/"))
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
          <Link className="back-home" href="/">
            ← Back to Comvexa
          </Link>
        </aside>
        <div className="workspace-body">
          <header className="workspace-topbar">
            <span>
              <span className="status-dot" />
              YOUR CREATIVE WORKSPACE
            </span>
            <div>
              <ThemeToggle />
              <details className="workspace-account"><summary><Icon name="user"/> Account</summary><div><Link href="/dashboard/settings">Profile & settings</Link><Link href="/dashboard/backups">Backups & recovery</Link><Link href="/dashboard/start">Guided creation</Link><Link href="/dashboard/projects">Organize projects</Link><Link href="/login">Cloud login</Link></div></details>
            </div>
          </header>
          <main id="main-content" className="workspace-main">
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
