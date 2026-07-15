"use client";

import { FormEvent, useMemo, useState } from "react";
import { Bot, LifeBuoy, Send, X } from "lucide-react";
import { supabase } from "@/src/lib/supabase/client";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

const starterMessages: ChatMessage[] = [
  {
    role: "assistant",
    content:
      "Hi, I am Comvexa AI Support. Ask me about trials, Paddle checkout, plans, modules, settings, invoices, or payments.",
  },
];

const quickPrompts = [
  "Why is my trial not starting?",
  "How do I open Paddle checkout?",
  "Which modules are in my plan?",
];

export function AiSupportChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>(starterMessages);
  const [draft, setDraft] = useState("");
  const [isSending, setIsSending] = useState(false);

  const canSend = useMemo(() => draft.trim().length > 0 && !isSending, [draft, isSending]);

  async function sendMessage(content: string) {
    const text = content.trim();

    if (!text) {
      return;
    }

    const nextMessages: ChatMessage[] = [...messages, { role: "user", content: text }];
    setMessages(nextMessages);
    setDraft("");
    setIsSending(true);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const response = await fetch("/api/support/ai", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sessionData.session?.access_token ?? ""}`,
        },
        body: JSON.stringify({ messages: nextMessages }),
      });
      const support = await response.json();

      setMessages([
        ...nextMessages,
        {
          role: "assistant",
          content: support.reply ?? "AI support could not respond right now.",
        },
      ]);
    } catch {
      setMessages([
        ...nextMessages,
        {
          role: "assistant",
          content: "AI support could not respond right now.",
        },
      ]);
    } finally {
      setIsSending(false);
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (canSend) {
      void sendMessage(draft);
    }
  }

  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="comvexa-ai-support-launcher group flex size-12 items-center justify-center rounded-2xl border border-white/15 bg-slate-950 text-white shadow-2xl shadow-slate-950/30 transition hover:-translate-y-0.5 hover:bg-slate-800"
        aria-label="AI support"
      >
        <LifeBuoy size={18} />
        <span className="pointer-events-none absolute bottom-full right-0 mb-2 hidden whitespace-nowrap rounded-lg bg-slate-950 px-3 py-2 text-xs font-semibold text-white shadow-lg group-hover:block">
          AI support
        </span>
      </button>
    );
  }

  return (
    <section className="comvexa-ai-support-panel flex h-[min(620px,calc(100vh-2.5rem))] w-[min(420px,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-950/25" role="dialog" aria-label="Comvexa AI Support">
      <header className="flex items-center justify-between gap-3 border-b border-slate-200 bg-slate-950 px-4 py-3 text-white">
        <div className="flex items-center gap-3">
          <span className="flex size-9 items-center justify-center rounded-xl bg-white/10">
            <Bot size={18} />
          </span>
          <div>
            <h2 className="text-sm font-semibold">Comvexa AI Support</h2>
            <p className="text-xs text-slate-300">Billing, trials, modules, and setup</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setIsOpen(false)}
          className="rounded-lg p-2 text-slate-300 hover:bg-white/10 hover:text-white"
          aria-label="Close AI support"
        >
          <X size={17} />
        </button>
      </header>

      <div className="flex-1 space-y-3 overflow-y-auto bg-slate-50 p-4 [scrollbar-width:thin]" role="log" aria-live="polite" aria-label="Support conversation">
        {messages.map((message, index) => (
          <div
            key={`${message.role}-${index}`}
            className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <p
              className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-6 ${
                message.role === "user"
                  ? "bg-emerald-600 text-white"
                  : "border border-slate-200 bg-white text-slate-700"
              }`}
            >
              {message.content}
            </p>
          </div>
        ))}
        {isSending ? (
          <p className="inline-flex rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500">
            Thinking...
          </p>
        ) : null}
      </div>

      <div className="border-t border-slate-200 bg-white p-3">
        <div className="mb-3 flex flex-wrap gap-2">
          {quickPrompts.map((prompt) => (
            <button
              key={prompt}
              type="button"
              onClick={() => void sendMessage(prompt)}
              disabled={isSending}
              className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-60"
            >
              {prompt}
            </button>
          ))}
        </div>
        <form onSubmit={handleSubmit} className="flex gap-2">
          <label htmlFor="comvexa-support-message" className="sr-only">Ask AI support</label>
          <input
            id="comvexa-support-message"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Ask AI support..."
            className="h-11 min-w-0 flex-1 rounded-xl border border-slate-300 px-3 text-sm outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
          />
          <button
            type="submit"
            disabled={!canSend}
            className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 disabled:bg-slate-300"
            aria-label="Send support message"
          >
            <Send size={17} />
          </button>
        </form>
      </div>
    </section>
  );
}
