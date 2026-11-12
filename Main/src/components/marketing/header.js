import Link from "next/link";
import { Brand } from "@/components/layout/brand";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Icon } from "@/components/ui/icon";
export function Header() {
  return (
    <header className="site-header creative-header wrap">
      <Brand />
      <nav aria-label="Main navigation">
        <details className="product-menu">
          <summary>
            Product <span aria-hidden="true">⌄</span>
          </summary>
          <div>
            <Link href="/#connected">Connected designs</Link>
            <Link href="/#packages">Design packages</Link>
            <Link href="/dashboard">Local workspace preview</Link>
          </div>
        </details>
        <Link href="/#templates">Templates</Link>
        <Link href="/#how-it-works">How It Works</Link>
        <Link href="/#free-tools">Pricing</Link>
      </nav>
      <div className="header-actions">
        <ThemeToggle />
        <Link className="login-link" href="/login">
          Log In
        </Link>
        <Link className="button button-small" href="/dashboard">
          Get Started Free <Icon name="spark" />
        </Link>
        <details className="mobile-nav">
          <summary aria-label="Open navigation">
            <span aria-hidden="true">☰</span>
          </summary>
          <nav aria-label="Mobile navigation">
            <Link href="/#connected">Connected designs</Link>
            <Link href="/#templates">Templates</Link>
            <Link href="/#how-it-works">How it works</Link>
            <Link href="/#free-tools">Pricing & free tools</Link>
            <Link href="/login">Login preview</Link>
            <Link href="/dashboard">Workspace preview ↗</Link>
          </nav>
        </details>
      </div>
    </header>
  );
}
