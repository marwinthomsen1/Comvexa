"use client";
import "./creative-home.css";
import "./workspace-sidebar.css";
import "./workspace-topbar.css";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Brand } from "@/components/layout/brand";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { StudioIcon as Icon } from "@/components/ui/studio-icon";
import { WorkspaceProvider } from "./workspace-provider";
const links = [
 ["/dashboard", "Home", "grid", "Your creative overview"],
 ["/dashboard/designs", "My Designs", "image", "Every idea, in one place"],
 ["/dashboard/templates", "Templates", "spark", "A little head start"],
 ["/dashboard/packages", "Design Packages", "layers", "One idea. Every format."],
 ["/dashboard/campaigns", "Campaigns", "link", "Keep it all connected"],
];
export function WorkspaceShell({ children }) {
  const pathname = usePathname();
  const pageTitle = pathname === "/dashboard" ? "Overview" : pathname.startsWith("/dashboard/connected") ? "Campaigns" : links.find(([href])=>href!=="/dashboard"&&pathname.startsWith(href))?.[1] || ({settings:"Settings",backups:"Account & recovery",start:"Guided creation",projects:"Projects"}[pathname.split("/")[2]]) || "Workspace";
  return (
    <WorkspaceProvider>
      <div className="workspace-shell">
        <aside className="workspace-sidebar">
          <Brand href="/dashboard" />
          <Link href="/dashboard/designs?create=1" className="sidebar-create">
            <span className="sidebar-create-icon"><Icon name="plus" /></span>
            <span>Create something<span>A new idea starts here</span></span>
            <span className="sidebar-create-arrow" aria-hidden="true">↗</span>
          </Link>
          <div className="workspace-label"><span>YOUR WORKSPACE</span><span className="sidebar-label-line" /></div>
          <nav aria-label="Workspace navigation">
            {links.map(([href, label, icon, description], index) => (
              <Link
                key={href}
                style={{"--nav-index":index}}
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
                <span className="sidebar-nav-icon"><Icon name={icon} /></span>
                <span className="sidebar-nav-copy"><span>{label}</span><small>{description}</small></span>
                <span className="sidebar-nav-indicator" aria-hidden="true" />
              </Link>
            ))}
          </nav>
          <div className="sidebar-bottom">
            <div className="sidebar-inspiration">
              <div className="sidebar-orbit" aria-hidden="true"><span/><span/><Icon name="spark" /></div>
              <span className="sidebar-inspiration-kicker">MADE FOR YOUR NEXT BIG IDEA</span>
              <p>A little spark.<br/><em>Endless possibilities.</em></p>
              <Link href="/dashboard/templates">Find your inspiration <span aria-hidden="true">↗</span></Link>
            </div>
            <Link className="back-home" href="/"><Icon name="back"/><span>Back to Comvexa</span><span aria-hidden="true">↗</span></Link>
            <span className="sidebar-signature">CREATE ONCE. USE EVERYWHERE.</span>
          </div>
        </aside>
        <div className="workspace-body">
          <header className="workspace-topbar">
            <div className="topbar-location"><span className="topbar-mark" aria-hidden="true"><Icon name="spark" size={15}/></span><Link href="/dashboard">Workspace</Link><span className="topbar-divider" aria-hidden="true">/</span><span className="topbar-page">{pageTitle}</span></div>
            <div className="topbar-actions">
              <Link href="/dashboard/templates" className="topbar-inspiration"><Icon name="spark" size={14}/><span>Find inspiration</span></Link>
              <span className="topbar-action-divider" aria-hidden="true"/>
              <ThemeToggle />
              <details className="workspace-account"><summary><span className="topbar-avatar"><Icon name="user" size={15}/></span><span className="topbar-account-label">My account</span><Icon name="chevron" size={12}/></summary><div><span className="topbar-menu-label">YOUR COMVEXA SPACE</span><Link href="/dashboard/settings"><Icon name="user" size={15}/> Profile & settings</Link><Link href="/dashboard/backups"><Icon name="save" size={15}/> Backups & recovery</Link><Link href="/dashboard/projects"><Icon name="folder" size={15}/> Organize projects</Link><Link href="/dashboard/start"><Icon name="spark" size={15}/> Guided creation</Link></div></details>
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
