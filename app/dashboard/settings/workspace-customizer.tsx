"use client";

import { useEffect, useMemo, useState } from "react";
import {
  BellRing,
  Building2,
  CalendarDays,
  Check,
  FileText,
  Globe2,
  LayoutDashboard,
  ListChecks,
  Palette,
  ReceiptText,
  Save,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  WalletCards,
} from "lucide-react";
import { languageOptions } from "../_components/dashboard-i18n";
import { canUseModule, defaultPlan, normalizePlan, planModules, type PlanName } from "../_components/plan-access";

const accents = [
  { name: "Comvexa Lagoon", value: "#0c8b84" },
  { name: "Executive Blue", value: "#2563eb" },
  { name: "Ocean Cyan", value: "#0891b2" },
  { name: "Emerald", value: "#059669" },
  { name: "Violet", value: "#7c3aed" },
  { name: "Rose", value: "#e11d48" },
  { name: "Amber", value: "#d97706" },
];

const themes = [
  {
    name: "Normal",
    description: "Warm, calm workspace with lagoon accents.",
    swatches: ["#f6f3eb", "#073d47", "#0c8b84"],
  },
  {
    name: "Summer",
    description: "Bright aqua, coral, and sunny panels.",
    swatches: ["#fff7da", "#0e7490", "#ff6b4a"],
  },
  {
    name: "Old School",
    description: "Classic paper, ink, and ledger-style contrast.",
    swatches: ["#f3ead7", "#2f2418", "#9a6b35"],
  },
  {
    name: "Midnight",
    description: "Dark focused workspace with electric blue accents.",
    swatches: ["#0b1220", "#111827", "#38bdf8"],
  },
];

const industries = [
  "General business",
  "Professional services",
  "Retail and commerce",
  "Healthcare and clinics",
  "Construction and contracting",
  "Field services",
  "Agency or studio",
  "Education and training",
];

const moduleGroups = [
  {
    title: "Operations",
    modules: ["Customers", "Employees", "Staff Schedules", "Services", "Bookings", "Tasks", "Time & Attendance"],
  },
  {
    title: "Finance",
    modules: ["Invoices", "Recurring Invoices", "Payments", "Expenses", "Supplier Bills", "Purchase Orders", "Reports"],
  },
  {
    title: "Assets and Control",
    modules: [
      "Documents",
      "Inventory",
      "Branches",
      "Customer Portal",
      "Branch Analytics",
      "WhatsApp Templates",
      "Permissions",
      "AI Assistant",
      "Automations",
      "Audit Logs",
      "Approvals",
      "White Label",
      "Data Import",
    ],
  },
];

const allModules = moduleGroups.flatMap((group) => group.modules);

type Settings = {
  companyDisplayName: string;
  industry: string;
  currency: string;
  timezone: string;
  language: string;
  dateFormat: string;
  theme: string;
  accent: string;
  dashboardStyle: string;
  density: string;
  sidebar: string;
  cornerStyle: string;
  invoicePrefix: string;
  taxLabel: string;
  defaultTaxRate: string;
  paymentTerms: string;
  reminderTone: string;
  startPage: string;
  showSetup: boolean;
  showFinancePulse: boolean;
  enableEmailReminders: boolean;
  enableWhatsappTemplates: boolean;
  modules: string[];
};

type SettingsSection = "basics" | "appearance" | "finance" | "modules";

const defaultSettings: Settings = {
  companyDisplayName: "New Company",
  industry: "General business",
  currency: "USD",
  timezone: "UTC",
  language: "English",
  dateFormat: "MM/DD/YYYY",
  theme: "Normal",
  accent: "#0c8b84",
  dashboardStyle: "Executive",
  density: "Comfortable",
  sidebar: "Modern blue",
  cornerStyle: "Soft",
  invoicePrefix: "INV",
  taxLabel: "Tax",
  defaultTaxRate: "0",
  paymentTerms: "Due on receipt",
  reminderTone: "Professional",
  startPage: "Dashboard",
  showSetup: true,
  showFinancePulse: true,
  enableEmailReminders: true,
  enableWhatsappTemplates: false,
  modules: allModules,
};

