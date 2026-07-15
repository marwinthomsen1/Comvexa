"use client";

import { FormEvent, useMemo, useState } from "react";
import { ArrowRight, Bot, BrainCircuit, ClipboardCheck, Copy, CreditCard, Lightbulb, PackageSearch, SearchCheck, Sparkles, Trash2, UsersRound, WandSparkles, X } from "lucide-react";
import { PlanGate } from "../_components/plan-gate";

type AiNote = {
  id: string;
  prompt: string;
  response: string;
  createdAt: string;
};

const storageKey = "comvexa-ultra-ai-assistant";
const quickMissions = [
  { label: "Today's priorities", prompt: "What should I prioritize across the business today?", icon: ClipboardCheck },
  { label: "Invoice risks", prompt: "Which invoice and payment issues should I handle first?", icon: CreditCard },
  { label: "Customer follow-up", prompt: "Give me a customer follow-up plan for today.", icon: UsersRound },
  { label: "Stock pressure", prompt: "What inventory and stock risks should I review?", icon: PackageSearch },
];

function createResponse(prompt: string) {
  const lower = prompt.toLowerCase();
  if (lower.includes("invoice") || lower.includes("payment")) return "Focus on unpaid invoices first. Sort by overdue date and value. Send a polite reminder, then follow up high-value balances personally. Add a payment note after every customer contact.";
  if (lower.includes("customer")) return "Check customers with recent activity, unpaid balances, and missing contact details. Prioritize customers who have bookings or invoices but no recent follow-up. Assign a clear owner to each conversation.";
  if (lower.includes("staff") || lower.includes("employee")) return "Review staff schedules, open tasks, attendance notes, and overdue work. Move blocked tasks to manager review. Give every open item a clear owner and next action.";
  if (lower.includes("inventory") || lower.includes("stock")) return "Start with low-stock items, supplier bills, and purchase orders. Mark items that affect active bookings as urgent. Confirm supplier lead times before stock reaches zero.";
  return "Start with today's dashboard. Review overdue invoices, due tasks, upcoming bookings, expiring documents, and branch performance. Pick the highest-risk item. Assign an owner and set a follow-up date.";
}

