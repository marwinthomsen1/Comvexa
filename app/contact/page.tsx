import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Clock, CreditCard, MessageSquare, ShieldCheck } from "lucide-react";
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
    <main className="min-h-screen bg-[#f4f7fb] text-slate-950">
      <header className="border-b border-slate-200 bg-white">
        <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-3 font-semibold">
            <Image
              src="/logo.png"
              alt="Comvexa logo"
              width={42}
              height={42}
              className="size-10 rounded-xl bg-white object-contain ring-1 ring-slate-200"
              priority
            />
            <span>Comvexa</span>
          </Link>
          <Link
            href="/register"
            className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700"
          >
            Start Pro Trial
          </Link>
        </nav>
      </header>

      <section className="px-6 py-14 lg:py-20">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
            <div>
              <p className="text-sm font-semibold uppercase tracking-widest text-emerald-700">
                Contact
              </p>
              <h1 className="mt-3 text-4xl font-semibold tracking-normal sm:text-5xl">
                Contact Us
              </h1>
              <p className="mt-6 text-base leading-8 text-slate-700">
                Have a question about Comvexa, your company workspace,
                subscriptions, billing, privacy, or support? Send a request and
                keep the conversation organized while the official support inbox
                is being prepared.
              </p>
              <div className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/70">
                <div className="flex items-start gap-4">
                  <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100">
                    <Clock size={22} />
                  </span>
                  <div>
                    <h2 className="font-semibold text-slate-950">Response time</h2>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      We usually respond to business inquiries within 1-2
                      business days. Billing and account access requests are
                      prioritized.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid gap-4">
              <ContactForm />
              {contactOptions.map((option) => {
                const Icon = option.icon;

                return (
                  <div
                    key={option.title}
                    className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/70"
                  >
                    <div className="flex items-start gap-4">
                      <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100">
                        <Icon size={22} />
                      </span>
                      <div>
                        <h2 className="text-xl font-semibold tracking-normal text-slate-950">
                          {option.title}
                        </h2>
                        <p className="mt-2 text-sm leading-6 text-slate-600">
                          {option.text}
                        </p>
                        <p className="mt-4 text-sm font-semibold text-emerald-700">
                          {option.value}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
