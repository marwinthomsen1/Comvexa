"use client";

import { useDashboardText } from "./dashboard-i18n";

export function DashboardBrandSubtitle() {
  const { text } = useDashboardText();

  return (
    <p className="text-xs text-[var(--comvexa-sidebar-muted,#bfdbfe)]">
      {text.appSubtitle}
    </p>
  );
}
