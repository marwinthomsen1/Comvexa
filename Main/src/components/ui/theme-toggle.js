"use client";
import {accountStorage} from "@/lib/cloud/account-scope";


import { Icon } from "@/components/ui/icon";

export function ThemeToggle() {
  function toggleTheme() {
    const root = document.documentElement;
    const next = root.dataset.theme === "dark" ? "light" : "dark";
    root.dataset.theme = next;
    try {
      accountStorage().setItem("comvexa-theme", next);
    } catch {
      /* Theme still works when storage is unavailable. */
    }
  }
  return (
    <button
      className="button theme-toggle"
      onClick={toggleTheme}
      aria-label="Toggle light and dark theme"
    >
      <span className="theme-light">
        <Icon name="moon" />
      </span>
      <span className="theme-dark">
        <Icon name="sun" />
      </span>
      <span>Switch theme</span>
    </button>
  );
}