export function WorkspaceCustomizer() {
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [saved, setSaved] = useState(false);
  const [currentPlan, setCurrentPlan] = useState<PlanName>(defaultPlan);
  const [activeSection, setActiveSection] = useState<SettingsSection>("basics");

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      const stored = window.localStorage.getItem("comvexa-workspace-settings");

      if (stored) {
        const savedSettings = JSON.parse(stored) as Partial<Settings>;
        setSettings({
          ...defaultSettings,
          ...savedSettings,
          modules: savedSettings.modules ?? allModules,
        });
      }

      setCurrentPlan(normalizePlan(window.localStorage.getItem("comvexa-selected-plan")));
    }, 0);

    return () => window.clearTimeout(timeout);
  }, []);

  useEffect(() => {
    function syncPlan() {
      setCurrentPlan(normalizePlan(window.localStorage.getItem("comvexa-selected-plan")));
    }

    window.addEventListener("storage", syncPlan);
    window.addEventListener("comvexa-plan-change", syncPlan);

    return () => {
      window.removeEventListener("storage", syncPlan);
      window.removeEventListener("comvexa-plan-change", syncPlan);
    };
  }, []);

  const enabledCount = settings.modules.length;
  const completionScore = useMemo(() => {
    const fields = [
      settings.companyDisplayName,
      settings.industry,
      settings.currency,
      settings.timezone,
      settings.invoicePrefix,
      settings.paymentTerms,
      enabledCount ? "modules" : "",
    ];

    return Math.round((fields.filter(Boolean).length / fields.length) * 100);
  }, [enabledCount, settings]);

  function updateSettings(nextSettings: Settings) {
    setSettings(nextSettings);
    window.localStorage.setItem("comvexa-workspace-settings", JSON.stringify(nextSettings));
    window.dispatchEvent(new Event("comvexa-settings-change"));
    setSaved(false);
  }

  function saveSettings() {
    window.localStorage.setItem("comvexa-workspace-settings", JSON.stringify(settings));
    window.dispatchEvent(new Event("comvexa-settings-change"));
    setSaved(true);
  }

  function toggleModule(module: string) {
    if (!canUseModule(currentPlan, module)) {
      return;
    }

    const nextModules = settings.modules.includes(module)
      ? settings.modules.filter((item) => item !== module)
      : [...settings.modules, module];

    updateSettings({ ...settings, modules: nextModules });
  }

  function toggleBoolean(key: keyof Pick<Settings, "showSetup" | "showFinancePulse" | "enableEmailReminders" | "enableWhatsappTemplates">) {
    updateSettings({ ...settings, [key]: !settings[key] });
  }

  const sections = [
    { id: "basics", label: "Basics", description: "Name, industry, language", icon: Building2 },
    { id: "appearance", label: "Appearance", description: "Theme, color, layout", icon: Palette },
    { id: "finance", label: "Finance & Workflow", description: "Currency, tax, reminders", icon: ReceiptText },
    { id: "modules", label: "Modules", description: `${planModules[currentPlan].length} in ${currentPlan}`, icon: LayoutDashboard },
  ] as const;

  return (
    <main className="mx-auto w-full max-w-[1500px] flex-1 p-4 sm:p-6">
      <section className="overflow-hidden rounded-[2rem] border border-blue-100 bg-white shadow-sm shadow-blue-100/70">
        <div className="grid gap-0 xl:grid-cols-[1fr_460px]">
          <div className="bg-[#f7fbff] p-6 sm:p-8">
            <p className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-widest text-blue-700">
              <Sparkles size={14} />
              Workspace customization
            </p>
            <h2 className="mt-5 max-w-3xl text-3xl font-semibold tracking-normal text-slate-950 sm:text-4xl">
              Make Comvexa look and work like your own business system.
            </h2>
            <p className="mt-4 max-w-3xl text-sm leading-6 text-slate-600">
              Control the company identity, regional settings, accounting
              defaults, dashboard layout, module visibility, and reminder
              behavior from one place. Changes apply immediately across the
              dashboard so the workspace matches the way your team operates.
            </p>

            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              <SummaryCard icon={Building2} label="Brand profile" value={settings.companyDisplayName} />
              <SummaryCard icon={Globe2} label="Region" value={`${settings.currency} - ${settings.timezone}`} />
              <SummaryCard icon={LayoutDashboard} label="Modules enabled" value={`${enabledCount}/${allModules.length}`} />
            </div>
          </div>

          <div className="p-6 sm:p-8">
            <PreviewPanel settings={settings} completionScore={completionScore} />
          </div>
        </div>
      </section>

      <section className="mt-6 rounded-[2rem] border border-blue-100 bg-white p-4 shadow-sm shadow-blue-100/70">
        <div className="grid gap-3 md:grid-cols-4">
          {sections.map((section) => {
            const Icon = section.icon;
            const active = activeSection === section.id;

            return (
              <button
                key={section.id}
                type="button"
                onClick={() => setActiveSection(section.id)}
                className={`flex items-center gap-3 rounded-2xl border p-4 text-left transition ${
                  active
                    ? "border-blue-300 bg-blue-50 text-blue-950 shadow-sm"
                    : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                }`}
              >
                <span
                  className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${
                    active ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-500"
                  }`}
                >
                  <Icon size={18} />
                </span>
                <span className="min-w-0">
                  <span className="block font-semibold">{section.label}</span>
                  <span className="mt-0.5 block truncate text-xs opacity-75">{section.description}</span>
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {activeSection === "basics" ? (
      <section className="mt-6 grid gap-6 xl:grid-cols-[1fr_0.9fr]">
        <SettingsCard title="Company Identity" description="How your workspace appears to staff and managers." icon={Building2}>
          <div className="grid gap-4 sm:grid-cols-2">
            <TextInput
              label="Display name"
              value={settings.companyDisplayName}
              onChange={(value) => updateSettings({ ...settings, companyDisplayName: value })}
            />
            <SelectInput
              label="Industry"
              value={settings.industry}
              options={industries}
              onChange={(value) => updateSettings({ ...settings, industry: value })}
            />
            <SelectInput
              label="Default start page"
              value={settings.startPage}
              options={["Dashboard", "Customers", "Invoices", "Reports", "Tasks"]}
              onChange={(value) => updateSettings({ ...settings, startPage: value })}
            />
            <SelectInput
              label="Display language"
              value={settings.language}
              options={languageOptions}
              onChange={(value) => updateSettings({ ...settings, language: value })}
              helper="Applies to the dashboard navigation, workspace header, and account controls."
            />
          </div>
        </SettingsCard>
        <SettingsCard title="What This Changes" description="These settings control the most visible workspace identity." icon={Sparkles}>
          <div className="grid gap-3">
            <InfoRow title="Workspace name" text="Shown in dashboard headings and shared workspace areas." />
            <InfoRow title="Start page" text="Sets the module your team should open first during daily work." />
            <InfoRow title="Language" text="Updates dashboard navigation, header labels, and account controls." />
          </div>
        </SettingsCard>
      </section>
      ) : null}

      {activeSection === "appearance" ? (
      <section className="mt-6">
        <SettingsCard title="Appearance" description="Tune the visual style your team sees every day." icon={Palette}>
          <div className="mb-5">
            <p className="text-sm font-medium text-slate-700">Dashboard theme</p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {themes.map((theme) => (
                <button
                  key={theme.name}
                  type="button"
                  onClick={() => updateSettings({ ...settings, theme: theme.name })}
                  className={`rounded-3xl border p-4 text-left transition ${
                    settings.theme === theme.name
                      ? "border-blue-300 bg-blue-50 text-blue-950 ring-4 ring-blue-100"
                      : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-semibold">{theme.name}</span>
                    {settings.theme === theme.name ? <Check size={16} /> : null}
                  </div>
                  <div className="mt-3 flex gap-2">
                    {theme.swatches.map((swatch) => (
                      <span
                        key={swatch}
                        className="size-7 rounded-full ring-1 ring-black/10"
                        style={{ backgroundColor: swatch }}
                      />
                    ))}
                  </div>
                  <p className="mt-3 text-sm leading-6 text-slate-500">{theme.description}</p>
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-sm font-medium text-slate-700">Accent color</p>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {accents.map((accent) => (
                <button
                  key={accent.value}
                  type="button"
                  onClick={() => updateSettings({ ...settings, accent: accent.value })}
                  className={`flex items-center justify-between rounded-2xl border p-3 text-left text-sm font-semibold transition ${
                    settings.accent === accent.value
                      ? "border-blue-300 bg-blue-50 text-blue-950"
                      : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <span className="size-6 rounded-full ring-1 ring-black/5" style={{ backgroundColor: accent.value }} />
                    {accent.name}
                  </span>
                  {settings.accent === accent.value ? <Check size={16} /> : null}
                </button>
              ))}
            </div>
          </div>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <SelectInput
              label="Dashboard style"
              value={settings.dashboardStyle}
              options={["Executive", "Operational", "Finance focused", "Minimal"]}
              onChange={(value) => updateSettings({ ...settings, dashboardStyle: value })}
            />
            <SelectInput
              label="Sidebar style"
              value={settings.sidebar}
              options={["Modern blue", "Light sidebar", "Compact dark", "Classic"]}
              onChange={(value) => updateSettings({ ...settings, sidebar: value })}
            />
            <SelectInput
              label="Density"
              value={settings.density}
              options={["Comfortable", "Compact", "Spacious"]}
              onChange={(value) => updateSettings({ ...settings, density: value })}
            />
            <SelectInput
              label="Corner style"
              value={settings.cornerStyle}
              options={["Soft", "Sharp", "Rounded"]}
              onChange={(value) => updateSettings({ ...settings, cornerStyle: value })}
            />
          </div>
        </SettingsCard>
      </section>
      ) : null}

      {activeSection === "finance" ? (
      <section className="mt-6 grid gap-6 xl:grid-cols-[0.9fr_1fr]">
        <SettingsCard title="Regional and Accounting Defaults" description="Set the values used by invoices, reports, and financial workflows." icon={ReceiptText}>
          <div className="grid gap-4 sm:grid-cols-2">
            <SelectInput
              label="Currency"
              value={settings.currency}
              options={["USD", "EUR", "GBP", "KWD", "SAR", "AED", "QAR", "BHD", "OMR", "SGD"]}
              onChange={(value) => updateSettings({ ...settings, currency: value })}
            />
            <SelectInput
              label="Timezone"
              value={settings.timezone}
              options={["UTC", "Asia/Riyadh", "Asia/Dubai", "Asia/Kuwait", "Europe/London", "Europe/Berlin", "America/New_York", "Asia/Singapore"]}
              onChange={(value) => updateSettings({ ...settings, timezone: value })}
            />
            <SelectInput
              label="Date format"
              value={settings.dateFormat}
              options={["MM/DD/YYYY", "DD/MM/YYYY", "YYYY-MM-DD"]}
              onChange={(value) => updateSettings({ ...settings, dateFormat: value })}
            />
            <TextInput
              label="Invoice prefix"
              value={settings.invoicePrefix}
              onChange={(value) => updateSettings({ ...settings, invoicePrefix: value.toUpperCase() })}
            />
            <TextInput
              label="Tax label"
              value={settings.taxLabel}
              onChange={(value) => updateSettings({ ...settings, taxLabel: value })}
            />
            <TextInput
              label="Default tax rate"
              value={settings.defaultTaxRate}
              onChange={(value) => updateSettings({ ...settings, defaultTaxRate: value })}
            />
          </div>
        </SettingsCard>

        <SettingsCard title="Workflow Controls" description="Choose what the dashboard emphasizes and how reminders should behave." icon={SlidersHorizontal}>
          <div className="grid gap-3">
            <ToggleRow
              title="Show setup checklist"
              description="Keep onboarding tasks visible on the dashboard."
              checked={settings.showSetup}
              onClick={() => toggleBoolean("showSetup")}
            />
            <ToggleRow
              title="Show finance pulse"
              description="Display revenue, payments, and unpaid invoice signals."
              checked={settings.showFinancePulse}
              onClick={() => toggleBoolean("showFinancePulse")}
            />
            <ToggleRow
              title="Email reminders"
              description="Prepare automatic customer payment reminders."
              checked={settings.enableEmailReminders}
              onClick={() => toggleBoolean("enableEmailReminders")}
            />
            <ToggleRow
              title="WhatsApp templates"
              description="Enable prepared message templates for operations."
              checked={settings.enableWhatsappTemplates}
              onClick={() => toggleBoolean("enableWhatsappTemplates")}
            />
          </div>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <SelectInput
              label="Payment terms"
              value={settings.paymentTerms}
              options={["Due on receipt", "Net 7", "Net 15", "Net 30", "Custom"]}
              onChange={(value) => updateSettings({ ...settings, paymentTerms: value })}
            />
            <SelectInput
              label="Reminder tone"
              value={settings.reminderTone}
              options={["Professional", "Friendly", "Direct", "Formal"]}
              onChange={(value) => updateSettings({ ...settings, reminderTone: value })}
            />
          </div>
        </SettingsCard>
      </section>
      ) : null}

      {activeSection === "modules" ? (
      <section className="mt-6 rounded-[2rem] border border-blue-100 bg-white p-6 shadow-sm shadow-blue-100/70">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-widest text-blue-700">Module Visibility</p>
            <h3 className="mt-2 text-2xl font-semibold tracking-normal text-slate-950">
              Decide what your team sees in the workspace.
            </h3>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
              These switches control workspace visibility. Subscription rules
              still decide which modules are allowed for the selected plan.
              Your current plan is {currentPlan}, with {planModules[currentPlan].length} modules available.
            </p>
          </div>
          <button
            type="button"
            onClick={saveSettings}
            className="inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold text-white shadow-sm"
            style={{ backgroundColor: settings.accent }}
          >
            <Save size={16} />
            {saved ? "Saved automatically" : "Confirm saved settings"}
          </button>
        </div>

        <div className="mt-6 grid gap-5 lg:grid-cols-3">
          {moduleGroups.map((group) => (
            <div key={group.title} className="rounded-3xl border border-slate-200 bg-[#f7fbff] p-4">
              <p className="font-semibold text-slate-950">{group.title}</p>
              <div className="mt-4 grid gap-2">
                {group.modules.map((module) => {
                  const enabled = settings.modules.includes(module);
                  const allowed = canUseModule(currentPlan, module);
                  const ultraOnly = canUseModule("Ultra", module) && !canUseModule("Pro", module);
                  const proPlus = canUseModule("Pro", module) && !canUseModule("Basic", module);

                  return (
                    <button
                      key={module}
                      type="button"
                      onClick={() => toggleModule(module)}
                      disabled={!allowed}
                      className={`flex items-center justify-between rounded-2xl border px-4 py-3 text-left text-sm font-semibold transition ${
                        !allowed
                          ? "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400 opacity-75"
                          : enabled
                          ? "border-blue-200 bg-white text-blue-950 shadow-sm"
                          : "border-slate-200 bg-slate-50 text-slate-500"
                      }`}
                    >
                      <span>
                        <span className="block">{module}</span>
                        {!allowed ? (
                          <span className="mt-1 block text-xs font-semibold text-slate-400">
                            {ultraOnly ? "Ultra only" : proPlus ? "Pro or Ultra" : "Not included"}
                          </span>
                        ) : ultraOnly ? (
                          <span className="mt-1 block text-xs font-semibold text-blue-500">Ultra module</span>
                        ) : null}
                      </span>
                      <span
                        className={`flex size-6 items-center justify-center rounded-full ${
                          enabled && allowed ? "text-white" : "bg-white text-slate-300 ring-1 ring-slate-200"
                        }`}
                        style={enabled && allowed ? { backgroundColor: settings.accent } : undefined}
                      >
                        {enabled && allowed ? <Check size={14} /> : null}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </section>
      ) : null}
    </main>
  );
}

function PreviewPanel({
  settings,
  completionScore,
}: {
  settings: Settings;
  completionScore: number;
}) {
  return (
    <div className="rounded-[1.75rem] border border-blue-100 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span
            className="flex size-12 items-center justify-center rounded-2xl text-sm font-bold text-white"
            style={{ backgroundColor: settings.accent }}
          >
            {settings.companyDisplayName.slice(0, 2).toUpperCase()}
          </span>
          <div>
            <p className="font-semibold text-slate-950">{settings.companyDisplayName || "Company"}</p>
            <p className="text-xs text-slate-500">{settings.industry}</p>
          </div>
        </div>
        <span className="rounded-full bg-blue-50 px-3 py-1 text-sm font-semibold text-blue-700">
          {completionScore}% ready
        </span>
      </div>

      <div className="mt-5 h-2 rounded-full bg-slate-100">
        <div
          className="h-2 rounded-full"
          style={{ width: `${completionScore}%`, backgroundColor: settings.accent }}
        />
      </div>

      <div className="mt-6 rounded-3xl bg-[#10233f] p-4 text-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-widest text-blue-100/70">{settings.dashboardStyle} dashboard</p>
            <p className="mt-1 font-semibold">{settings.theme} theme - {settings.startPage} first</p>
          </div>
          <ShieldCheck size={22} className="text-cyan-200" />
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <PreviewStat icon={WalletCards} label="Currency" value={settings.currency} />
          <PreviewStat icon={CalendarDays} label="Date" value={settings.dateFormat} />
          <PreviewStat icon={ReceiptText} label="Terms" value={settings.paymentTerms} />
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <PreviewToggle icon={BellRing} label="Email reminders" active={settings.enableEmailReminders} />
        <PreviewToggle icon={FileText} label="Finance pulse" active={settings.showFinancePulse} />
        <PreviewToggle icon={ListChecks} label="Setup checklist" active={settings.showSetup} />
        <PreviewToggle icon={Globe2} label={settings.timezone} active />
      </div>

      <div className="mt-5 rounded-3xl border border-slate-200 bg-[#f7fbff] p-4">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-semibold text-slate-950">Visible modules</p>
          <span className="text-sm font-semibold text-slate-500">{settings.modules.length}</span>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {settings.modules.slice(0, 9).map((module) => (
            <span key={module} className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-600 ring-1 ring-slate-200">
              {module}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function SummaryCard({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-3xl border border-blue-100 bg-white p-5 shadow-sm">
      <Icon className="text-blue-700" size={21} />
      <p className="mt-4 text-xs font-semibold uppercase tracking-widest text-slate-500">{label}</p>
      <p className="mt-2 truncate text-sm font-semibold text-slate-950">{value}</p>
    </div>
  );
}

function SettingsCard({
  title,
  description,
  icon: Icon,
  children,
}: {
  title: string;
  description: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[2rem] border border-blue-100 bg-white p-6 shadow-sm shadow-blue-100/70">
      <div className="mb-5 flex items-start gap-3">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-700 ring-1 ring-blue-100">
          <Icon size={20} />
        </span>
        <div>
          <h3 className="font-semibold text-slate-950">{title}</h3>
          <p className="mt-1 text-sm leading-6 text-slate-500">{description}</p>
        </div>
      </div>
      {children}
    </section>
  );
}

function InfoRow({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-[#f7fbff] p-4">
      <p className="text-sm font-semibold text-slate-950">{title}</p>
      <p className="mt-1 text-sm leading-6 text-slate-500">{text}</p>
    </div>
  );
}

function TextInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label>
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
      />
    </label>
  );
}

function SelectInput({
  label,
  value,
  options,
  onChange,
  helper,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
  helper?: string;
}) {
  return (
    <label>
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
      >
        {options.map((option) => (
          <option key={option}>{option}</option>
        ))}
      </select>
      {helper ? <span className="mt-2 block text-xs leading-5 text-slate-500">{helper}</span> : null}
    </label>
  );
}

function ToggleRow({
  title,
  description,
  checked,
  onClick,
}: {
  title: string;
  description: string;
  checked: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-[#f7fbff] p-4 text-left hover:bg-white"
    >
      <span>
        <span className="block text-sm font-semibold text-slate-950">{title}</span>
        <span className="mt-1 block text-sm leading-6 text-slate-500">{description}</span>
      </span>
      <span className={`flex h-7 w-12 shrink-0 items-center rounded-full p-1 transition ${checked ? "bg-blue-600" : "bg-slate-300"}`}>
        <span className={`size-5 rounded-full bg-white transition ${checked ? "translate-x-5" : ""}`} />
      </span>
    </button>
  );
}

function PreviewStat({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/8 p-3">
      <Icon className="text-cyan-200" size={17} />
      <p className="mt-3 text-xs text-blue-100/70">{label}</p>
      <p className="mt-1 truncate text-sm font-semibold">{value}</p>
    </div>
  );
}

function PreviewToggle({
  icon: Icon,
  label,
  active,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  active: boolean;
}) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-[#f7fbff] p-3">
      <span className="flex min-w-0 items-center gap-3">
        <Icon className="shrink-0 text-blue-700" size={17} />
        <span className="truncate text-sm font-semibold text-slate-700">{label}</span>
      </span>
      <span className={`size-2.5 rounded-full ${active ? "bg-blue-600" : "bg-slate-300"}`} />
    </div>
  );
}
