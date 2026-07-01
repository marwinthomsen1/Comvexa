"use client";

import { type CSSProperties, useEffect, useMemo, useState } from "react";
import { getLanguageCode, getLanguageDirection, normalizeLanguage } from "./dashboard-i18n";

const defaultSettings = {
  accent: "#2563eb",
  theme: "Normal",
  density: "Comfortable",
  sidebar: "Modern blue",
  cornerStyle: "Soft",
  language: "English",
};

const sidebarThemes: Record<string, { bg: string; title: string; muted: string; border: string; card: string }> = {
  "Modern blue": { bg: "#10233f", title: "#ffffff", muted: "#bfdbfe", border: "rgba(255,255,255,0.10)", card: "rgba(255,255,255,0.06)" },
  "Light sidebar": { bg: "#ffffff", title: "#0f172a", muted: "#475569", border: "#dbeafe", card: "#f8fafc" },
  "Compact dark": { bg: "#172033", title: "#ffffff", muted: "#cbd5e1", border: "rgba(255,255,255,0.10)", card: "rgba(255,255,255,0.06)" },
  Classic: { bg: "#1e293b", title: "#ffffff", muted: "#cbd5e1", border: "rgba(255,255,255,0.10)", card: "rgba(255,255,255,0.06)" },
};

const dashboardThemes: Record<
  string,
  {
    appBg: string;
    surface: string;
    softSurface: string;
    text: string;
    muted: string;
    border: string;
    accent: string;
    accentSoft: string;
    sidebarBg: string;
    sidebarTitle: string;
    sidebarMuted: string;
    sidebarBorder: string;
    sidebarCard: string;
    navActiveBg: string;
    navActiveText: string;
    navHoverBg: string;
  }
> = {
  Normal: {
    appBg: "#eef3f9",
    surface: "#ffffff",
    softSurface: "#f7fbff",
    text: "#020617",
    muted: "#64748b",
    border: "#dbeafe",
    accent: "#2563eb",
    accentSoft: "#eff6ff",
    sidebarBg: "#10233f",
    sidebarTitle: "#ffffff",
    sidebarMuted: "#bfdbfe",
    sidebarBorder: "rgba(255,255,255,0.10)",
    sidebarCard: "rgba(255,255,255,0.06)",
    navActiveBg: "#ffffff",
    navActiveText: "#0f172a",
    navHoverBg: "rgba(255,255,255,0.08)",
  },
  Summer: {
    appBg: "#fff7da",
    surface: "#ffffff",
    softSurface: "#ecfeff",
    text: "#06112f",
    muted: "#476477",
    border: "#bae6fd",
    accent: "#ff6b4a",
    accentSoft: "#fff1d6",
    sidebarBg: "#0e7490",
    sidebarTitle: "#ffffff",
    sidebarMuted: "#cffafe",
    sidebarBorder: "rgba(255,255,255,0.18)",
    sidebarCard: "rgba(255,255,255,0.12)",
    navActiveBg: "#fff7da",
    navActiveText: "#075985",
    navHoverBg: "rgba(255,255,255,0.14)",
  },
  "Old School": {
    appBg: "#f3ead7",
    surface: "#fffaf0",
    softSurface: "#efe2c7",
    text: "#24160c",
    muted: "#6b5a43",
    border: "#d7c19c",
    accent: "#9a6b35",
    accentSoft: "#f8ecd8",
    sidebarBg: "#2f2418",
    sidebarTitle: "#fff7e8",
    sidebarMuted: "#e4cfae",
    sidebarBorder: "rgba(255,247,232,0.14)",
    sidebarCard: "rgba(255,247,232,0.08)",
    navActiveBg: "#fff7e8",
    navActiveText: "#2f2418",
    navHoverBg: "rgba(255,247,232,0.12)",
  },
  Midnight: {
    appBg: "#0b1220",
    surface: "#111827",
    softSurface: "#162033",
    text: "#f8fafc",
    muted: "#cbd5e1",
    border: "#26354f",
    accent: "#38bdf8",
    accentSoft: "#0f2940",
    sidebarBg: "#020617",
    sidebarTitle: "#f8fafc",
    sidebarMuted: "#93c5fd",
    sidebarBorder: "rgba(148,163,184,0.18)",
    sidebarCard: "rgba(148,163,184,0.10)",
    navActiveBg: "#1e293b",
    navActiveText: "#f8fafc",
    navHoverBg: "rgba(148,163,184,0.12)",
  },
};

function readSettings() {
  try {
    const saved = window.localStorage.getItem("comvexa-workspace-settings");
    return saved ? { ...defaultSettings, ...JSON.parse(saved) } : defaultSettings;
  } catch {
    return defaultSettings;
  }
}

