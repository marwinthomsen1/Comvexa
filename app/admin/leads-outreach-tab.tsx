"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import {
  CalendarClock,
  Copy,
  Edit3,
  Mail,
  MessageCircle,
  Plus,
  Save,
  Search,
  Send,
  Wand2,
  Sparkles,
  Trash2,
  UserCheck,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { supabase } from "@/src/lib/supabase/client";

type Lead = {
  id: string;
  company_name: string;
  country: string | null;
  city: string | null;
  industry: string | null;
  instagram_url: string | null;
  email: string | null;
  whatsapp: string | null;
  website: string | null;
  status: LeadStatus;
  source: LeadSource;
  notes: string | null;
  last_contacted_at: string | null;
  follow_up_at: string | null;
  created_at: string;
  updated_at: string;
};

type LeadStatus =
  | "New"
  | "Contacted"
  | "Replied"
  | "Trial Started"
  | "Customer"
  | "Not Interested"
  | "Follow Up Later";

type LeadSource = "Instagram" | "Google" | "Facebook" | "Website" | "Referral" | "Manual";

type LeadForm = Omit<Lead, "id" | "created_at" | "updated_at" | "last_contacted_at">;

const statusOptions: LeadStatus[] = [
  "New",
  "Contacted",
  "Replied",
  "Trial Started",
  "Customer",
  "Not Interested",
  "Follow Up Later",
];
const sourceOptions: LeadSource[] = ["Instagram", "Google", "Facebook", "Website", "Referral", "Manual"];
const discoveryIndustryOptions = [
  "Random",
  "Salon / beauty",
  "Dental clinic / clinic",
  "Car detailing / car wash",
  "Maintenance / handyman",
  "Event planner",
  "Cleaning company",
  "Marketing agency",
];

const emptyForm: LeadForm = {
  company_name: "",
  country: "",
  city: "",
  industry: "",
  instagram_url: "",
  email: "",
  whatsapp: "",
  website: "",
  status: "New",
  source: "Manual",
  notes: "",
  follow_up_at: "",
};

const outreachTemplates = [
  ["general", "General business", "Hi {{company_name}},\n\nI wanted to introduce Comvexa, an all-in-one business management software for {{industry}} businesses in {{country}}.\n\nWith Comvexa, you can manage customers, bookings, employees, tasks, invoices, payments, documents, and reports in one place.\n\nA free trial is available with no credit card needed, and we also provide free setup help.\n\nWebsite: https://comvexa.net"],
  ["salon", "Salon / beauty", "Hi {{company_name}},\n\nComvexa is an all-in-one business management software built to help salon and beauty teams in {{country}} stay organized.\n\nYou can manage customers, bookings, employees, tasks, invoices, payments, documents, and reports from one simple system.\n\nA free trial is available with no credit card needed, and free setup help is included.\n\nWebsite: https://comvexa.net"],
  ["clinic", "Dental clinic / clinic", "Hi {{company_name}},\n\nComvexa is an all-in-one business management software that can help clinics in {{country}} organize daily operations.\n\nManage customers, bookings, employees, tasks, invoices, payments, documents, and reports from one secure workspace.\n\nA free trial is available with no credit card needed, and we can help with setup for free.\n\nWebsite: https://comvexa.net"],
  ["car", "Car detailing / car wash", "Hi {{company_name}},\n\nComvexa is an all-in-one business management software for car detailing and car wash businesses in {{country}}.\n\nIt helps manage customers, bookings, employees, tasks, invoices, payments, documents, and reports without juggling multiple tools.\n\nA free trial is available with no credit card needed, plus free setup help.\n\nWebsite: https://comvexa.net"],
  ["maintenance", "Maintenance / handyman", "Hi {{company_name}},\n\nComvexa is an all-in-one business management software for maintenance and handyman businesses in {{country}}.\n\nYou can manage customers, bookings, employees, tasks, invoices, payments, documents, and reports from one place.\n\nA free trial is available with no credit card needed, and free setup help is available.\n\nWebsite: https://comvexa.net"],
  ["events", "Event planner", "Hi {{company_name}},\n\nComvexa is an all-in-one business management software that helps event planners in {{country}} coordinate work more easily.\n\nManage customers, bookings, employees, tasks, invoices, payments, documents, and reports in one organized workspace.\n\nA free trial is available with no credit card needed, and we offer free setup help.\n\nWebsite: https://comvexa.net"],
  ["cleaning", "Cleaning company", "Hi {{company_name}},\n\nComvexa is an all-in-one business management software for cleaning companies in {{country}}.\n\nIt helps manage customers, bookings, employees, tasks, invoices, payments, documents, and reports from one clean system.\n\nA free trial is available with no credit card needed, and free setup help is available.\n\nWebsite: https://comvexa.net"],
  ["agency", "Marketing agency", "Hi {{company_name}},\n\nComvexa is an all-in-one business management software that can help marketing agencies in {{country}} manage client operations.\n\nTrack customers, bookings, employees, tasks, invoices, payments, documents, and reports from one workspace.\n\nA free trial is available with no credit card needed, and free setup help is included.\n\nWebsite: https://comvexa.net"],
] as const;

