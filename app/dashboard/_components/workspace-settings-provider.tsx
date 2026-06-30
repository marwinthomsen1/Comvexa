"use client";

import { useEffect } from "react";

const defaultSettings = {
  accent: "#2563eb",
  density: "Comfortable",
  sidebar: "Modern blue",
  cornerStyle: "Soft",
};

const sidebarThemes: Record<string, { bg: string; title: string; muted: string; border: string; card: string }> = {
  "Modern blue": { bg: "#10233f", title: "#ffffff", muted: "#bfdbfe", border: "rgba(255,255,255,0.10)", card: "rgba(255,255,255,0.06)" },
  "Light sidebar": { bg: "#ffffff", title: "#0f172a", muted: "#475569", border: "#dbeafe", card: "#f8fafc" },
  "Compact dark": { bg: "#172033", title: "#ffffff", muted: "#cbd5e1", border: "rgba(255,255,255,0.10)", card: "rgba(255,255,255,0.06)" },
  Classic: { bg: "#1e293b", title: "#ffffff", muted: "#cbd5e1", border: "rgba(255,255,255,0.10)", card: "rgba(255,255,255,0.06)" },
};

function readSettings() {
  try {
    const saved = window.localStorage.getItem("comvexa-workspace-settings");
    return saved ? { ...defaultSettings, ...JSON.parse(saved) } : defaultSettings;
  } catch {
    return defaultSettings;
  }
}

export function WorkspaceSettingsProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    function applySettings() {
      const settings = readSettings();
      const sidebarTheme = sidebarThemes[settings.sidebar] ?? sidebarThemes["Modern blue"];
      const density = String(settings.density).toLowerCase();
      const cornerStyle = String(settings.cornerStyle).toLowerCase();

      document.documentElement.style.setProperty("--comvexa-accent", settings.accent);
      document.documentElement.style.setProperty("--comvexa-sidebar-bg", sidebarTheme.bg);
      document.documentElement.style.setProperty("--comvexa-sidebar-title", sidebarTheme.title);
      document.documentElement.style.setProperty("--comvexa-sidebar-muted", sidebarTheme.muted);
      document.documentElement.style.setProperty("--comvexa-sidebar-border", sidebarTheme.border);
      document.documentElement.style.setProperty("--comvexa-sidebar-card", sidebarTheme.card);
      document.documentElement.style.setProperty(
        "--comvexa-radius",
        cornerStyle === "sharp" ? "0.75rem" : cornerStyle === "rounded" ? "2rem" : "1.5rem",
      );
      document.documentElement.style.setProperty(
        "--comvexa-app-bg",
        settings.sidebar === "Light sidebar" ? "#f8fafc" : "#eef3f9",
      );
      document.documentElement.dataset.comvexaDensity = density;
      document.documentElement.dataset.comvexaSidebar = settings.sidebar;
    }

    applySettings();
    window.addEventListener("storage", applySettings);
    window.addEventListener("comvexa-settings-change", applySettings);

    return () => {
      window.removeEventListener("storage", applySettings);
      window.removeEventListener("comvexa-settings-change", applySettings);
    };
  }, []);

  return children;
}