function resolveTheme(settings: typeof defaultSettings) {
  const dashboardTheme = dashboardThemes[settings.theme] ?? dashboardThemes.Normal;
  const sidebarTheme =
    settings.theme && settings.theme !== "Normal"
      ? {
          bg: dashboardTheme.sidebarBg,
          title: dashboardTheme.sidebarTitle,
          muted: dashboardTheme.sidebarMuted,
          border: dashboardTheme.sidebarBorder,
          card: dashboardTheme.sidebarCard,
        }
      : sidebarThemes[settings.sidebar] ?? sidebarThemes["Modern blue"];
  const cornerStyle = String(settings.cornerStyle).toLowerCase();
  const accent = settings.theme && settings.theme !== "Normal" ? dashboardTheme.accent : settings.accent;

  return {
    dashboardTheme,
    sidebarTheme,
    accent,
    radius: cornerStyle === "sharp" ? "0.75rem" : cornerStyle === "rounded" ? "2rem" : "1.5rem",
  };
}

export function WorkspaceSettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState(defaultSettings);

  const resolved = useMemo(() => resolveTheme(settings), [settings]);

  useEffect(() => {
    function applySettings() {
      const settings = readSettings();
      const { dashboardTheme, sidebarTheme, accent, radius } = resolveTheme(settings);
      const density = String(settings.density).toLowerCase();

      setSettings(settings);
      document.documentElement.style.setProperty("--comvexa-accent", accent);
      document.documentElement.style.setProperty("--comvexa-app-bg", dashboardTheme.appBg);
      document.documentElement.style.setProperty("--comvexa-surface", dashboardTheme.surface);
      document.documentElement.style.setProperty("--comvexa-soft-surface", dashboardTheme.softSurface);
      document.documentElement.style.setProperty("--comvexa-text", dashboardTheme.text);
      document.documentElement.style.setProperty("--comvexa-muted", dashboardTheme.muted);
      document.documentElement.style.setProperty("--comvexa-border", dashboardTheme.border);
      document.documentElement.style.setProperty("--comvexa-accent-soft", dashboardTheme.accentSoft);
      document.documentElement.style.setProperty("--comvexa-sidebar-bg", sidebarTheme.bg);
      document.documentElement.style.setProperty("--comvexa-sidebar-title", sidebarTheme.title);
      document.documentElement.style.setProperty("--comvexa-sidebar-muted", sidebarTheme.muted);
      document.documentElement.style.setProperty("--comvexa-sidebar-border", sidebarTheme.border);
      document.documentElement.style.setProperty("--comvexa-sidebar-card", sidebarTheme.card);
      document.documentElement.style.setProperty("--comvexa-nav-active-bg", dashboardTheme.navActiveBg);
      document.documentElement.style.setProperty("--comvexa-nav-active-text", dashboardTheme.navActiveText);
      document.documentElement.style.setProperty("--comvexa-nav-hover-bg", dashboardTheme.navHoverBg);
      document.documentElement.style.setProperty("--comvexa-radius", radius);
      document.documentElement.dataset.comvexaDensity = density;
      document.documentElement.dataset.comvexaSidebar = settings.sidebar;
      document.documentElement.dataset.comvexaTheme = settings.theme;
      const language = normalizeLanguage(settings.language);
      document.documentElement.lang = getLanguageCode(language);
      document.documentElement.dir = getLanguageDirection(language);
    }

    applySettings();
    window.addEventListener("storage", applySettings);
    window.addEventListener("comvexa-settings-change", applySettings);

    return () => {
      window.removeEventListener("storage", applySettings);
      window.removeEventListener("comvexa-settings-change", applySettings);
    };
  }, []);

  const style = {
    "--comvexa-accent": resolved.accent,
    "--comvexa-app-bg": resolved.dashboardTheme.appBg,
    "--comvexa-surface": resolved.dashboardTheme.surface,
    "--comvexa-soft-surface": resolved.dashboardTheme.softSurface,
    "--comvexa-text": resolved.dashboardTheme.text,
    "--comvexa-muted": resolved.dashboardTheme.muted,
    "--comvexa-border": resolved.dashboardTheme.border,
    "--comvexa-accent-soft": resolved.dashboardTheme.accentSoft,
    "--comvexa-sidebar-bg": resolved.sidebarTheme.bg,
    "--comvexa-sidebar-title": resolved.sidebarTheme.title,
    "--comvexa-sidebar-muted": resolved.sidebarTheme.muted,
    "--comvexa-sidebar-border": resolved.sidebarTheme.border,
    "--comvexa-sidebar-card": resolved.sidebarTheme.card,
    "--comvexa-nav-active-bg": resolved.dashboardTheme.navActiveBg,
    "--comvexa-nav-active-text": resolved.dashboardTheme.navActiveText,
    "--comvexa-nav-hover-bg": resolved.dashboardTheme.navHoverBg,
    "--comvexa-radius": resolved.radius,
  } as CSSProperties;

  return (
    <div className="comvexa-theme-root min-h-screen" data-comvexa-theme={settings.theme} style={style}>
      {children}
    </div>
  );
}