function formatDate(value?: string | null) {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(new Date(value));
}

function todayDate() {
  return new Date().toISOString().slice(0, 10);
}

function renderTemplate(template: string, lead: Pick<Lead, "company_name" | "industry" | "country">) {
  return template
    .replaceAll("{{company_name}}", lead.company_name || "there")
    .replaceAll("{{industry}}", lead.industry || "your")
    .replaceAll("{{country}}", lead.country || "your area");
}

export function LeadsOutreachTab() {
  const router = useRouter();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [form, setForm] = useState<LeadForm>(emptyForm);
  const [editingId, setEditingId] = useState("");
  const [search, setSearch] = useState("");
  const [countryFilter, setCountryFilter] = useState("all");
  const [industryFilter, setIndustryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [templateId, setTemplateId] = useState("general");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [emailPreview, setEmailPreview] = useState<{ lead: Lead; subject: string; message: string; recipient: string } | null>(
    null,
  );
  const [discoveryIndustry, setDiscoveryIndustry] = useState("Random");
  const [discoveryLimit, setDiscoveryLimit] = useState("10");
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [findingEmailLeadId, setFindingEmailLeadId] = useState("");

  const selectedTemplate = outreachTemplates.find(([id]) => id === templateId) ?? outreachTemplates[0];

  const authHeaders = useCallback(async () => {
    const { data } = await supabase.auth.getSession();

    if (!data.session) {
      router.replace("/login");
      return null;
    }

    return {
      Authorization: `Bearer ${data.session.access_token}`,
      "Content-Type": "application/json",
    };
  }, [router]);

  const loadLeads = useCallback(async () => {
    setError("");
    setIsLoading(true);
    const headers = await authHeaders();

    if (!headers) {
      setIsLoading(false);
      return;
    }

    const response = await fetch("/api/admin/leads", { headers });
    const data = await response.json();
    setIsLoading(false);

    if (!response.ok) {
      setError(data.error ?? "Could not load leads.");
      return;
    }

    setLeads(data.leads ?? []);
  }, [authHeaders]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void loadLeads();
    }, 0);

    return () => window.clearTimeout(timeout);
  }, [loadLeads]);

  const filteredLeads = useMemo(() => {
    const normalized = search.trim().toLowerCase();

    return leads.filter((lead) => {
      const text = `${lead.company_name} ${lead.email ?? ""} ${lead.whatsapp ?? ""}`.toLowerCase();
      return (
        (!normalized || text.includes(normalized)) &&
        (countryFilter === "all" || lead.country === countryFilter) &&
        (industryFilter === "all" || lead.industry === industryFilter) &&
        (statusFilter === "all" || lead.status === statusFilter) &&
        (sourceFilter === "all" || lead.source === sourceFilter)
      );
    });
  }, [countryFilter, industryFilter, leads, search, sourceFilter, statusFilter]);

  const countries = Array.from(new Set(leads.map((lead) => lead.country).filter(Boolean))) as string[];
  const industries = Array.from(new Set(leads.map((lead) => lead.industry).filter(Boolean))) as string[];
  const followUpsDue = leads.filter((lead) => lead.follow_up_at && lead.follow_up_at <= todayDate());

  const stats = [
    ["Total leads", leads.length],
    ["New leads", leads.filter((lead) => lead.status === "New").length],
    ["Contacted leads", leads.filter((lead) => lead.status === "Contacted").length],
    ["Replied leads", leads.filter((lead) => lead.status === "Replied").length],
    ["Trial started", leads.filter((lead) => lead.status === "Trial Started").length],
    ["Customers", leads.filter((lead) => lead.status === "Customer").length],
  ];

  function setField<Key extends keyof LeadForm>(key: Key, value: LeadForm[Key]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function editLead(lead: Lead) {
    setEditingId(lead.id);
    setForm({
      company_name: lead.company_name ?? "",
      country: lead.country ?? "",
      city: lead.city ?? "",
      industry: lead.industry ?? "",
      instagram_url: lead.instagram_url ?? "",
      email: lead.email ?? "",
      whatsapp: lead.whatsapp ?? "",
      website: lead.website ?? "",
      status: lead.status,
      source: lead.source,
      notes: lead.notes ?? "",
      follow_up_at: lead.follow_up_at ?? "",
    });
  }

  async function saveLead(event: FormEvent) {
    event.preventDefault();
    setError("");
    setNotice("");
    setIsSaving(true);
    const headers = await authHeaders();

    if (!headers) {
      return;
    }

    const response = await fetch("/api/admin/leads", {
      method: editingId ? "PATCH" : "POST",
      headers,
      body: JSON.stringify(editingId ? { id: editingId, ...form } : form),
    });
    const data = await response.json();
    setIsSaving(false);

    if (!response.ok) {
      setError(data.error ?? "Could not save lead.");
      return;
    }

    setNotice(editingId ? "Lead updated." : "Lead added.");
    setEditingId("");
    setForm(emptyForm);
    await loadLeads();
  }

  async function updateLead(id: string, updates: Record<string, unknown>, message: string) {
    const headers = await authHeaders();

    if (!headers) {
      return;
    }

    const response = await fetch("/api/admin/leads", {
      method: "PATCH",
      headers,
      body: JSON.stringify({ id, ...updates }),
    });
    const data = await response.json();

    if (!response.ok) {
      setError(data.error ?? "Could not update lead.");
      return;
    }

    setNotice(message);
    await loadLeads();
  }

  async function deleteLead(id: string) {
    if (!window.confirm("Delete this lead?")) {
      return;
    }

    const headers = await authHeaders();

    if (!headers) {
      return;
    }

    const response = await fetch("/api/admin/leads", {
      method: "DELETE",
      headers,
      body: JSON.stringify({ id }),
    });
    const data = await response.json();

    if (!response.ok) {
      setError(data.error ?? "Could not delete lead.");
      return;
    }

    setNotice("Lead deleted.");
    await loadLeads();
  }

  async function copyMessage(lead: Lead, label: string, followUp = false) {
    const base = followUp
      ? `Hi ${lead.company_name},\n\nJust following up on my previous message about Comvexa.\n\nComvexa is an all-in-one business management software to manage customers, bookings, employees, tasks, invoices, payments, documents, and reports.\n\nA free trial is available with no credit card needed, and free setup help is available.\n\nWebsite: https://comvexa.net`
      : renderTemplate(selectedTemplate[2], lead);

    await navigator.clipboard.writeText(base);
    await updateLead(lead.id, { action: "mark_contacted" }, `${label} copied. Lead marked Contacted.`);
  }

  async function sendEmail() {
    if (!emailPreview) {
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailPreview.recipient.trim())) {
      setError("Enter a valid email address before sending.");
      return;
    }

    const headers = await authHeaders();

    if (!headers) {
      return;
    }

    const response = await fetch("/api/admin/leads/send-email", {
      method: "POST",
      headers,
      body: JSON.stringify({
        leadId: emailPreview.lead.id,
        subject: emailPreview.subject,
        message: emailPreview.message,
        to: emailPreview.recipient,
        template: templateId,
      }),
    });
    const data = await response.json();

    if (!response.ok) {
      setError(data.error ?? "Could not send email.");
      return;
    }

    setNotice("Outreach email sent. Lead marked Contacted.");
    setEmailPreview(null);
    await loadLeads();
  }

  async function findEmail(lead: Lead) {
    setError("");
    setNotice("");
    setFindingEmailLeadId(lead.id);
    const headers = await authHeaders();

    if (!headers) {
      setFindingEmailLeadId("");
      return;
    }

    const response = await fetch("/api/admin/leads/find-email", {
      method: "POST",
      headers,
      body: JSON.stringify({ leadId: lead.id }),
    });
    const data = await response.json();
    setFindingEmailLeadId("");

    if (!response.ok) {
      setError(data.error ?? "Could not find an email for this lead.");
      return;
    }

    setNotice(`Found and saved ${data.email}.`);
    setEmailPreview((current) =>
      current?.lead.id === lead.id ? { ...current, recipient: data.email, lead: data.lead ?? current.lead } : current,
    );
    await loadLeads();
  }

  async function discoverLeads() {
    setError("");
    setNotice("");
    setIsDiscovering(true);
    const headers = await authHeaders();

    if (!headers) {
      setIsDiscovering(false);
      return;
    }

    const response = await fetch("/api/admin/leads/discover", {
      method: "POST",
      headers,
      body: JSON.stringify({ industry: discoveryIndustry, limit: Number(discoveryLimit) }),
    });
    const data = await response.json();
    setIsDiscovering(false);

    if (!response.ok) {
      setError(data.error ?? "Could not find leads.");
      return;
    }

    setNotice(
      data.imported
        ? `Imported ${data.imported} ${data.industry} lead${data.imported === 1 ? "" : "s"} from ${data.city?.city ?? "a random city"}.`
        : data.message ?? `No new leads imported. ${data.skipped ?? 0} duplicate leads skipped.`,
    );
    await loadLeads();
  }

  return (
    <div className="space-y-5">
      {error ? <Notice tone="red" text={error} /> : null}
      {error ? <SetupHint error={error} /> : null}
      {notice ? <Notice tone="emerald" text={notice} /> : null}

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase text-blue-700">Manual outreach only</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-normal">Leads / Outreach</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
              Collect potential company leads, copy compliant messages, and send confirmed emails. Instagram DMs are
              never automated here.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setEditingId("");
              setForm(emptyForm);
            }}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700"
          >
            <Plus size={17} />
            Add Lead
          </button>
        </div>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
          {stats.map(([label, value]) => (
            <div key={label} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase text-slate-500">{label}</p>
              <p className="mt-2 text-3xl font-semibold">{value}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[1fr_390px]">
        <div className="min-w-0 space-y-5">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="grid gap-3 md:grid-cols-5">
              <label className="relative md:col-span-2">
                <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search by company name"
                  className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm font-semibold outline-none focus:border-emerald-300"
                />
              </label>
              <FilterSelect label="Country" value={countryFilter} options={countries} onChange={setCountryFilter} />
              <FilterSelect label="Industry" value={industryFilter} options={industries} onChange={setIndustryFilter} />
              <FilterSelect label="Status" value={statusFilter} options={statusOptions} onChange={setStatusFilter} />
              <FilterSelect label="Source" value={sourceFilter} options={sourceOptions} onChange={setSourceFilter} />
            </div>
          </div>

          <LeadsTable
            leads={filteredLeads}
            isLoading={isLoading}
            selectedTemplateLabel={selectedTemplate[1]}
            onEdit={editLead}
            onDelete={deleteLead}
            onCopy={copyMessage}
            onMarkContacted={(lead) => updateLead(lead.id, { action: "mark_contacted" }, "Lead marked Contacted.")}
            findingEmailLeadId={findingEmailLeadId}
            onFindEmail={findEmail}
            onEmail={(lead) =>
              setEmailPreview({
                lead,
                subject: `A quick idea for ${lead.company_name}`,
                message: renderTemplate(selectedTemplate[2], lead),
                recipient: lead.email ?? "",
              })
            }
          />
        </div>

        <aside className="space-y-5">
          <Panel title="Automatic lead finder" icon={<Sparkles size={18} />}>
            <div className="grid gap-3">
              <SelectField
                label="Service type"
                value={discoveryIndustry}
                options={discoveryIndustryOptions}
                onChange={setDiscoveryIndustry}
              />
              <SelectField
                label="How many"
                value={discoveryLimit}
                options={["5", "10", "15", "20", "25"]}
                onChange={setDiscoveryLimit}
              />
              <button
                type="button"
                disabled={isDiscovering}
                onClick={discoverLeads}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 text-sm font-semibold text-white disabled:opacity-60"
              >
                <Sparkles size={17} />
                {isDiscovering ? "Finding leads..." : "Find random leads"}
              </button>
              <p className="text-xs leading-5 text-slate-500">
                Finds service companies from random world cities using public business map data. Email sending still
                requires the Send Email button.
              </p>
            </div>
          </Panel>

          <LeadFormPanel form={form} editingId={editingId} isSaving={isSaving} onSubmit={saveLead} onField={setField} />

          <Panel title="Message templates" icon={<MessageCircle size={18} />}>
            <select
              value={templateId}
              onChange={(event) => setTemplateId(event.target.value)}
              className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-3 text-sm font-semibold"
            >
              {outreachTemplates.map(([id, label]) => (
                <option key={id} value={id}>
                  {label}
                </option>
              ))}
            </select>
            <p className="mt-3 whitespace-pre-wrap rounded-2xl bg-slate-50 p-4 text-sm leading-6 text-slate-600">
              {selectedTemplate[2]}
            </p>
          </Panel>
        </aside>
      </section>

      <Panel title="Follow-ups Due" icon={<CalendarClock size={18} />}>
        <div className="grid gap-3 lg:grid-cols-2">
          {followUpsDue.length ? (
            followUpsDue.map((lead) => (
              <div key={lead.id} className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-semibold">{lead.company_name}</p>
                  <p className="text-sm text-slate-500">Due {formatDate(lead.follow_up_at)} - {lead.status}</p>
                </div>
                <button
                  type="button"
                  onClick={() => copyMessage(lead, "Follow-up message", true)}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white"
                >
                  <Copy size={16} />
                  Copy follow-up
                </button>
              </div>
            ))
          ) : (
            <p className="text-sm text-slate-500">No follow-ups are due today.</p>
          )}
        </div>
      </Panel>

      {emailPreview ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/50 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white p-6 shadow-xl">
            <p className="text-sm font-semibold uppercase text-blue-700">Confirm outreach email</p>
            <h3 className="mt-2 text-2xl font-semibold">{emailPreview.subject}</h3>
            <label className="mt-4 grid gap-2 text-sm font-semibold text-slate-700">
              Send to
              <input
                value={emailPreview.recipient}
                onChange={(event) =>
                  setEmailPreview((current) =>
                    current ? { ...current, recipient: event.target.value } : current,
                  )
                }
                type="email"
                placeholder="company@example.com"
                className="h-12 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-950 outline-none focus:border-emerald-300"
              />
            </label>
            {!emailPreview.lead.email ? (
              <div className="mt-2 rounded-2xl bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
                <p>This lead did not include an email from public data. Enter one here and it will be saved when you send.</p>
                {emailPreview.lead.website ? (
                  <button
                    type="button"
                    disabled={findingEmailLeadId === emailPreview.lead.id}
                    onClick={() => findEmail(emailPreview.lead)}
                    className="mt-3 inline-flex items-center gap-2 rounded-xl bg-amber-100 px-3 py-2 text-xs font-semibold text-amber-900 disabled:opacity-60"
                  >
                    <Wand2 size={14} />
                    {findingEmailLeadId === emailPreview.lead.id ? "Searching website..." : "Find email from website"}
                  </button>
                ) : null}
              </div>
            ) : null}
            <p className="mt-4 whitespace-pre-wrap rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-700">
              {emailPreview.message}
              {"\n\n"}If you do not want to receive messages from us, reply with &apos;unsubscribe&apos; and we will not contact you again.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={sendEmail}
                className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white"
              >
                <Send size={17} />
                Confirm and send
              </button>
              <button
                type="button"
                onClick={() => setEmailPreview(null)}
                className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function LeadsTable({
  leads,
  isLoading,
  selectedTemplateLabel,
  onEdit,
  onDelete,
  onCopy,
  onMarkContacted,
  onFindEmail,
  onEmail,
  findingEmailLeadId,
}: {
  leads: Lead[];
  isLoading: boolean;
  selectedTemplateLabel: string;
  onEdit: (lead: Lead) => void;
  onDelete: (id: string) => void;
  onCopy: (lead: Lead, label: string) => void;
  onMarkContacted: (lead: Lead) => void;
  onFindEmail: (lead: Lead) => void;
  onEmail: (lead: Lead) => void;
  findingEmailLeadId: string;
}) {
  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 px-5 py-4">
        <h3 className="font-semibold">Leads table</h3>
        <p className="mt-1 text-sm text-slate-500">Using template: {selectedTemplateLabel}</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[980px] text-left text-sm">
          <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-500">
            <tr>
              <th className="px-5 py-3">Company</th>
              <th className="px-5 py-3">Send</th>
              <th className="px-5 py-3">Location</th>
              <th className="px-5 py-3">Industry</th>
              <th className="px-5 py-3">Contact</th>
              <th className="px-5 py-3">Status</th>
              <th className="px-5 py-3">Follow-up</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {leads.length ? (
              leads.map((lead) => {
                const blockedEmail =
                  lead.status === "Not Interested" || String(lead.notes ?? "").toLowerCase().includes("unsubscribe");

                return (
                  <tr key={lead.id} className="align-top text-slate-700">
                    <td className="px-5 py-4">
                      <p className="font-semibold text-slate-950">{lead.company_name}</p>
                      <p className="text-xs text-slate-500">{lead.source}</p>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex max-w-[260px] flex-wrap gap-2">
                        <ActionButton
                          label={lead.email ? "Send Email" : "Send Email"}
                          icon={<Send size={15} />}
                          disabled={blockedEmail}
                          onClick={() => onEmail(lead)}
                        />
                        {!lead.email && lead.website ? (
                          <ActionButton
                            label={findingEmailLeadId === lead.id ? "Finding Email..." : "Find Email"}
                            icon={<Wand2 size={15} />}
                            disabled={findingEmailLeadId === lead.id}
                            onClick={() => onFindEmail(lead)}
                          />
                        ) : null}
                        <ActionButton label="Copy Email Text" icon={<Mail size={15} />} onClick={() => onCopy(lead, "Email text")} />
                        <ActionButton label="Copy WhatsApp Message" icon={<MessageCircle size={15} />} onClick={() => onCopy(lead, "WhatsApp message")} />
                        <ActionButton label="Copy Instagram DM" icon={<Copy size={15} />} onClick={() => onCopy(lead, "Instagram DM")} />
                        <ActionButton label="Mark as Contacted" icon={<UserCheck size={15} />} onClick={() => onMarkContacted(lead)} />
                        <ActionButton label="Edit Lead" icon={<Edit3 size={15} />} onClick={() => onEdit(lead)} />
                        <ActionButton label="Delete Lead" icon={<Trash2 size={15} />} danger onClick={() => onDelete(lead.id)} />
                      </div>
                    </td>
                    <td className="px-5 py-4">{[lead.city, lead.country].filter(Boolean).join(", ") || "-"}</td>
                    <td className="px-5 py-4">{lead.industry || "-"}</td>
                    <td className="px-5 py-4">
                      <p>{lead.email || "-"}</p>
                      <p className="text-xs text-slate-500">{lead.whatsapp || lead.instagram_url || "-"}</p>
                    </td>
                    <td className="px-5 py-4">
                      <span className="inline-flex rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-100">
                        {lead.status}
                      </span>
                      <p className="mt-2 text-xs text-slate-500">Last: {formatDate(lead.last_contacted_at)}</p>
                    </td>
                    <td className="px-5 py-4">{formatDate(lead.follow_up_at)}</td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td className="px-5 py-8 text-slate-500" colSpan={7}>
                  {isLoading ? "Loading leads..." : "No leads match your filters."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function LeadFormPanel({
  form,
  editingId,
  isSaving,
  onSubmit,
  onField,
}: {
  form: LeadForm;
  editingId: string;
  isSaving: boolean;
  onSubmit: (event: FormEvent) => void;
  onField: <Key extends keyof LeadForm>(key: Key, value: LeadForm[Key]) => void;
}) {
  return (
    <Panel title={editingId ? "Edit Lead" : "Add Lead"} icon={<Plus size={18} />}>
      <form onSubmit={onSubmit} className="grid gap-3">
        <TextField label="Company name" value={form.company_name ?? ""} required onChange={(value) => onField("company_name", value)} />
        <div className="grid gap-3 sm:grid-cols-2">
          <TextField label="Country" value={form.country ?? ""} onChange={(value) => onField("country", value)} />
          <TextField label="City" value={form.city ?? ""} onChange={(value) => onField("city", value)} />
        </div>
        <TextField label="Industry" value={form.industry ?? ""} onChange={(value) => onField("industry", value)} />
        <TextField label="Instagram URL" value={form.instagram_url ?? ""} type="url" onChange={(value) => onField("instagram_url", value)} />
        <div className="grid gap-3 sm:grid-cols-2">
          <TextField label="Email" value={form.email ?? ""} type="email" onChange={(value) => onField("email", value)} />
          <TextField label="WhatsApp" value={form.whatsapp ?? ""} onChange={(value) => onField("whatsapp", value)} />
        </div>
        <TextField label="Website" value={form.website ?? ""} type="url" onChange={(value) => onField("website", value)} />
        <div className="grid gap-3 sm:grid-cols-2">
          <SelectField label="Status" value={form.status} options={statusOptions} onChange={(value) => onField("status", value as LeadStatus)} />
          <SelectField label="Source" value={form.source} options={sourceOptions} onChange={(value) => onField("source", value as LeadSource)} />
        </div>
        <TextField label="Follow-up date" value={form.follow_up_at ?? ""} type="date" onChange={(value) => onField("follow_up_at", value)} />
        <label className="grid gap-2 text-sm font-semibold text-slate-700">
          Notes
          <textarea
            value={form.notes ?? ""}
            onChange={(event) => onField("notes", event.target.value)}
            rows={5}
            className="resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-950 outline-none focus:border-emerald-300"
          />
        </label>
        <button
          type="submit"
          disabled={isSaving}
          className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 text-sm font-semibold text-white disabled:opacity-60"
        >
          <Save size={17} />
          {isSaving ? "Saving..." : editingId ? "Save Notes / Lead" : "Add Lead"}
        </button>
      </form>
    </Panel>
  );
}

function Panel({ title, icon, children }: { title: string; icon: ReactNode; children: ReactNode }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-5 flex items-center gap-2">
        <span className="text-emerald-700">{icon}</span>
        <h3 className="font-semibold">{title}</h3>
      </div>
      {children}
    </div>
  );
}

function FilterSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: readonly string[];
  onChange: (value: string) => void;
}) {
  return (
    <select
      aria-label={label}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="h-12 rounded-2xl border border-slate-200 bg-white px-3 text-sm font-semibold"
    >
      <option value="all">All {label.toLowerCase()}</option>
      {options.map((option) => (
        <option key={option} value={option}>
          {option}
        </option>
      ))}
    </select>
  );
}

function TextField({
  label,
  value,
  onChange,
  type = "text",
  required,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
}) {
  return (
    <label className="grid gap-2 text-sm font-semibold text-slate-700">
      {label}
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        type={type}
        required={required}
        className="h-12 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-950 outline-none focus:border-emerald-300"
      />
    </label>
  );
}

function SelectField({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: readonly string[];
  onChange: (value: string) => void;
}) {
  return (
    <label className="grid gap-2 text-sm font-semibold text-slate-700">
      {label}
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-12 rounded-2xl border border-slate-200 bg-white px-3 text-sm font-semibold"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

function ActionButton({
  label,
  icon,
  danger,
  disabled,
  onClick,
}: {
  label: string;
  icon: ReactNode;
  danger?: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      title={label}
      disabled={disabled}
      onClick={onClick}
      className={`inline-flex h-9 items-center justify-center gap-2 rounded-xl px-3 text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-50 ${
        danger ? "bg-red-50 text-red-700 hover:bg-red-100" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

function Notice({ tone, text }: { tone: "red" | "emerald"; text: string }) {
  const classes =
    tone === "red"
      ? "border-red-200 bg-red-50 text-red-700"
      : "border-emerald-200 bg-emerald-50 text-emerald-700";

  return <div className={`rounded-2xl border px-5 py-4 text-sm font-semibold ${classes}`}>{text}</div>;
}

function SetupHint({ error }: { error: string }) {
  const normalized = error.toLowerCase();
  const needsServiceKey = normalized.includes("supabase_service_role_key");
  const needsTable =
    normalized.includes("leads") &&
    (normalized.includes("does not exist") || normalized.includes("schema cache") || normalized.includes("relation"));

  if (!needsServiceKey && !needsTable) {
    return null;
  }

  return (
    <div className="rounded-3xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">
      <p className="font-semibold">Automatic outreach setup is waiting on Supabase.</p>
      <p className="mt-2 leading-6">
        Add `SUPABASE_SERVICE_ROLE_KEY` to `.env.local`, restart localhost, then run `supabase/admin-leads.sql` once in
        Supabase. After that, adding leads, filtering, copying messages, status updates, follow-up dates, and confirmed
        outreach emails work from this page.
      </p>
    </div>
  );
}
