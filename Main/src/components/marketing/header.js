import Link from "next/link";
import { Brand } from "@/components/layout/brand";
import { ThemeToggle } from "@/components/ui/theme-toggle";
export function Header() {
  return (
    <header className="site-header wrap">
      <Brand />
      <nav aria-label="Main navigation">
        <Link href="/#how-it-works">How it works</Link>
        <Link href="/#connected">Connected designs</Link>
        <Link href="/#templates">Templates</Link>
      </nav>
      <div className="header-actions">
        <ThemeToggle />
        <Link className="login-link" href="/login">
          Log in
        </Link>
        <Link className="button button-small" href="/dashboard">
          Explore workspace <span aria-hidden="true">↗</span>
        </Link>
      </div>
    </header>
  );
}
