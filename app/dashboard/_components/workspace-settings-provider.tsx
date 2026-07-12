"use client";

import { type CSSProperties, useEffect, useMemo, useState } from "react";
import { getLanguageCode, getLanguageDirection, normalizeLanguage } from "./dashboard-i18n";

const defaultSettings = {
  accent: "#0c8b84",
  theme: "Normal",
  density: "Comfortable",
  sidebar: "Modern blue",
  cornerStyle: "Soft",
  language: "English",
};

const sidebarThemes: Record<string, { bg: string; title: string; muted: string; border: string; card: string }> = {
  "Modern blue": { bg: "#073d47", title: "#ffffff", muted: "#a9d4d2", border: "rgba(255,255,255,0.11)", card: "rgba(255,255,255,0.065)" },
  "Light sidebar": { bg: "#fffefa", title: "#073d47", muted: "#5d7477", border: "#d8e2dc", card: "#eef9f5" },
  "Compact dark": { bg: "#052f37", title: "#ffffff", muted: "#b7d0cf", border: "rgba(255,255,255,0.10)", card: "rgba(255,255,255,0.06)" },
  Classic: { bg: "#173f45", title: "#ffffff", muted: "#c5d8d6", border: "rgba(255,255,255,0.10)", card: "rgba(255,255,255,0.06)" },
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
    appBg: "#f6f3eb",
    surface: "#fffefa",
    softSurface: "#eef9f5",
    text: "#073d47",
    muted: "#5d7477",
    border: "#d8e2dc",
    accent: "#0c8b84",
    accentSoft: "#dffff8",
    sidebarBg: "#073d47",
    sidebarTitle: "#ffffff",
    sidebarMuted: "#a9d4d2",
    sidebarBorder: "rgba(255,255,255,0.11)",
    sidebarCard: "rgba(255,255,255,0.065)",
    navActiveBg: "#fff0ba",
    navActiveText: "#073d47",
    navHoverBg: "rgba(255,255,255,0.08)",
  },
  Summer: {
    appBg: "#fff7df",
    surface: "#fffefa",
    softSurface: "#e8faf5",
    text: "#073d47",
    muted: "#526f72",
    border: "#cfe4dd",
    accent: "#c7432f",
    accentSoft: "#fff0eb",
    sidebarBg: "#075d65",
    sidebarTitle: "#ffffff",
    sidebarMuted: "#c5f1e8",
    sidebarBorder: "rgba(255,255,255,0.18)",
    sidebarCard: "rgba(255,255,255,0.12)",
    navActiveBg: "#fff0ba",
    navActiveText: "#073d47",
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
      document.documentElement.style.setProperty("--comvexa-success", "#0c8b84");
      document.documentElement.style.setProperty("--comvexa-success-soft", "#dffff8");
      document.documentElement.style.setProperty("--comvexa-warning", "#8a6500");
      document.documentElement.style.setProperty("--comvexa-warning-soft", "#fff0ba");
      document.documentElement.style.setProperty("--comvexa-danger", "#c7432f");
      document.documentElement.style.setProperty("--comvexa-danger-soft", "#fff0eb");
      document.documentElement.style.setProperty("--comvexa-focus", "#39d9c6");
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
      [
        "--comvexa-accent",
        "--comvexa-app-bg",
        "--comvexa-surface",
        "--comvexa-soft-surface",
        "--comvexa-text",
        "--comvexa-muted",
        "--comvexa-border",
        "--comvexa-accent-soft",
        "--comvexa-sidebar-bg",
        "--comvexa-sidebar-title",
        "--comvexa-sidebar-muted",
        "--comvexa-sidebar-border",
        "--comvexa-sidebar-card",
        "--comvexa-nav-active-bg",
        "--comvexa-nav-active-text",
        "--comvexa-nav-hover-bg",
        "--comvexa-radius",
        "--comvexa-success",
        "--comvexa-success-soft",
        "--comvexa-warning",
        "--comvexa-warning-soft",
        "--comvexa-danger",
        "--comvexa-danger-soft",
        "--comvexa-focus",
      ].forEach((property) => document.documentElement.style.removeProperty(property));
      delete document.documentElement.dataset.comvexaDensity;
      delete document.documentElement.dataset.comvexaSidebar;
      delete document.documentElement.dataset.comvexaTheme;
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
    "--comvexa-success": "#0c8b84",
    "--comvexa-success-soft": "#dffff8",
    "--comvexa-warning": "#8a6500",
    "--comvexa-warning-soft": "#fff0ba",
    "--comvexa-danger": "#c7432f",
    "--comvexa-danger-soft": "#fff0eb",
    "--comvexa-focus": "#39d9c6",
  } as CSSProperties;

  return (
    <div className="comvexa-theme-root min-h-screen" data-comvexa-theme={settings.theme} style={style}>
      {children}
    </div>
  );
}
