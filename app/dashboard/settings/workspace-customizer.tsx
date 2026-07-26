"use client";

import { useEffect, useState } from "react";
import {
  Building2,
  Check,
  Globe2,
  LayoutDashboard,
  Palette,
  ReceiptText,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
} from "lucide-react";
import { languageOptions } from "../_components/dashboard-i18n";
import { canUseModule, defaultPlan, planModules, type PlanName } from "../_components/plan-access";
import { loadSubscriptionAccess } from "../_components/subscription-access";
import { MfaSettingsCard } from "./mfa-settings-card";

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
    modules: ["Quotes", "Invoices", "Recurring Invoices", "Payments", "Expenses", "Supplier Bills", "Purchase Orders", "Reports"],
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
      "Pro Growth",
      "Ultra Command",
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
  invoiceTemplate: string;
  invoiceTitle: string;
  invoiceAccent: string;
  invoiceSecondaryColor: string;
  invoiceBackgroundColor: string;
  invoiceLogoUrl: string;
  invoiceFont: string;
  invoicePaperSize: string;
  invoiceHeaderLayout: string;
  invoiceBorderStyle: string;
  invoiceLogoSize: string;
  invoiceBillToLabel: string;
  invoiceAmountLabel: string;
  invoiceNotesLabel: string;
  invoicePaymentInstructions: string;
  invoiceFooter: string;
  invoiceShowLogo: boolean;
  invoiceShowCompanyContact: boolean;
  invoiceShowPaymentTerms: boolean;
  invoiceShowNotes: boolean;
  invoiceShowCustomerContact: boolean;
  invoiceShowStatus: boolean;
  invoiceShowDates: boolean;
  invoiceShowInvoiceNumber: boolean;
  invoiceShowAmountBox: boolean;
  startPage: string;
  showSetup: boolean;
  showFinancePulse: boolean;
  enableEmailReminders: boolean;
  enableWhatsappTemplates: boolean;
  modules: string[];
};

type SettingsSection = "basics" | "appearance" | "finance" | "modules" | "security";

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
  invoiceTemplate: "Modern",
  invoiceTitle: "INVOICE",
  invoiceAccent: "#c7642b",
  invoiceSecondaryColor: "#17202c",
  invoiceBackgroundColor: "#ffffff",
  invoiceLogoUrl: "",
  invoiceFont: "Modern sans",
  invoicePaperSize: "A4",
  invoiceHeaderLayout: "Split",
  invoiceBorderStyle: "Soft",
  invoiceLogoSize: "Medium",
  invoiceBillToLabel: "BILL TO",
  invoiceAmountLabel: "AMOUNT DUE",
  invoiceNotesLabel: "NOTES",
  invoicePaymentInstructions: "Thank you for your business. Please include the invoice number with your payment.",
  invoiceFooter: "Generated with Comvexa",
  invoiceShowLogo: true,
  invoiceShowCompanyContact: true,
  invoiceShowPaymentTerms: true,
  invoiceShowNotes: true,
  invoiceShowCustomerContact: true,
  invoiceShowStatus: true,
  invoiceShowDates: true,
  invoiceShowInvoiceNumber: true,
  invoiceShowAmountBox: true,
  startPage: "Dashboard",
  showSetup: true,
  showFinancePulse: true,
  enableEmailReminders: true,
  enableWhatsappTemplates: false,
  modules: allModules,
};

