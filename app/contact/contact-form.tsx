"use client";

import { FormEvent, useState } from "react";
import { CheckCircle2, Send } from "lucide-react";

type ContactRequest = {
  name: string;
  email: string;
  topic: string;
  message: string;
};

const contactEmail = "comvexa1@gmail.com";

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
    };

    const subject = encodeURIComponent(`[${request.topic}] Comvexa contact request from ${request.name}`);
    const body = encodeURIComponent(
      `Name: ${request.name}\nEmail: ${request.email}\nTopic: ${request.topic}\n\n${request.message}`,
    );

    setSubmitted(true);
    window.location.href = `mailto:${contactEmail}?subject=${subject}&body=${body}`;
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-[2.25rem] border border-[#073d47]/10 bg-[#fffdf8] p-5 shadow-[0_30px_80px_rgba(7,61,71,0.16)] sm:p-8"
    >
      <div>
        <p className="text-xs font-black uppercase tracking-[0.2em] text-[#0c8b84]">
          Send a request
        </p>
        <h2 className="mt-3 text-3xl font-black tracking-[-0.045em] text-[#073d47]">
          Tell us what you need
        </h2>
        <p className="mt-3 text-sm leading-6 text-[#617a7f]">
          Complete the form and we&apos;ll prepare an email to {contactEmail} in
          your email app.
        </p>
      </div>

      {submitted ? (
        <div className="mt-5 flex items-start gap-3 rounded-2xl border border-[#0c8b84]/20 bg-[#e2f8f2] px-4 py-3 text-sm font-bold text-[#08756f]">
          <CheckCircle2 className="mt-0.5 shrink-0" size={18} />
          Your email app was opened with the request ready to send.
        </div>
      ) : null}

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <label>
          <span className="text-sm font-black text-[#284f56]">Name</span>
          <input
            name="name"
            required
            className="mt-2 h-12 w-full rounded-2xl border border-[#073d47]/15 bg-white px-4 text-sm text-[#073d47] outline-none transition focus:border-[#0c8b84] focus:ring-4 focus:ring-[#0c8b84]/10"
          />
        </label>
        <label>
          <span className="text-sm font-black text-[#284f56]">Email</span>
          <input
            name="email"
            type="email"
            required
            className="mt-2 h-12 w-full rounded-2xl border border-[#073d47]/15 bg-white px-4 text-sm text-[#073d47] outline-none transition focus:border-[#0c8b84] focus:ring-4 focus:ring-[#0c8b84]/10"
          />
        </label>
        <label className="sm:col-span-2">
          <span className="text-sm font-black text-[#284f56]">Topic</span>
          <select
            name="topic"
            className="mt-2 h-12 w-full rounded-2xl border border-[#073d47]/15 bg-white px-4 text-sm text-[#073d47] outline-none transition focus:border-[#0c8b84] focus:ring-4 focus:ring-[#0c8b84]/10"
          >
            <option>Support</option>
            <option>Sales</option>
            <option>Billing</option>
            <option>Privacy</option>
            <option>General</option>
          </select>
        </label>
        <label className="sm:col-span-2">
          <span className="text-sm font-black text-[#284f56]">Message</span>
          <textarea
            name="message"
            required
            rows={5}
            className="mt-2 w-full resize-none rounded-2xl border border-[#073d47]/15 bg-white px-4 py-3 text-sm text-[#073d47] outline-none transition focus:border-[#0c8b84] focus:ring-4 focus:ring-[#0c8b84]/10"
          />
        </label>
      </div>

      <button
        type="submit"
        className="group mt-5 inline-flex h-14 w-full items-center justify-center gap-3 rounded-full bg-[#073d47] px-5 text-sm font-black text-white shadow-[0_15px_30px_rgba(7,61,71,0.2)] transition hover:-translate-y-0.5 hover:bg-[#0a505c]"
      >
        Email Comvexa
        <span className="grid size-8 place-items-center rounded-full bg-[#ffc857] text-[#073d47] transition group-hover:translate-x-1"><Send size={16} /></span>
      </button>
    </form>
  );
}
