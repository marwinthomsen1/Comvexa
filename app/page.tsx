import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  Boxes,
  Building2,
  CalendarDays,
  Check,
  ChevronRight,
  CreditCard,
  FileText,
  Globe2,
  HandCoins,
  Landmark,
  Layers3,
  ListChecks,
  LockKeyhole,
  ReceiptText,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import { CurrencyAmount, CurrencySelector } from "./_components/currency-display";
import { HomeText, LanguageSelector } from "./_components/language-display";
import { PricingCards } from "./_components/pricing-cards";

const modules = [
  { title: "Customers", text: "Profiles, notes, balances, history, and contact details.", icon: Users },
  { title: "Employees", text: "Staff records, roles, salaries, schedules, and accountability.", icon: Building2 },
  { title: "Bookings", text: "Appointments, field work, service times, and operational planning.", icon: CalendarDays },
  { title: "Tasks", text: "Priorities, due dates, owners, and everyday team follow-up.", icon: ListChecks },
  { title: "Invoices", text: "Invoice records, totals, due dates, payment status, and items.", icon: ReceiptText },
  { title: "Payments", text: "Payment methods, payment dates, notes, and collection tracking.", icon: CreditCard },
  { title: "Expenses", text: "Categories, vendors, tax amounts, and business cost tracking.", icon: HandCoins },
  { title: "Documents", text: "PDF uploads, expiry dates, file types, and secure company storage.", icon: FileText },
  { title: "Inventory", text: "Stock quantities, suppliers, units, and low-stock alerts.", icon: Boxes },
  { title: "Reports", text: "Revenue, expenses, cash flow, profit/loss, and operations summaries.", icon: BarChart3 },
  { title: "Branches", text: "Locations, contact numbers, and branch-level organization.", icon: Layers3 },
  { title: "Permissions", text: "Prepare module access rules for staff, managers, and admins.", icon: LockKeyhole },
];

const useCases = [
  "Service companies",
  "Retail stores",
  "Agencies",
  "Clinics",
  "Contractors",
  "Salons",
  "Maintenance teams",
  "Field operations",
];

const plans = [
  {
    name: "Basic",
    priceUsd: 29,
    description: "Essential tools for small businesses and freelancers.",
    trial: "No free trial",
    features: [
      "Dashboard",
      "Customer management",
      "Services/products",
      "Tasks",
      "Invoices",
      "Payments",
      "Expenses",
      "Customer balances",
      "Basic reports",
      "Company settings",
    ],
  },
  {
    name: "Pro",
    priceUsd: 79,
    description: "The best starting point for growing companies with staff.",
    trial: "3-day free trial",
    featured: true,
    features: [
      "Everything in Basic",
      "Employee management",
      "Staff schedules",
      "Bookings",
      "Documents and PDF uploads",
      "Recurring invoices",
      "Payment reminders",
      "WhatsApp templates",
      "Profit and loss summary",
      "Advanced reports",
    ],
  },
  {
    name: "Ultra",
    priceUsd: 149,
    description: "The complete operations suite for multi-branch companies.",
    trial: "7-day free trial",
    features: [
      "Everything in Pro",
      "Multiple branches",
      "Branch profit and loss",
      "Inventory management",
      "Low-stock alerts",
      "Purchase orders",
      "Supplier bills",
      "Custom roles and permissions",
      "Audit logs",
      "Approval workflows",
      "AI business assistant",
      "Automated invoice follow-ups",
      "Customer payment portal",
      "Employee performance reports",
      "Cash flow overview",
      "Payment reconciliation",
      "Multi-currency records",
      "Custom tax settings",
      "White-label invoices",
      "Data import help",
      "Priority support",
    ],
  },
];