export default function AiAssistantPage() {
  const [notes, setNotes] = useState<AiNote[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const saved = window.localStorage.getItem(storageKey);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [prompt, setPrompt] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const pageCount = Math.max(1, Math.ceil(notes.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const visibleNotes = notes.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const signals = useMemo(() => getAiSignals(notes), [notes]);

  function persist(nextNotes: AiNote[]) {
    setNotes(nextNotes);
    window.localStorage.setItem(storageKey, JSON.stringify(nextNotes));
  }

  function generateAdvice(nextPrompt: string) {
    const cleanPrompt = nextPrompt.trim();
    if (!cleanPrompt) return;
    persist([{ id: crypto.randomUUID(), prompt: cleanPrompt, response: createResponse(cleanPrompt), createdAt: new Date().toISOString() }, ...notes]);
    setPrompt("");
    setPage(1);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    generateAdvice(prompt);
  }

  return (
    <PlanGate moduleName="AI Assistant">
      <main className="ai-cockpit-page mx-auto w-full max-w-[1500px] flex-1 p-4 sm:p-6">
        <section className="dashboard-custom-hero ai-cockpit-header overflow-hidden rounded-[2rem] border border-[#35305d] bg-[#17152b] p-6 text-white shadow-xl shadow-violet-950/10">
          <div className="grid gap-6 xl:grid-cols-[1fr_360px] xl:items-center">
            <div><div className="flex items-center gap-2 text-[#b7a6ff]"><BrainCircuit size={18} /><p className="text-xs font-semibold uppercase tracking-[0.2em]">Operations intelligence</p></div><h2 className="mt-3 text-3xl font-semibold tracking-tight text-white">Comvexa AI cockpit</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-[#c8c2df]">Turn an operational question into a focused decision brief with priorities, actions, and follow-up direction.</p></div>
            <div className="ai-cockpit-status rounded-3xl border border-white/10 bg-white/[0.06] p-5"><div className="flex items-center justify-between"><div><p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#b7a6ff]">Briefing memory</p><p className="mt-2 text-3xl font-semibold text-white">{notes.length}</p></div><span className="grid size-12 place-items-center rounded-2xl bg-[#8b72f6]/20 text-[#c6baff]"><WandSparkles size={22} /></span></div><p className="mt-3 text-xs leading-5 text-[#aaa3c1]">Decision brief{notes.length === 1 ? "" : "s"} saved privately in this browser workspace.</p></div>
          </div>
          <div className="mt-6 grid gap-3 sm:grid-cols-3"><CockpitMetric label="Briefs generated" value={String(notes.length)} icon={Sparkles} /><CockpitMetric label="Action steps" value={String(notes.reduce((sum, note) => sum + splitAdvice(note.response).length, 0))} icon={ClipboardCheck} /><CockpitMetric label="Signals covered" value={String(signals.filter((signal) => signal.count > 0).length)} icon={SearchCheck} /></div>
        </section>

        <section className="ai-command-console mt-5 overflow-hidden rounded-[2rem] border border-[#ddd7fa] bg-white shadow-sm">
          <div className="grid gap-5 p-5 lg:grid-cols-[240px_1fr] lg:p-6"><div><div className="flex items-center gap-3"><span className="grid size-11 place-items-center rounded-2xl bg-[#ede9ff] text-[#6048d2]"><Bot size={21} /></span><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#6048d2]">Command console</p><h3 className="mt-1 font-semibold text-slate-950">Ask Comvexa</h3></div></div><p className="mt-4 text-xs leading-5 text-slate-500">Describe the decision, risk, or workflow you need help prioritizing.</p></div><form onSubmit={handleSubmit}><div className="relative"><textarea value={prompt} onChange={(event) => setPrompt(event.target.value)} required rows={4} placeholder="What should I fix first across invoices, customers, staff, or stock?" className="w-full resize-none rounded-3xl border border-slate-300 bg-[#fbfaff] px-5 py-4 pr-16 text-sm leading-6 text-slate-800 outline-none focus:border-[#7c68dd] focus:ring-4 focus:ring-violet-100" /><button type="submit" disabled={!prompt.trim()} className="absolute bottom-3 right-3 grid size-11 place-items-center rounded-2xl bg-[#6048d2] text-white shadow-lg hover:bg-[#513cb8] disabled:opacity-40" aria-label="Generate decision brief"><ArrowRight size={18} /></button></div></form></div>
          <div className="border-t border-[#ede9ff] bg-[#faf9ff] px-5 py-4 lg:px-6"><p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">Quick missions</p><div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">{quickMissions.map(({ label, prompt: missionPrompt, icon: Icon }) => <button key={label} type="button" onClick={() => setPrompt(missionPrompt)} className="flex items-center gap-3 rounded-2xl border border-[#e5e0fa] bg-white p-3 text-left hover:border-[#bcb0ef] hover:bg-[#fdfcff]"><span className="grid size-9 shrink-0 place-items-center rounded-xl bg-[#f0edff] text-[#6048d2]"><Icon size={16} /></span><span className="text-xs font-semibold text-slate-700">{label}</span></button>)}</div></div>
        </section>

        <section className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_300px]">
          <div className="ai-briefing-stack rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-center justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#6048d2]">Decision briefs</p><h3 className="mt-1 text-lg font-semibold text-slate-950">Operational recommendations</h3></div><button type="button" onClick={() => { persist([]); setPage(1); }} disabled={!notes.length} className="inline-flex h-10 items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 text-xs font-semibold text-red-700 disabled:opacity-40"><Trash2 size={14} />Clear all</button></div>
            <div className="mt-5 space-y-4">{visibleNotes.map((note, index) => { const actions = splitAdvice(note.response); return <article key={note.id} className="ai-decision-brief overflow-hidden rounded-3xl border border-slate-200 bg-white"><header className="flex items-start justify-between gap-4 bg-[#f6f4ff] px-5 py-4"><div className="flex min-w-0 items-start gap-3"><span className="grid size-9 shrink-0 place-items-center rounded-xl bg-[#6048d2] text-xs font-bold text-white">{String((currentPage - 1) * pageSize + index + 1).padStart(2, "0")}</span><div className="min-w-0"><p className="text-[10px] font-semibold uppercase tracking-wider text-[#6048d2]">Your question</p><h4 className="mt-1 text-sm font-semibold leading-5 text-slate-900">{note.prompt}</h4></div></div><button type="button" onClick={() => persist(notes.filter((item) => item.id !== note.id))} className="grid size-9 shrink-0 place-items-center rounded-xl text-slate-300 hover:bg-red-50 hover:text-red-600" aria-label="Delete decision brief"><X size={15} /></button></header><div className="p-5"><div className="flex items-center gap-2"><Lightbulb size={16} className="text-amber-500" /><p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">Recommended sequence</p></div><div className="mt-4 grid gap-3 md:grid-cols-2">{actions.map((action, actionIndex) => <div key={`${note.id}-${actionIndex}`} className="flex gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-3"><span className="grid size-7 shrink-0 place-items-center rounded-lg bg-white text-[10px] font-bold text-[#6048d2] shadow-sm">{actionIndex + 1}</span><p className="text-xs leading-5 text-slate-600">{action}</p></div>)}</div><div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4"><p className="text-[10px] text-slate-400">Generated {formatBriefDate(note.createdAt)}</p><button type="button" onClick={() => void navigator.clipboard.writeText(note.response)} className="inline-flex h-9 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50"><Copy size={14} />Copy advice</button></div></div></article>; })}{!notes.length ? <div className="grid min-h-72 place-items-center rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center"><div><BrainCircuit size={42} className="mx-auto text-slate-300" /><p className="mt-3 font-semibold text-slate-800">No decision briefs yet</p><p className="mt-1 text-sm text-slate-500">Choose a quick mission or ask your first question above.</p></div></div> : null}</div>
            {notes.length > pageSize ? <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4 text-sm"><p className="text-slate-500">Page {currentPage} of {pageCount}</p><div className="flex gap-2"><button type="button" onClick={() => setPage((value) => Math.max(1, value - 1))} disabled={currentPage === 1} className="h-9 rounded-xl border border-slate-200 px-3 font-semibold text-slate-600 disabled:opacity-40">Previous</button><button type="button" onClick={() => setPage((value) => Math.min(pageCount, value + 1))} disabled={currentPage === pageCount} className="h-9 rounded-xl border border-slate-200 px-3 font-semibold text-slate-600 disabled:opacity-40">Next</button></div></div> : null}
          </div>

          <aside className="ai-signal-index self-start rounded-[2rem] bg-[#17152b] p-5 text-white shadow-lg xl:sticky xl:top-24"><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#b7a6ff]">Signal index</p><h3 className="mt-2 text-lg font-semibold text-white">Topics in memory</h3></div><BrainCircuit size={21} className="text-[#b7a6ff]" /></div><div className="mt-5 space-y-3">{signals.map((signal) => <div key={signal.label}><div className="flex items-center justify-between gap-3 text-xs"><span className="text-[#c8c2df]">{signal.label}</span><span className="font-semibold text-white">{signal.count}</span></div><div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-[#8b72f6]" style={{ width: `${notes.length ? Math.max(signal.count ? 8 : 0, (signal.count / notes.length) * 100) : 0}%` }} /></div></div>)}</div><div className="mt-6 rounded-2xl bg-white/5 p-4 ring-1 ring-white/10"><p className="text-xs font-semibold text-white">How to get better briefs</p><p className="mt-2 text-[11px] leading-5 text-[#aaa3c1]">Mention the module, the risk, and the desired outcome. Example: “Prioritize overdue invoices over $500 for this week.”</p></div></aside>
        </section>
      </main>
    </PlanGate>
  );
}

function CockpitMetric({ label, value, icon: Icon }: { label: string; value: string; icon: typeof Sparkles }) {
  return <div className="rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3"><div className="flex items-center justify-between gap-3"><p className="text-[10px] font-semibold uppercase tracking-wider text-[#aaa3c1]">{label}</p><Icon size={15} className="text-[#b7a6ff]" /></div><p className="mt-2 text-xl font-semibold text-white">{value}</p></div>;
}

function splitAdvice(response: string) {
  return response.split(/\.\s+/).map((sentence) => sentence.replace(/\.$/, "").trim()).filter(Boolean);
}

function getAiSignals(notes: AiNote[]) {
  const topics = [
    { label: "Invoices", terms: ["invoice", "payment"] },
    { label: "Customers", terms: ["customer", "client"] },
    { label: "Team", terms: ["staff", "employee", "team"] },
    { label: "Inventory", terms: ["inventory", "stock"] },
    { label: "General operations", terms: ["business", "dashboard", "prioritize"] },
  ];
  return topics.map((topic) => ({ ...topic, count: notes.filter((note) => topic.terms.some((term) => note.prompt.toLowerCase().includes(term))).length }));
}

function formatBriefDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "recently" : new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(date);
}
