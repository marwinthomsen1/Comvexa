import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Clock, CreditCard, Mail, MessageSquare, ShieldCheck, Sparkles } from "lucide-react";
import { ContactForm } from "./contact-form";

export const metadata: Metadata = {
  title: "Contact Us | Comvexa",
  description: "Contact Comvexa for support, sales, billing, privacy, or platform questions.",
};

const contactOptions = [
  {
    title: "Support",
    text: "Get help with your account, workspace, dashboard modules, documents, or team access.",
    value: "Account and workspace help",
    icon: MessageSquare,
  },
  {
    title: "Billing",
    text: "Ask about subscriptions, plan changes, payments, invoices, trial status, or refunds.",
    value: "Plan and invoice questions",
    icon: CreditCard,
  },
  {
    title: "Privacy",
    text: "Send privacy, data access, correction, export, or deletion requests.",
    value: "Data request handling",
    icon: ShieldCheck,
  },
];

export default function ContactPage() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#fffaf0] text-[#073d47]">
      <header className="sticky top-0 z-50 border-b border-[#073d47]/10 bg-[#fffaf0]/88 backdrop-blur-xl">
        <nav className="mx-auto flex h-[4.6rem] max-w-7xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8" aria-label="Contact navigation">
          <Link href="/" className="flex min-w-0 items-center gap-2.5" aria-label="Comvexa home">
            <span className="relative grid size-10 shrink-0 place-items-center overflow-hidden rounded-[0.9rem] bg-white shadow-sm ring-1 ring-[#073d47]/10">
              <Image src="/logo.png" alt="" width={40} height={40} className="size-full object-contain p-1" priority />
            </span>
            <span className="text-lg font-black tracking-[-0.04em] sm:text-xl">Comvexa</span>
          </Link>
          <div className="flex items-center gap-2 sm:gap-3">
            <Link href="/login" className="inline-flex items-center justify-center rounded-full border border-[#073d47]/20 bg-white/70 px-3 py-2.5 text-xs font-black shadow-sm transition hover:-translate-y-0.5 hover:bg-white sm:px-4 sm:text-sm">Login</Link>
            <Link href="/register" className="inline-flex items-center justify-center gap-2 rounded-full bg-[#c7432f] px-4 py-2.5 text-xs font-black text-white shadow-[0_10px_25px_rgba(199,67,47,0.25)] transition hover:-translate-y-0.5 hover:bg-[#ad3524] sm:px-5 sm:text-sm">
              <span className="hidden sm:inline">Start free</span><span className="sm:hidden">Join</span><ArrowRight size={15} />
            </Link>
          </div>
        </nav>
      </header>

      <section className="relative isolate overflow-hidden bg-[linear-gradient(135deg,#fff0a8_0%,#ffd978_54%,#ffca67_100%)]">
        <div className="summer-2026-grain" aria-hidden="true" />
        <div className="pointer-events-none absolute -right-24 top-10 size-80 rounded-full border border-[#073d47]/10" aria-hidden="true" />
        <div className="pointer-events-none absolute -right-8 top-28 size-52 rounded-full border border-[#073d47]/10" aria-hidden="true" />
        <div className="relative z-10 mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 sm:py-20 lg:grid-cols-[0.82fr_1.18fr] lg:items-center lg:gap-16 lg:px-8 lg:py-24">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[#073d47]/10 bg-white/75 px-3.5 py-2 text-[11px] font-black uppercase tracking-[0.18em] text-[#0b7773] shadow-sm backdrop-blur">
              <Sparkles size={14} className="text-[#ff6547]" /> We&apos;re here to help
            </div>
            <h1 className="mt-6 max-w-xl text-5xl font-black leading-[0.93] tracking-[-0.065em] sm:text-6xl lg:text-7xl">
              Let&apos;s keep your business moving.
            </h1>
            <p className="mt-6 max-w-lg text-base leading-7 text-[#41656b] sm:text-lg sm:leading-8">
              Questions about your workspace, billing, privacy, or getting started? Tell us what you need and the Comvexa team will help you find the clearest next step.
            </p>

            <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
              <a href="mailto:comvexa1@gmail.com" className="group rounded-[1.6rem] bg-[#073d47] p-5 text-white shadow-[0_18px_35px_rgba(7,61,71,0.2)] transition hover:-translate-y-1">
                <span className="grid size-10 place-items-center rounded-xl bg-[#ffc857] text-[#073d47]"><Mail size={19} /></span>
                <p className="mt-5 text-xs font-black uppercase tracking-[0.16em] text-[#8ef0df]">Email us directly</p>
                <p className="mt-2 break-all text-sm font-black sm:text-base">comvexa1@gmail.com</p>
              </a>
              <div className="rounded-[1.6rem] border border-[#073d47]/10 bg-white/75 p-5 shadow-sm backdrop-blur">
                <span className="grid size-10 place-items-center rounded-xl bg-[#ff6547]/10 text-[#d84930]"><Clock size={19} /></span>
                <p className="mt-5 text-xs font-black uppercase tracking-[0.16em] text-[#d84930]">Response time</p>
                <p className="mt-2 text-sm font-bold leading-6 text-[#41656b]">Usually within 1–2 business days.</p>
              </div>
            </div>
          </div>

          <ContactForm />
        </div>
      </section>

      <section className="px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-2xl">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-[#0c8b84]">Choose your route</p>
            <h2 className="mt-4 text-4xl font-black leading-none tracking-[-0.055em] sm:text-5xl">The right help, without the runaround.</h2>
          </div>
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {contactOptions.map((option, index) => {
              const Icon = option.icon;
              const tones = ["bg-[#e2f8f2] text-[#08756f]", "bg-[#fff0ba] text-[#8a5b00]", "bg-[#ffe6df] text-[#c7432f]"];
              return (
                <div key={option.title} className="group rounded-[2rem] border border-[#073d47]/10 bg-white p-6 shadow-[0_16px_45px_rgba(7,61,71,0.06)] transition hover:-translate-y-1 hover:shadow-[0_22px_55px_rgba(7,61,71,0.1)] sm:p-7">
                  <div className="flex items-center justify-between">
                    <span className={`grid size-12 place-items-center rounded-2xl ${tones[index]}`}><Icon size={22} /></span>
                    <ArrowRight size={18} className="text-[#073d47]/25 transition group-hover:translate-x-1 group-hover:text-[#ff6547]" />
                  </div>
                  <h3 className="mt-7 text-2xl font-black tracking-[-0.04em]">{option.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-[#617a7f]">{option.text}</p>
                  <p className="mt-5 text-xs font-black uppercase tracking-[0.13em] text-[#0c8b84]">{option.value}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <footer className="bg-[#052f37] px-4 py-8 text-white sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <Link href="/" className="flex items-center gap-2.5 font-black"><Image src="/logo.png" alt="" width={36} height={36} className="size-9 rounded-xl bg-white object-contain p-1" />Comvexa</Link>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs font-bold text-white/50">
            <Link href="/privacy" className="hover:text-[#ffc857]">Privacy</Link>
            <Link href="/terms" className="hover:text-[#ffc857]">Terms</Link>
            <Link href="/refund" className="hover:text-[#ffc857]">Refunds</Link>
            <span>Copyright 2026</span>
          </div>
        </div>
      </footer>
    </main>
  );
}
