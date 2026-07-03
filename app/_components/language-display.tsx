"use client";

import { useEffect, useState } from "react";

const languages = [
  { value: "English", label: "English" },
  { value: "German", label: "Deutsch" },
  { value: "French", label: "Français" },
  { value: "Spanish", label: "Español" },
];

const homeText: Record<string, Record<string, string>> = {
  English: {
    platform: "Platform",
    accounting: "Accounting",
    pricing: "Pricing",
    faq: "FAQ",
    login: "Login",
    startTrial: "Start Pro Trial",
    eyebrow: "Global company management software",
    headline: "Manage any business, anywhere.",
    subhead:
      "Comvexa gives companies one workspace for customers, employees, bookings, tasks, invoices, payments, expenses, documents, reports, branches, inventory, and daily operations.",
    createWorkspace: "Create your workspace",
    explorePlatform: "Explore platform",
    monthly: "Monthly",
    yearly: "Yearly",
    yearlyNote: "Yearly billing includes 2 months free.",
    monthlyNote: "Switch to yearly to see annual pricing.",
    month: "month",
    year: "year",
    equivalent: "Equivalent to",
    signUpFirst: "Sign up first",
  },
  Arabic: {
    platform: "المنصة",
    accounting: "المحاسبة",
    pricing: "الأسعار",
    faq: "الأسئلة",
    login: "تسجيل الدخول",
    startTrial: "ابدأ تجربة Pro",
    eyebrow: "برنامج عالمي لإدارة الشركات",
    headline: "أدر أي عمل، في أي مكان.",
    subhead:
      "تمنح Comvexa الشركات مساحة عمل واحدة للعملاء والموظفين والحجوزات والمهام والفواتير والمدفوعات والمصروفات والمستندات والتقارير والفروع والمخزون والعمليات اليومية.",
    createWorkspace: "أنشئ مساحة العمل",
    explorePlatform: "استكشف المنصة",
    monthly: "شهري",
    yearly: "سنوي",
    yearlyNote: "الفوترة السنوية تشمل شهرين مجاناً.",
    monthlyNote: "بدّل إلى السنوي لعرض السعر السنوي.",
    month: "شهر",
    year: "سنة",
    equivalent: "يعادل",
    signUpFirst: "سجّل أولاً",
  },
  German: {
    platform: "Plattform",
    accounting: "Buchhaltung",
    pricing: "Preise",
    faq: "FAQ",
    login: "Anmelden",
    startTrial: "Pro-Test starten",
    eyebrow: "Globale Unternehmenssoftware",
    headline: "Jedes Unternehmen überall verwalten.",
    subhead:
      "Comvexa bietet Unternehmen einen Arbeitsbereich für Kunden, Mitarbeiter, Buchungen, Aufgaben, Rechnungen, Zahlungen, Ausgaben, Dokumente, Berichte, Filialen, Inventar und tägliche Abläufe.",
    createWorkspace: "Arbeitsbereich erstellen",
    explorePlatform: "Plattform ansehen",
    monthly: "Monatlich",
    yearly: "Jährlich",
    yearlyNote: "Jährliche Abrechnung enthält 2 Monate gratis.",
    monthlyNote: "Wechseln Sie zu jährlich, um Jahrespreise zu sehen.",
    month: "Monat",
    year: "Jahr",
    equivalent: "Entspricht",
    signUpFirst: "Zuerst registrieren",
  },
  French: {
    platform: "Plateforme",
    accounting: "Comptabilité",
    pricing: "Tarifs",
    faq: "FAQ",
    login: "Connexion",
    startTrial: "Essai Pro",
    eyebrow: "Logiciel mondial de gestion d'entreprise",
    headline: "Gérez toute entreprise, partout.",
    subhead:
      "Comvexa donne aux entreprises un espace de travail pour clients, employés, réservations, tâches, factures, paiements, dépenses, documents, rapports, succursales, inventaire et opérations quotidiennes.",
    createWorkspace: "Créer votre espace",
    explorePlatform: "Explorer la plateforme",
    monthly: "Mensuel",
    yearly: "Annuel",
    yearlyNote: "La facturation annuelle inclut 2 mois gratuits.",
    monthlyNote: "Passez à annuel pour voir le prix annuel.",
    month: "mois",
    year: "an",
    equivalent: "Équivaut à",
    signUpFirst: "S'inscrire d'abord",
  },
  Spanish: {
    platform: "Plataforma",
    accounting: "Contabilidad",
    pricing: "Precios",
    faq: "FAQ",
    login: "Iniciar sesión",
    startTrial: "Iniciar prueba Pro",
    eyebrow: "Software global de gestión empresarial",
    headline: "Gestiona cualquier negocio, en cualquier lugar.",
    subhead:
      "Comvexa ofrece a las empresas un espacio de trabajo para clientes, empleados, reservas, tareas, facturas, pagos, gastos, documentos, informes, sucursales, inventario y operaciones diarias.",
    createWorkspace: "Crear espacio",
    explorePlatform: "Explorar plataforma",
    monthly: "Mensual",
    yearly: "Anual",
    yearlyNote: "La facturación anual incluye 2 meses gratis.",
    monthlyNote: "Cambia a anual para ver el precio anual.",
    month: "mes",
    year: "año",
    equivalent: "Equivale a",
    signUpFirst: "Registrarse primero",
  },
};