const faqs = [
  {
    question: "Can Comvexa work for any industry?",
    answer:
      "Yes. Comvexa is designed as a flexible company management platform for service businesses, retailers, agencies, clinics, contractors, and many other operating teams.",
  },
  {
    question: "Is company data separated?",
    answer:
      "Yes. Company records are separated by workspace so each business can only access its own data when security rules are applied.",
  },
  {
    question: "Does Comvexa include accounting tools?",
    answer:
      "Comvexa includes invoices, payments, expenses, supplier bills, tax tracking fields, receivables, cash flow, and profit/loss summaries. It is built for operational accounting workflows.",
  },
  {
    question: "Which plan has a free trial?",
    answer:
      "Pro includes a 3-day free trial, Ultra includes a 7-day free trial, and Basic does not include a free trial.",
  },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-[#fff7da] text-slate-950">
      <header className="sticky top-0 z-30 border-b border-orange-200/70 bg-[#fffaf0]/90 text-slate-950 shadow-sm shadow-orange-100/60 backdrop-blur-xl">
        <nav className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-3 py-2.5 sm:px-6 sm:py-4 lg:px-8">
          <Link
            href="/"
            className="group flex min-w-0 items-center gap-2 rounded-2xl border border-white/70 bg-white/75 px-2.5 py-2 font-semibold shadow-lg shadow-orange-200/35 ring-1 ring-cyan-900/5 transition hover:-translate-y-0.5 hover:bg-white sm:gap-3 sm:px-3"
          >
            <span className="relative grid size-10 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-cyan-100 via-white to-amber-100 p-1 shadow-inner sm:size-11">
              <Image
                src="/logo.png"
                alt="Comvexa logo"
                width={44}
                height={44}
                className="size-full rounded-xl object-contain"
                priority
              />
              <span className="absolute -right-1 -top-1 grid size-4 place-items-center rounded-full bg-[#ff7a59] text-white ring-2 ring-white">
                <Sparkles size={10} />
              </span>
            </span>
            <span className="min-w-0">
              <span className="block truncate text-base leading-5 sm:text-lg">Comvexa</span>
              <span className="block truncate text-[10px] font-semibold uppercase text-cyan-700 sm:hidden">
                Business OS
              </span>
            </span>
          </Link>
          <div className="hidden items-center gap-7 text-sm font-medium text-slate-600 md:flex">
            <a href="#platform" className="hover:text-cyan-700"><HomeText id="platform" /></a>
            <a href="#accounting" className="hover:text-cyan-700"><HomeText id="accounting" /></a>
            <a href="#pricing" className="hover:text-cyan-700"><HomeText id="pricing" /></a>
            <a href="#faq" className="hover:text-cyan-700"><HomeText id="faq" /></a>
          </div>
          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <div className="hidden items-center gap-3 md:flex">
              <CurrencySelector tone="light" />
              <LanguageSelector tone="light" />
            </div>
            <Link href="/login" className="hidden text-sm font-semibold text-slate-600 hover:text-cyan-700 sm:inline">
              <HomeText id="login" />
            </Link>
            <a
              href="#pricing"
              className="inline-flex h-12 items-center justify-center gap-1.5 rounded-2xl border border-cyan-900/10 bg-white/80 px-3 text-sm font-bold text-cyan-950 shadow-lg shadow-cyan-100/50 ring-1 ring-white/70 transition hover:-translate-y-0.5 hover:bg-white sm:hidden"
            >
              <CreditCard size={15} />
              <span>Plans</span>
            </a>
            <Link
              href="/register"
              className="inline-flex h-12 items-center justify-center gap-1.5 rounded-2xl bg-gradient-to-br from-[#ff8a5f] to-[#ff5633] px-4 text-sm font-bold text-white shadow-xl shadow-orange-300/50 ring-1 ring-orange-300/40 transition hover:-translate-y-0.5 hover:shadow-orange-300/70 sm:h-auto sm:px-4 sm:py-2.5"
            >
              <span className="sm:hidden">Start</span>
              <span className="hidden sm:inline"><HomeText id="startTrial" /></span>
              <ArrowRight size={15} className="sm:hidden" />
            </Link>
          </div>
        </nav>
      </header>

      <section className="summer-hero relative isolate overflow-hidden text-slate-950">
        <div className="summer-sun" aria-hidden="true">
          <span />
        </div>
        <div className="summer-cloud summer-cloud-one" aria-hidden="true" />
        <div className="summer-cloud summer-cloud-two" aria-hidden="true" />
        <div className="summer-float summer-float-one" aria-hidden="true" />
        <div className="summer-float summer-float-two" aria-hidden="true" />
        <div className="summer-float summer-float-three" aria-hidden="true" />

        <div className="relative z-10 mx-auto max-w-7xl px-5 pb-12 pt-9 sm:px-6 sm:pb-24 sm:pt-16 lg:px-8 lg:pb-36 lg:pt-28">
          <div className="grid items-center gap-12 lg:grid-cols-[0.92fr_1.08fr]">
            <div className="summer-rise">
              <p className="inline-flex max-w-full items-center gap-2 rounded-full border border-cyan-400/60 bg-white/85 px-3 py-1.5 text-xs font-semibold text-cyan-900 shadow-lg shadow-cyan-200/40 sm:px-4 sm:py-2 sm:text-sm">
                <Sparkles size={15} />
                <HomeText id="eyebrow" />
              </p>
              <h1 className="mt-4 max-w-4xl text-[2.55rem] font-semibold leading-[1.04] tracking-normal text-[#06112f] sm:mt-6 sm:text-6xl lg:text-7xl">
                <HomeText id="headline" />
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-slate-700 sm:mt-6 sm:text-lg sm:leading-8">
                <HomeText id="subhead" />
              </p>
              <div className="mt-6 flex flex-col gap-3 sm:mt-9 sm:flex-row">
                <Link
                  href="/register"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#ff6b4a] px-6 py-3.5 text-sm font-semibold text-white shadow-xl shadow-orange-300/60 transition hover:-translate-y-0.5 hover:bg-[#ff5633] sm:py-3"
                >
                  <HomeText id="createWorkspace" />
                  <ArrowRight size={17} />
                </Link>
                <a
                  href="#platform"
                  className="hidden items-center justify-center rounded-xl border border-cyan-500/40 bg-white/80 px-6 py-3 text-sm font-semibold text-cyan-950 shadow-lg shadow-cyan-100/60 transition hover:-translate-y-0.5 hover:bg-white sm:inline-flex"
                >
                  <HomeText id="explorePlatform" />
                </a>
              </div>
              <div className="mt-8 hidden gap-3 sm:grid sm:grid-cols-3 lg:mt-10">
                {[
                  ["12+", "business modules"],
                  ["3", "subscription plans"],
                  ["3 days", "Pro free trial"],
                ].map(([value, label]) => (
                  <div key={label} className="summer-stat rounded-2xl border border-white/70 bg-white/70 p-4 shadow-lg shadow-orange-100/70 backdrop-blur">
                    <p className="text-2xl font-semibold">{value}</p>
                    <p className="mt-1 text-sm text-slate-600">{label}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="summer-rise summer-rise-delay relative hidden lg:block">
              <div className="absolute -right-8 -top-8 hidden rounded-full bg-[#ffcf5a] px-5 py-3 text-sm font-bold text-orange-950 shadow-xl shadow-orange-200/70 rotate-6 lg:block">
                Sunny ops
              </div>
              <div className="relative rounded-[2rem] border border-white/70 bg-white/55 p-4 shadow-2xl shadow-cyan-200/60 backdrop-blur-md">
                <div className="rounded-[1.5rem] bg-white/95 p-5 text-slate-950 shadow-xl">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                    <div>
                      <p className="font-semibold">Comvexa Command Center</p>
                      <p className="text-sm text-cyan-700">Bright summer business overview</p>
                    </div>
                    <span className="rounded-full bg-cyan-50 px-3 py-1 text-xs font-semibold text-cyan-700">
                      Connected
                    </span>
                  </div>
                  <div className="mt-5 grid gap-3 sm:grid-cols-3">
                    {[
                      { label: "Revenue", value: <CurrencyAmount usd={24600} compact />, color: "bg-cyan-500" },
                      { label: "Invoices", value: "128", color: "bg-[#ff7a59]" },
                      { label: "Tasks", value: "42", color: "bg-amber-400" },
                    ].map((stat) => (
                      <div key={stat.label} className="rounded-2xl border border-slate-200 p-4">
                        <p className="text-xs text-slate-500">{stat.label}</p>
                        <p className="mt-2 text-2xl font-semibold">{stat.value}</p>
                        <div className="mt-3 h-2 rounded-full bg-slate-100">
                          <div className={`h-2 w-2/3 rounded-full ${stat.color}`} />
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_0.9fr]">
                    <div className="rounded-2xl border border-slate-200">
                      {[
                        "Payment received",
                        "PDF contract uploaded",
                        "Staff schedule updated",
                        "Supplier bill created",
                      ].map((item) => (
                        <div key={item} className="flex items-center justify-between border-b border-slate-100 px-4 py-3 last:border-b-0">
                          <span className="text-sm text-slate-700">{item}</span>
                          <span className="size-2 rounded-full bg-cyan-500" />
                        </div>
                      ))}
                    </div>
                    <div className="rounded-2xl bg-cyan-950 p-4 text-white">
                      <p className="font-semibold">Accounting snapshot</p>
                      <div className="mt-4 space-y-3 text-sm">
                        <div className="flex justify-between text-slate-300">
                          <span>Income</span>
                          <span><CurrencyAmount usd={18400} /></span>
                        </div>
                        <div className="flex justify-between text-slate-300">
                          <span>Expenses</span>
                          <span><CurrencyAmount usd={6120} /></span>
                        </div>
                        <div className="border-t border-white/10 pt-3">
                          <div className="flex justify-between font-semibold">
                            <span>Profit</span>
                            <span className="text-amber-200"><CurrencyAmount usd={12280} /></span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="summer-wave summer-wave-back" aria-hidden="true" />
        <div className="summer-wave summer-wave-front" aria-hidden="true" />
      </section>

      <section className="hidden border-y border-cyan-900/10 bg-white px-6 py-8 sm:block lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-4 md:grid-cols-4">
          {[
            ["Global-ready", "Works for teams, branches, and markets worldwide."],
            ["Operations-first", "Customers, staff, work, invoices, and reports together."],
            ["Plan controlled", "Only unlock the modules included in each subscription."],
            ["Pro trial", "Try Pro for 3 days before continuing monthly."],
          ].map(([title, text]) => (
            <div key={title} className="rounded-2xl border border-cyan-900/10 bg-[#f4fdff] p-5">
              <p className="text-sm font-semibold text-cyan-700">{title}</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">{text}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="platform" className="px-5 py-12 sm:px-6 sm:py-20 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-8 lg:grid-cols-[0.75fr_1.25fr] lg:items-end">
            <div>
              <p className="text-sm font-semibold uppercase tracking-widest text-cyan-700">Platform</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-normal sm:text-4xl">Everything your company needs to operate.</h2>
              <p className="mt-4 text-slate-600">
                Comvexa is not a single-purpose tool. It combines operations,
                finance, documents, people, inventory, reports, and company
                settings in one organized workspace.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {useCases.map((item) => (
                <div key={item} className="rounded-2xl border border-amber-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm shadow-amber-100/70">
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div className="mt-8 grid gap-4 sm:mt-10 sm:grid-cols-2 lg:grid-cols-4">
            {modules.map((module) => {
              const Icon = module.icon;

              return (
                <div key={module.title} className="rounded-3xl border border-cyan-900/10 bg-white p-5 shadow-sm shadow-amber-100/80 transition hover:-translate-y-1 hover:shadow-xl">
                  <span className="flex size-12 items-center justify-center rounded-2xl bg-cyan-50 text-cyan-700 ring-1 ring-cyan-100">
                    <Icon size={21} />
                  </span>
                  <h3 className="mt-5 font-semibold text-slate-950">{module.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{module.text}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section id="accounting" className="bg-white px-5 py-12 sm:px-6 sm:py-20 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1fr_1fr] lg:items-center">
          <div className="rounded-[2rem] bg-cyan-950 p-6 text-white">
            <div className="grid gap-4 sm:grid-cols-2">
              {[
                ["Invoices", "Create and track customer invoices", ReceiptText],
                ["Payments", "Record collection method and dates", CreditCard],
                ["Expenses", "Track categories, vendors, and tax", HandCoins],
                ["Supplier bills", "Monitor payables and due dates", Landmark],
              ].map(([title, text, Icon]) => (
                <div key={String(title)} className="rounded-2xl border border-white/10 bg-white/[0.06] p-5">
                  <Icon className="text-amber-200" size={22} />
                  <h3 className="mt-4 font-semibold">{String(title)}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-400">{String(text)}</p>
                </div>
              ))}
            </div>
          </div>
          <div>
            <p className="text-sm font-semibold uppercase tracking-widest text-cyan-700">Finance and accounting</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-normal sm:text-4xl">Know where the money is going.</h2>
            <p className="mt-4 text-slate-600">
              Comvexa helps businesses manage the financial side of operations:
              invoices, payments, expenses, supplier bills, taxes, receivables,
              cash flow, and profit/loss summaries.
            </p>
            <div className="mt-6 grid gap-3">
              {[
                "Accounts receivable and unpaid invoice follow-up",
                "Expense categories, tax amounts, vendors, and notes",
                "Cash flow, profit/loss, income, and supplier bill reports",
                "Accountant-ready exports planned for Ultra workflows",
              ].map((item) => (
                <div key={item} className="flex gap-3 rounded-2xl border border-cyan-900/10 bg-[#f4fdff] p-4 text-sm text-slate-700">
                  <Check className="mt-0.5 shrink-0 text-cyan-600" size={17} />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="px-5 py-12 sm:px-6 sm:py-20 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-widest text-cyan-700">Workflow</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-normal sm:text-4xl">From first customer to final report.</h2>
          </div>
          <div className="mt-10 grid gap-4 md:grid-cols-4">
            {[
              ["1", "Create company workspace", "Register, choose a plan, complete payment setup."],
              ["2", "Add business data", "Customers, employees, services, invoices, tasks, and documents."],
              ["3", "Run daily operations", "Assign work, schedule bookings, record payments, upload PDFs."],
              ["4", "Review performance", "Use reports for income, expenses, cash flow, tasks, and bookings."],
            ].map(([step, title, text]) => (
              <div key={step} className="rounded-3xl border border-cyan-900/10 bg-white p-6 shadow-sm shadow-amber-100/80">
                <span className="flex size-11 items-center justify-center rounded-2xl bg-[#ff7a59] text-sm font-semibold text-white">{step}</span>
                <h3 className="mt-5 font-semibold text-slate-950">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="pricing" className="bg-cyan-950 px-5 py-12 text-white sm:px-6 sm:py-20 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-sm font-semibold uppercase tracking-widest text-amber-200">Pricing</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-normal sm:text-4xl">Plans that match your operating stage.</h2>
            <p className="mt-4 text-slate-300">
              Users sign up first, choose a plan, then continue to payment.
              Pro includes a 3-day trial, and Ultra includes a 7-day trial.
            </p>
          </div>
          <PricingCards plans={plans} />
        </div>
      </section>

      <section className="bg-white px-5 py-12 sm:px-6 sm:py-20 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
          <div>
            <p className="text-sm font-semibold uppercase tracking-widest text-cyan-700">Security and global readiness</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-normal sm:text-4xl">Built for multi-company SaaS from the start.</h2>
            <p className="mt-4 text-slate-600">
              Every operational table is designed around company isolation.
              The platform is prepared for global settings, PDF storage,
              plan-based access, permissions, and future payment automation.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              ["Company-isolated data", "Business records are tied to company_id.", ShieldCheck],
              ["Global settings", "Currency, timezone, and workspace customization.", Globe2],
              ["Plan-based modules", "Users only see modules included in their plan.", Layers3],
              ["Secure documents", "PDFs can be stored in private company file storage.", FileText],
            ].map(([title, text, Icon]) => (
              <div key={String(title)} className="rounded-3xl border border-cyan-900/10 bg-[#f4fdff] p-5">
                <Icon className="text-cyan-700" size={22} />
                <h3 className="mt-4 font-semibold text-slate-950">{String(title)}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{String(text)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="faq" className="px-5 py-12 sm:px-6 sm:py-20 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <div className="text-center">
            <p className="text-sm font-semibold uppercase tracking-widest text-cyan-700">FAQ</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-normal sm:text-4xl">Questions before you start?</h2>
          </div>
          <div className="mt-10 grid gap-4 md:grid-cols-2">
            {faqs.map((faq) => (
              <div key={faq.question} className="rounded-3xl border border-cyan-900/10 bg-white p-6 shadow-sm shadow-amber-100/80">
                <h3 className="font-semibold text-slate-950">{faq.question}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-600">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#fff1c7] px-5 py-12 text-slate-950 sm:px-6 sm:py-20 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-8 overflow-hidden rounded-3xl border border-cyan-900/10 bg-white/70 p-5 shadow-2xl shadow-amber-200/60 sm:p-6 lg:grid-cols-[1fr_0.7fr] lg:p-10">
          <div>
            <p className="inline-flex rounded-full bg-cyan-50 px-4 py-2 text-sm font-semibold text-cyan-700 ring-1 ring-cyan-100">
              Start with your company workspace
            </p>
            <h2 className="mt-6 max-w-3xl text-3xl font-semibold tracking-normal sm:text-4xl">
              Sign up, choose your plan, complete payment setup, then open your dashboard.
            </h2>
            <p className="mt-4 max-w-2xl text-slate-700">
              Comvexa is built step by step so your company can start simple,
              then expand into accounting, operations, documents, inventory,
              permissions, and reports.
            </p>
          </div>
          <div className="flex flex-col justify-center gap-3">
            <Link
              href="/register"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#ff7a59] px-6 py-3 text-sm font-semibold text-white hover:bg-[#ff6741]"
            >
              Create account
              <ChevronRight size={17} />
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center justify-center rounded-xl border border-cyan-900/15 bg-white px-6 py-3 text-sm font-semibold text-cyan-900 hover:bg-cyan-50"
            >
              Login
            </Link>
          </div>
        </div>
      </section>

      <footer className="bg-cyan-950 px-5 py-10 text-white sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.04]">
          <div className="grid gap-8 border-b border-white/10 p-6 lg:grid-cols-[1.1fr_0.9fr] lg:p-10">
            <div>
              <Link href="/" className="flex items-center gap-3 font-semibold">
                <Image
                  src="/logo.png"
                  alt="Comvexa logo"
                  width={48}
                  height={48}
                  className="size-12 rounded-2xl bg-white object-contain p-1"
                />
                <div>
                  <span className="block text-xl">Comvexa</span>
                  <span className="text-sm font-medium text-amber-200">Global company management software</span>
                </div>
              </Link>
              <p className="mt-6 max-w-2xl text-base leading-8 text-slate-300">
                Run customers, staff, bookings, invoices, payments, expenses,
                documents, inventory, branches, permissions, and reports from
                one professional workspace built for global businesses.
              </p>
              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                {[
                  ["Company data", "Separated by workspace"],
                  ["Pro trial", "3 days included"],
                  ["Plans", "Basic, Pro, Ultra"],
                ].map(([title, text]) => (
                  <div key={title} className="rounded-2xl border border-white/10 bg-cyan-900/60 p-4">
                    <p className="text-sm font-semibold text-white">{title}</p>
                    <p className="mt-1 text-xs text-slate-400">{text}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-3xl bg-[#ffcf5a] p-6 text-slate-950">
              <p className="text-sm font-semibold uppercase tracking-widest text-orange-950/70">
                Ready to start
              </p>
              <h3 className="mt-3 text-3xl font-semibold tracking-normal">
                Create your workspace, choose Pro, and test Comvexa for 3 days.
              </h3>
              <p className="mt-4 text-sm leading-6 text-orange-950/80">
                After registration you will choose a plan, complete payment
                setup, and unlock the dashboard modules included in that plan.
              </p>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/register"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-cyan-950 px-5 py-3 text-sm font-semibold text-white hover:bg-cyan-900"
                >
                  Start Pro Trial
                  <ArrowRight size={17} />
                </Link>
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center rounded-xl border border-orange-950/20 bg-white/80 px-5 py-3 text-sm font-semibold text-slate-950 hover:bg-white"
                >
                  Login
                </Link>
              </div>
            </div>
          </div>

          <div className="grid gap-8 p-6 sm:grid-cols-2 lg:grid-cols-5 lg:p-10">
            <div>
              <h3 className="text-sm font-semibold text-white">Platform</h3>
              <div className="mt-4 grid gap-3 text-sm text-slate-400">
                <a href="#platform" className="hover:text-amber-200">Operations workspace</a>
                <a href="#accounting" className="hover:text-amber-200">Accounting tools</a>
                <a href="#pricing" className="hover:text-amber-200">Subscription plans</a>
                <a href="#faq" className="hover:text-amber-200">Questions</a>
              </div>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">Business Modules</h3>
              <div className="mt-4 grid gap-3 text-sm text-slate-400">
                <span>Customers and employees</span>
                <span>Bookings and tasks</span>
                <span>Invoices and payments</span>
                <span>Documents and reports</span>
              </div>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">Finance</h3>
              <div className="mt-4 grid gap-3 text-sm text-slate-400">
                <span>Expenses and supplier bills</span>
                <span>Cash flow overview</span>
                <span>Profit and loss summary</span>
                <span>Tax tracking fields</span>
              </div>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">Account</h3>
              <div className="mt-4 grid gap-3 text-sm text-slate-400">
                <Link href="/login" className="hover:text-amber-200">Login</Link>
                <Link href="/register" className="hover:text-amber-200">Register</Link>
                <Link href="/dashboard" className="hover:text-amber-200">Dashboard</Link>
                <Link href="/contact" className="hover:text-amber-200">Contact Us</Link>
                <span>Secure account access</span>
              </div>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">Legal</h3>
              <div className="mt-4 grid gap-3 text-sm text-slate-400">
                <Link href="/privacy" className="hover:text-amber-200">Privacy Policy</Link>
                <Link href="/terms" className="hover:text-amber-200">Terms of Service</Link>
                <Link href="/refund" className="hover:text-amber-200">Refund Policy</Link>
                <Link href="/cookies" className="hover:text-amber-200">Cookie Policy</Link>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3 border-t border-white/10 bg-cyan-950/70 px-6 py-5 text-sm text-slate-400 md:flex-row md:items-center md:justify-between lg:px-10">
            <p>Copyright 2026 Comvexa. All rights reserved.</p>
            <div className="flex flex-wrap gap-4">
              <span className="rounded-full bg-white/5 px-3 py-1">Global SaaS</span>
              <span className="rounded-full bg-white/5 px-3 py-1">Multi-company</span>
              <span className="rounded-full bg-white/5 px-3 py-1">Plan-based access</span>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}