export function WorkspaceCustomizer() {
  const [settings, setSettings] = useState<Settings>(defaultSettings);
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

      void loadSubscriptionAccess().then((access) => setCurrentPlan(access.plan));
    }, 0);

    return () => window.clearTimeout(timeout);
  }, []);

  useEffect(() => {
    async function syncPlan() {
      const access = await loadSubscriptionAccess();
      setCurrentPlan(access.plan);
    }

    window.addEventListener("storage", syncPlan);
    window.addEventListener("comvexa-plan-change", syncPlan);

    return () => {
      window.removeEventListener("storage", syncPlan);
      window.removeEventListener("comvexa-plan-change", syncPlan);
    };
  }, []);

  const enabledCount = settings.modules.length;
  function updateSettings(nextSettings: Settings) {
    setSettings(nextSettings);
    window.localStorage.setItem("comvexa-workspace-settings", JSON.stringify(nextSettings));
    window.dispatchEvent(new Event("comvexa-settings-change"));
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

  function toggleBoolean(key: keyof Pick<Settings, "showSetup" | "showFinancePulse" | "enableEmailReminders" | "enableWhatsappTemplates" | "invoiceShowLogo" | "invoiceShowCompanyContact" | "invoiceShowPaymentTerms" | "invoiceShowNotes" | "invoiceShowCustomerContact" | "invoiceShowStatus" | "invoiceShowDates" | "invoiceShowInvoiceNumber" | "invoiceShowAmountBox">) {
    updateSettings({ ...settings, [key]: !settings[key] });
  }

  const sections = [
    { id: "basics", label: "General", description: "Company and language", icon: Building2 },
    { id: "appearance", label: "Look & feel", description: "Theme and layout", icon: Palette },
    { id: "finance", label: "Billing & workflow", description: "Currency and reminders", icon: ReceiptText },
    { id: "modules", label: "Modules", description: `${enabledCount} visible`, icon: LayoutDashboard },
    { id: "security", label: "Security", description: "Two-step verification", icon: ShieldCheck },
  ] as const;

  return (
    <main className="mx-auto w-full max-w-[1250px] flex-1 p-4 sm:p-6">
      <section className="rounded-3xl border border-slate-200 bg-white px-5 py-5 shadow-sm sm:px-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm font-semibold text-blue-700">
              <Sparkles size={16} />
              Workspace settings
            </div>
            <h2 className="mt-2 text-2xl font-semibold tracking-normal text-slate-950">Settings</h2>
            <p className="mt-1 text-sm text-slate-500">Manage how your company workspace looks and works.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
            <span className="rounded-full bg-slate-100 px-3 py-2 text-slate-600">{settings.companyDisplayName}</span>
            <span className="rounded-full bg-blue-50 px-3 py-2 text-blue-700">{currentPlan} plan</span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-2 text-emerald-700">
              <Check size={14} /> Changes save automatically
            </span>
          </div>
        </div>
      </section>

      <section className="mt-4 rounded-3xl border border-slate-200 bg-white p-2 shadow-sm">
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
          {sections.map((section) => {
            const Icon = section.icon;
            const active = activeSection === section.id;

            return (
              <button
                key={section.id}
                type="button"
                onClick={() => setActiveSection(section.id)}
                className={`flex items-center gap-3 rounded-2xl px-3 py-3 text-left transition ${
                  active
                    ? "bg-slate-950 text-white shadow-sm"
                    : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                <span
                  className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${
                    active ? "bg-white/10 text-white" : "bg-slate-100 text-slate-500"
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
      <section className="mt-4 grid gap-4 lg:grid-cols-2">
        <SettingsCard title="Company details" description="The name and business type shown across Comvexa." icon={Building2}>
          <div className="grid gap-4">
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
          </div>
        </SettingsCard>
        <SettingsCard title="Workspace defaults" description="Choose what your team sees when they open Comvexa." icon={Globe2}>
          <div className="grid gap-4">
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
              helper="Updates navigation, headings, and account controls."
            />
          </div>
        </SettingsCard>
      </section>
      ) : null}

      {activeSection === "appearance" ? (
      <section className="mt-4">
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
      <section className="mt-4 grid gap-4 xl:grid-cols-[0.9fr_1fr]">
        <SettingsCard title="Billing defaults" description="Values used by invoices, reports, and payments." icon={ReceiptText}>
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

        <SettingsCard title="Dashboard & reminders" description="Choose what appears on the dashboard and how reminders behave." icon={SlidersHorizontal}>
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

        <div className="xl:col-span-2">
          <SettingsCard title="Invoice designer" description="Control how printed and PDF invoices look to customers." icon={ReceiptText}>
            <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
              <div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <SelectInput label="Template" value={settings.invoiceTemplate} options={["Modern", "Classic", "Minimal"]} onChange={(value) => updateSettings({ ...settings, invoiceTemplate: value })} />
                  <TextInput label="Document title" value={settings.invoiceTitle} onChange={(value) => updateSettings({ ...settings, invoiceTitle: value.toUpperCase() })} />
                  <ColorInput label="Brand color" value={settings.invoiceAccent} onChange={(value) => updateSettings({ ...settings, invoiceAccent: value })} />
                  <ColorInput label="Text color" value={settings.invoiceSecondaryColor} onChange={(value) => updateSettings({ ...settings, invoiceSecondaryColor: value })} />
                  <ColorInput label="Page color" value={settings.invoiceBackgroundColor} onChange={(value) => updateSettings({ ...settings, invoiceBackgroundColor: value })} />
                  <TextInput label="Logo URL" value={settings.invoiceLogoUrl} onChange={(value) => updateSettings({ ...settings, invoiceLogoUrl: value })} />
                  <SelectInput label="Typography" value={settings.invoiceFont} options={["Modern sans", "Classic serif", "Clean mono"]} onChange={(value) => updateSettings({ ...settings, invoiceFont: value })} />
                  <SelectInput label="Paper size" value={settings.invoicePaperSize} options={["A4", "US Letter"]} onChange={(value) => updateSettings({ ...settings, invoicePaperSize: value })} />
                  <SelectInput label="Header layout" value={settings.invoiceHeaderLayout} options={["Split", "Centered", "Company first"]} onChange={(value) => updateSettings({ ...settings, invoiceHeaderLayout: value })} />
                  <SelectInput label="Border style" value={settings.invoiceBorderStyle} options={["Soft", "Sharp", "Double", "None"]} onChange={(value) => updateSettings({ ...settings, invoiceBorderStyle: value })} />
                  <SelectInput label="Logo size" value={settings.invoiceLogoSize} options={["Small", "Medium", "Large"]} onChange={(value) => updateSettings({ ...settings, invoiceLogoSize: value })} />
                </div>
                <p className="mt-6 text-xs font-bold uppercase tracking-[0.16em] text-slate-400">Wording</p>
                <div className="mt-3 grid gap-4 sm:grid-cols-3">
                  <TextInput label="Customer section" value={settings.invoiceBillToLabel} onChange={(value) => updateSettings({ ...settings, invoiceBillToLabel: value })} />
                  <TextInput label="Total label" value={settings.invoiceAmountLabel} onChange={(value) => updateSettings({ ...settings, invoiceAmountLabel: value })} />
                  <TextInput label="Notes label" value={settings.invoiceNotesLabel} onChange={(value) => updateSettings({ ...settings, invoiceNotesLabel: value })} />
                </div>
                <div className="mt-4 grid gap-4">
                  <TextAreaInput label="Payment instructions" value={settings.invoicePaymentInstructions} onChange={(value) => updateSettings({ ...settings, invoicePaymentInstructions: value })} />
                  <TextInput label="Footer text" value={settings.invoiceFooter} onChange={(value) => updateSettings({ ...settings, invoiceFooter: value })} />
                </div>
                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <ToggleRow title="Show logo" description="Place your logo in the invoice header." checked={settings.invoiceShowLogo} onClick={() => toggleBoolean("invoiceShowLogo")} />
                  <ToggleRow title="Company contact details" description="Show email, phone, and address." checked={settings.invoiceShowCompanyContact} onClick={() => toggleBoolean("invoiceShowCompanyContact")} />
                  <ToggleRow title="Payment terms" description="Show your default terms and instructions." checked={settings.invoiceShowPaymentTerms} onClick={() => toggleBoolean("invoiceShowPaymentTerms")} />
                  <ToggleRow title="Invoice notes" description="Include notes added to each invoice." checked={settings.invoiceShowNotes} onClick={() => toggleBoolean("invoiceShowNotes")} />
                  <ToggleRow title="Customer contacts" description="Show customer email and phone." checked={settings.invoiceShowCustomerContact} onClick={() => toggleBoolean("invoiceShowCustomerContact")} />
                  <ToggleRow title="Invoice status" description="Show paid, pending, or unpaid." checked={settings.invoiceShowStatus} onClick={() => toggleBoolean("invoiceShowStatus")} />
                  <ToggleRow title="Issue and due dates" description="Show both invoice dates." checked={settings.invoiceShowDates} onClick={() => toggleBoolean("invoiceShowDates")} />
                  <ToggleRow title="Invoice number" description="Show the document reference." checked={settings.invoiceShowInvoiceNumber} onClick={() => toggleBoolean("invoiceShowInvoiceNumber")} />
                  <ToggleRow title="Amount box" description="Highlight the amount due." checked={settings.invoiceShowAmountBox} onClick={() => toggleBoolean("invoiceShowAmountBox")} />
                </div>
              </div>
              <InvoicePreview settings={settings} />
            </div>
          </SettingsCard>
        </div>
      </section>
      ) : null}

      {activeSection === "modules" ? (
      <section className="mt-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-widest text-blue-700">Visible modules</p>
            <h3 className="mt-2 text-xl font-semibold tracking-normal text-slate-950">Choose what appears in the menu</h3>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
              Turn modules on or off for your team. Your {currentPlan} plan includes {planModules[currentPlan].length} modules.
            </p>
          </div>
          <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700">
            <Check size={14} /> Saved automatically
          </span>
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

      {activeSection === "security" ? (
        <section className="mt-4">
          <MfaSettingsCard />
        </section>
      ) : null}
    </main>
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

function TextAreaInput({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return <label><span className="text-sm font-medium text-slate-700">{label}</span><textarea value={value} onChange={(event) => onChange(event.target.value)} rows={3} className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100" /></label>;
}

function ColorInput({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return <label><span className="text-sm font-medium text-slate-700">{label}</span><span className="mt-2 flex h-11 items-center gap-3 rounded-xl border border-slate-300 bg-white px-3"><input type="color" value={value} onChange={(event) => onChange(event.target.value)} className="size-7 cursor-pointer border-0 bg-transparent p-0" /><input value={value} onChange={(event) => /^#[0-9a-f]{0,6}$/i.test(event.target.value) && onChange(event.target.value)} className="min-w-0 flex-1 bg-transparent font-mono text-sm uppercase outline-none" /></span></label>;
}

function InvoicePreview({ settings }: { settings: Settings }) {
  const minimal = settings.invoiceTemplate === "Minimal";
  const centered = settings.invoiceHeaderLayout === "Centered";
  const companyFirst = settings.invoiceHeaderLayout === "Company first";
  const fontClass = settings.invoiceFont === "Classic serif" ? "font-serif" : settings.invoiceFont === "Clean mono" ? "font-mono" : "font-sans";
  const borderClass = settings.invoiceBorderStyle === "Double" ? "border-4 border-double" : settings.invoiceBorderStyle === "None" ? "border-transparent" : settings.invoiceBorderStyle === "Sharp" ? "border" : "rounded-2xl border";
  const logoSize = settings.invoiceLogoSize === "Large" ? "h-14 w-36" : settings.invoiceLogoSize === "Small" ? "h-6 w-20" : "h-9 w-28";
  const companyBlock = <div className={centered ? "mt-3 text-center" : "text-right"}><p className="text-sm font-bold">{settings.companyDisplayName}</p>{settings.invoiceShowCompanyContact ? <p className="mt-1 text-[10px] leading-4 opacity-60">hello@company.com<br />+1 555 0100</p> : null}</div>;
  const invoiceBlock = <div className={centered ? "text-center" : ""}>{settings.invoiceShowLogo && settings.invoiceLogoUrl ? <span aria-label="Invoice logo preview" className={`mb-3 block bg-contain bg-no-repeat ${centered ? "mx-auto bg-center" : "bg-left"} ${logoSize}`} style={{ backgroundImage: `url("${settings.invoiceLogoUrl.replaceAll('"', "%22")}")` }} /> : null}<p className="text-xl font-bold tracking-tight">{settings.invoiceTitle || "INVOICE"}</p>{settings.invoiceShowInvoiceNumber ? <p className="mt-1 text-xs opacity-50">INV-001</p> : null}</div>;
  return (
    <aside className={`self-start overflow-hidden shadow-lg ${borderClass} ${fontClass}`} style={{ backgroundColor: settings.invoiceBackgroundColor, color: settings.invoiceSecondaryColor, borderColor: settings.invoiceBorderStyle === "Double" ? settings.invoiceSecondaryColor : "#dbe2ea", aspectRatio: settings.invoicePaperSize === "US Letter" ? "8.5 / 11" : "210 / 297" }}>
      <div className="p-5" style={minimal ? undefined : { borderTop: `6px solid ${settings.invoiceAccent}` }}>
        <div className={centered ? "text-center" : "flex items-start justify-between gap-4"}>{companyFirst ? companyBlock : invoiceBlock}{companyFirst ? invoiceBlock : companyBlock}</div>
        <div className="my-5 h-px" style={{ backgroundColor: settings.invoiceAccent }} />
        <div className="grid grid-cols-2 gap-4 text-xs"><div><p className="text-[9px] font-bold uppercase opacity-50">{settings.invoiceBillToLabel}</p><p className="mt-2 font-semibold">Sample Customer</p>{settings.invoiceShowCustomerContact ? <p className="mt-1 text-[10px] opacity-60">customer@example.com<br />+1 555 0199</p> : null}</div>{settings.invoiceShowDates || settings.invoiceShowStatus ? <div className="text-right opacity-60">{settings.invoiceShowDates ? <><p>Issued: Jul 26, 2026</p><p className="mt-1">Due: Aug 9, 2026</p></> : null}{settings.invoiceShowStatus ? <p className="mt-1">Status: unpaid</p> : null}</div> : null}</div>
        {settings.invoiceShowAmountBox ? <div className={`mt-6 p-4 text-right ${minimal ? "border-y border-slate-200" : "rounded-xl"}`} style={minimal ? undefined : { backgroundColor: `${settings.invoiceAccent}12` }}><p className="text-[9px] font-bold uppercase opacity-50">{settings.invoiceAmountLabel}</p><p className="mt-1 text-xl font-bold" style={{ color: settings.invoiceAccent }}>$1,250.00</p></div> : null}
        {settings.invoiceShowPaymentTerms ? <div className="mt-5"><p className="text-[9px] font-bold uppercase opacity-50">Payment</p><p className="mt-1 text-[10px] leading-4 opacity-60">{settings.paymentTerms}. {settings.invoicePaymentInstructions}</p></div> : null}
        {settings.invoiceShowNotes ? <div className="mt-4"><p className="text-[9px] font-bold uppercase opacity-50">{settings.invoiceNotesLabel}</p><p className="mt-1 text-[10px] opacity-60">Thank you for choosing us.</p></div> : null}
        <div className="mt-6 flex items-end justify-between gap-3 border-t border-slate-200 pt-3 text-[9px] opacity-50"><span>{settings.invoiceFooter}</span><span className="shrink-0 font-semibold">Made with Comvexa.net</span></div>
      </div>
    </aside>
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
