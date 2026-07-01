"use client";

import { FormEvent, useState } from "react";
import { CheckCircle2, Send } from "lucide-react";

type ContactRequest = {
  name: string;
  email: string;
  topic: string;
  message: string;
  createdAt: string;
};

export function ContactForm() {
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const form = event.currentTarget;
    const formData = new FormData(form);
    const request: ContactRequest = {
      name: String(formData.get("name") ?? "").trim(),
      email: String(formData.get("email") ?? "").trim(),
      topic: String(formData.get("topic") ?? "General").trim(),
      message: String(formData.get("message") ?? "").trim(),
      createdAt: new Date().toISOString(),
    };

    const saved = window.localStorage.getItem("comvexa-contact-requests");
    const requests = saved ? (JSON.parse(saved) as ContactRequest[]) : [];
    window.localStorage.setItem("comvexa-contact-requests", JSON.stringify([request, ...requests]));

    form.reset();
    setSubmitted(true);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/70"
    >
      <div>
        <p className="text-sm font-semibold uppercase tracking-widest text-emerald-700">
          Send a request
        </p>
        <h2 className="mt-2 text-2xl font-semibold tracking-normal text-slate-950">
          Tell us what you need
        </h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Requests are saved in this workspace build so they can be reviewed
          during setup. Connect a support inbox later when the business email is ready.
        </p>
      </div>

      {submitted ? (
        <div className="mt-5 flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          <CheckCircle2 className="mt-0.5 shrink-0" size={18} />
          Request saved. You can submit another message if needed.
        </div>
      ) : null}

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <label>
          <span className="text-sm font-medium text-slate-700">Name</span>
          <input
            name="name"
            required
            className="mt-2 h-11 w-full rounded-xl border border-slate-300 px-3 text-sm outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
          />
        </label>
        <label>
          <span className="text-sm font-medium text-slate-700">Email</span>
          <input
            name="email"
            type="email"
            required
            className="mt-2 h-11 w-full rounded-xl border border-slate-300 px-3 text-sm outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
          />
        </label>
        <label className="sm:col-span-2">
          <span className="text-sm font-medium text-slate-700">Topic</span>
          <select
            name="topic"
            className="mt-2 h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
          >
            <option>Support</option>
            <option>Sales</option>
            <option>Billing</option>
            <option>Privacy</option>
            <option>General</option>
          </select>
        </label>
        <label className="sm:col-span-2">
          <span className="text-sm font-medium text-slate-700">Message</span>
          <textarea
            name="message"
            required
            rows={5}
            className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
          />
        </label>
      </div>

      <button
        type="submit"
        className="mt-5 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 text-sm font-semibold text-white hover:bg-emerald-700"
      >
        <Send size={17} />
        Save request
      </button>
    </form>
  );
}