function normalizeLanguage(language: string | null) {
  return languages.some((item) => item.value === language) ? language ?? "English" : "English";
}

function readLanguage() {
  try {
    const settings = window.localStorage.getItem("comvexa-workspace-settings");
    const parsed = settings ? JSON.parse(settings) : null;
    return normalizeLanguage(parsed?.language ?? window.localStorage.getItem("comvexa-selected-language"));
  } catch {
    return "English";
  }
}

function writeLanguage(language: string) {
  window.localStorage.setItem("comvexa-selected-language", language);

  try {
    const saved = window.localStorage.getItem("comvexa-workspace-settings");
    const settings = saved ? JSON.parse(saved) : {};
    window.localStorage.setItem("comvexa-workspace-settings", JSON.stringify({ ...settings, language }));
  } catch {
    window.localStorage.setItem("comvexa-workspace-settings", JSON.stringify({ language }));
  }

  document.documentElement.lang = { English: "en", German: "de", French: "fr", Spanish: "es" }[language] ?? "en";
  document.documentElement.dir = "ltr";
  window.dispatchEvent(new Event("comvexa-settings-change"));
  window.dispatchEvent(new Event("comvexa-language-change"));
}

export function useHomeText() {
  const [language, setLanguage] = useState("English");

  useEffect(() => {
    function syncLanguage() {
      const nextLanguage = readLanguage();
      setLanguage(nextLanguage);
      document.documentElement.dir = "ltr";
    }

    syncLanguage();
    window.addEventListener("storage", syncLanguage);
    window.addEventListener("comvexa-settings-change", syncLanguage);
    window.addEventListener("comvexa-language-change", syncLanguage);

    return () => {
      window.removeEventListener("storage", syncLanguage);
      window.removeEventListener("comvexa-settings-change", syncLanguage);
      window.removeEventListener("comvexa-language-change", syncLanguage);
    };
  }, []);

  return homeText[language] ?? homeText.English;
}

export function HomeText({ id }: { id: keyof typeof homeText.English }) {
  const text = useHomeText();
  return <>{text[id]}</>;
}

export function LanguageSelector({ tone = "dark" }: { tone?: "dark" | "light" }) {
  const [language, setLanguage] = useState("English");
  const selectClass =
    tone === "light"
      ? "h-10 rounded-xl border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-950 outline-none hover:bg-slate-50 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
      : "h-10 rounded-xl border border-white/15 bg-white/10 px-3 text-sm font-semibold text-white outline-none hover:bg-white/15 focus:border-emerald-300 focus:ring-4 focus:ring-emerald-400/20 [&_option]:bg-white [&_option]:text-slate-950";

  useEffect(() => {
    function syncLanguage() {
      setLanguage(readLanguage());
    }

    syncLanguage();
    window.addEventListener("storage", syncLanguage);
    window.addEventListener("comvexa-settings-change", syncLanguage);
    window.addEventListener("comvexa-language-change", syncLanguage);

    return () => {
      window.removeEventListener("storage", syncLanguage);
      window.removeEventListener("comvexa-settings-change", syncLanguage);
      window.removeEventListener("comvexa-language-change", syncLanguage);
    };
  }, []);

  return (
    <label>
      <span className="sr-only">Display language</span>
      <select
        value={language}
        onChange={(event) => writeLanguage(event.target.value)}
        className={selectClass}
      >
        {languages.map((item) => (
          <option key={item.value} value={item.value}>
            {item.label}
          </option>
        ))}
      </select>
    </label>
  );
}
