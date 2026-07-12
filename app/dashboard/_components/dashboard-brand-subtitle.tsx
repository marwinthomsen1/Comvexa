"use client";

import { useDashboardText } from "./dashboard-i18n";

export function DashboardBrandSubtitle() {
  const { text } = useDashboardText();

  return (
    <span className="text-[11px] text-[var(--comvexa-sidebar-muted,#a9d4d2)]">
      {text.appSubtitle}
    </span>
  );
}
