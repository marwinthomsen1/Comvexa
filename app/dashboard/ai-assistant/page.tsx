"use client";

import { FormEvent, useState } from "react";
import { Bot, Copy, Sparkles, Trash2 } from "lucide-react";
import { PlanGate } from "../_components/plan-gate";

type AiNote = {
  id: string;
  prompt: string;
  response: string;
  createdAt: string;
};

const storageKey = "comvexa-ultra-ai-assistant";

function createResponse(prompt: string) {
  const lower = prompt.toLowerCase();

  if (lower.includes("invoice") || lower.includes("payment")) {
    return "Focus on unpaid invoices first: sort by overdue date, send a polite reminder, then follow up high-value balances personally. Add a payment note after every customer contact.";
  }

  if (lower.includes("customer")) {
    return "Check customers with recent activity, unpaid balances, and missing contact details. Prioritize customers who have bookings or invoices but no recent follow-up.";
  }

  if (lower.includes("staff") || lower.includes("employee")) {
    return "Review staff schedules, open tasks, attendance notes, and overdue work. Move blocked tasks to a manager review list and assign clear next actions.";
  }

  if (lower.includes("inventory") || lower.includes("stock")) {
    return "Start with low-stock items, supplier bills, and purchase orders. Mark items that affect active bookings as urgent so operations do not get delayed.";
  }

  return "Start with today's dashboard: overdue invoices, due tasks, upcoming bookings, expiring documents, and branch performance. Pick the highest-risk item, assign an owner, and set a follow-up date.";
}

export default function AiAssistantPage() {
  const [notes, setNotes] = useState<AiNote[]>(() => {
    if (typeof window === "undefined") {
      return [];
    }

    const saved = window.localStorage.getItem(storageKey);
    return saved ? JSON.parse(saved) : [];
  });

  function persist(nextNotes: AiNote[]) {
    setNotes(nextNotes);
    window.localStorage.setItem(storageKey, JSON.stringify(nextNotes));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const prompt = String(formData.get("prompt") ?? "").trim();

    if (!prompt) {
      return;
    }

    persist([
      {
        id: crypto.randomUUID(),
        prompt,
        response: createResponse(prompt),
        createdAt: new Date().toISOString(),
      },
      ...notes,
    ]);
    event.currentTarget.reset();
  }

  return (
    <PlanGate moduleName="AI Assistant">
      <main className="mx-auto w-full max-w-[1300px] flex-1 p-4 sm:p-6">
        <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/70">
          <p className="text-xs font-semibold uppercase tracking-widest text-blue-700">Ultra AI workspace</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-normal text-slate-950">AI Assistant</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
            Ask for operational next steps, invoice follow-up ideas, customer risk checks, staff summaries, and inventory priorities.
          </p>
        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-[390px_1fr]">
          <form onSubmit={handleSubmit} className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/70">
            <span className="flex size-12 items-center justify-center rounded-2xl bg-blue-600 text-white">
              <Bot size={24} />
            </span>
            <h3 className="mt-4 font-semibold text-slate-950">Ask Comvexa AI</h3>
            <textarea
              name="prompt"
              required
              rows={7}
              placeholder="Example: What should I fix today with invoices and customers?"
              className="mt-4 w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
            />
            <button type="submit" className="mt-4 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-700">
              <Sparkles size={17} />
              Generate advice
            </button>
          </form>

          <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/70">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="font-semibold text-slate-950">Saved AI notes</h3>
                <p className="mt-1 text-sm text-slate-500">{notes.length} generated</p>
              </div>
              <button type="button" onClick={() => persist([])} disabled={!notes.length} className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 disabled:opacity-50">
                Clear
              </button>
            </div>
            <div className="mt-5 grid gap-3">
              {notes.map((note) => (
                <article key={note.id} className="rounded-2xl border border-slate-200 bg-[#f7fbff] p-4">
                  <p className="text-sm font-semibold text-slate-950">{note.prompt}</p>
                  <p className="mt-3 text-sm leading-6 text-slate-600">{note.response}</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <button type="button" onClick={() => navigator.clipboard.writeText(note.response)} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700">
                      <Copy size={14} />
                      Copy
                    </button>
                    <button type="button" onClick={() => persist(notes.filter((item) => item.id !== note.id))} className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">
                      <Trash2 size={14} />
                      Delete
                    </button>
                  </div>
                </article>
              ))}
              {!notes.length ? (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-500">
                  No AI notes yet.
                </div>
              ) : null}
            </div>
          </section>
        </section>
      </main>
    </PlanGate>
  );
}
