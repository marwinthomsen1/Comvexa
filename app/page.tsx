import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  BarChart3,
  Bot,
  Boxes,
  BriefcaseBusiness,
  Building2,
  CalendarClock,
  CalendarDays,
  Check,
  ChevronRight,
  ClipboardCheck,
  CreditCard,
  FileText,
  GitBranch,
  Globe2,
  HandCoins,
  Landmark,
  LineChart,
  ListChecks,
  LockKeyhole,
  ReceiptText,
  Repeat,
  ShieldCheck,
  Sparkles,
  UploadCloud,
  Users,
  WalletCards,
  Workflow,
} from "lucide-react";
import { CurrencyAmount, CurrencySelector } from "./_components/currency-display";
import { HomeText, LanguageSelector } from "./_components/language-display";
import { PricingCards } from "./_components/pricing-cards";

const navLinks = [
  { href: "#platform", textId: "platform" as const },
  { href: "#accounting", textId: "accounting" as const },
  { href: "#pricing", textId: "pricing" as const },
  { href: "#faq", textId: "faq" as const },
];

const heroModules = [
  { label: "Customers", icon: Users },
  { label: "Invoices", icon: ReceiptText },
  { label: "Staff", icon: BriefcaseBusiness },
  { label: "Reports", icon: BarChart3 },
];

const proofPoints = [
  ["28", "workspace modules"],
  ["3", "plan levels"],
  ["7 days", "Ultra trial"],
  ["Global", "currency-ready"],
];

const workspaceLanes = [
  {
    title: "Operations",
    text: "Customers, services, bookings, tasks, schedules, time, and team ownership.",
    icon: CalendarDays,
    items: ["Bookings", "Tasks", "Schedules", "Services"],
  },
  {
    title: "Finance",
    text: "Invoices, payments, expenses, recurring billing, supplier bills, and cash flow.",
    icon: WalletCards,
    items: ["Invoices", "Payments", "Expenses", "Supplier bills"],
  },
  {
    title: "Assets",
    text: "Documents, inventory, branches, purchase orders, uploads, and customer portals.",
    icon: Boxes,
    items: ["Documents", "Inventory", "Branches", "Portal"],
  },
  {
    title: "Control",
    text: "Permissions, audit logs, approvals, automation, reports, and AI assistance.",
    icon: ShieldCheck,
    items: ["Permissions", "Reports", "Approvals", "AI"],
  },
];

const modules = [
  { title: "Customers", text: "Profiles, balances, notes, history, and contacts.", icon: Users },
  { title: "Employees", text: "Roles, salaries, schedules, and accountability.", icon: Building2 },
  { title: "Bookings", text: "Appointments, field work, service times, and planning.", icon: CalendarClock },
  { title: "Tasks", text: "Priorities, owners, due dates, and daily follow-up.", icon: ListChecks },
  { title: "Invoices", text: "Invoice totals, items, status, due dates, and reminders.", icon: ReceiptText },
  { title: "Payments", text: "Collection methods, dates, notes, and reconciliation.", icon: CreditCard },
  { title: "Expenses", text: "Vendors, categories, tax fields, and cost tracking.", icon: HandCoins },
  { title: "Documents", text: "PDF storage, expiry dates, types, and secure records.", icon: FileText },
  { title: "Inventory", text: "Stock, suppliers, units, valuation, and low-stock alerts.", icon: Boxes },
  { title: "Branches", text: "Locations, branch performance, teams, and settings.", icon: GitBranch },
  { title: "Automations", text: "Follow-ups, recurring tasks, and workflow actions.", icon: Workflow },
  { title: "Reports", text: "Revenue, expenses, cash flow, activity, and profit/loss.", icon: LineChart },
];

const financeStack = [
  ["Income", "Invoices, recurring invoices, payments, and receivables."],
  ["Costs", "Expenses, supplier bills, purchase orders, and tax fields."],
  ["Control", "Cash flow, profit/loss, aging, reconciliations, and exports."],
];

const workflowSteps = [
  ["01", "Create the workspace", "Register, choose a plan, and open the modules your team needs."],
  ["02", "Add business records", "Customers, employees, services, inventory, documents, and branches."],
  ["03", "Run the day", "Schedule work, send invoices, collect payments, and track tasks."],
  ["04", "Review performance", "Watch cash flow, activity, reports, approvals, and open work."],
];

const trustSignals = [
  { title: "Paddle checkout", text: "Secure subscription billing handled outside Comvexa.", icon: CreditCard },
  { title: "Workspace separation", text: "Records are tied to each company workspace.", icon: ShieldCheck },
  { title: "Global settings", text: "Currency, timezone, language, and branding controls.", icon: Globe2 },
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
      "Yes. Comvexa is flexible enough for service businesses, retailers, agencies, clinics, contractors, salons, maintenance teams, and field operations.",
  },
  {
    question: "Is company data separated?",
    answer:
      "Yes. Operational records are designed around company workspaces, so each business can keep its customers, invoices, documents, and settings separate.",
  },
  {
    question: "Does Comvexa include accounting tools?",
    answer:
      "Comvexa includes invoices, payments, expenses, supplier bills, tax fields, receivables, cash flow, and profit/loss summaries for operational accounting.",
  },
  {
    question: "Which plan has a free trial?",
    answer:
      "Pro includes a 3-day free trial, Ultra includes a 7-day free trial, and Basic starts as a paid plan without a trial.",
  },
];

function ProductPreview() {
  const sidebarItems = [
    ["Dashboard", BarChart3],
    ["Customers", Users],
    ["Invoices", ReceiptText],
    ["Tasks", ListChecks],
    ["Inventory", Boxes],
  ] as const;

  const activity = [
    ["Invoice CX-2044 paid", "2 min ago", "Paid"],
    ["New booking assigned", "18 min ago", "Ops"],
    ["Supplier bill approved", "42 min ago", "Finance"],
    ["Document expires soon", "Today", "Alert"],
  ];

  return (
    <div className="w-full min-w-0 max-w-full overflow-hidden rounded-lg border border-slate-200 bg-slate-950 shadow-2xl shadow-slate-300/70">
      <div className="flex items-center justify-between border-b border-white/10 bg-slate-900 px-4 py-3 text-white">
        <div className="flex items-center gap-3">
          <Image
            src="/logo.png"
            alt="Comvexa logo"
            width={36}
            height={36}
            className="size-9 rounded-md bg-white object-contain p-1"
            priority
          />
          <div>
            <p className="text-sm font-semibold">Comvexa workspace</p>
            <p className="text-xs text-slate-400">Executive dashboard</p>
          </div>
        </div>
        <span className="hidden rounded-md bg-emerald-400/10 px-3 py-1 text-xs font-semibold text-emerald-200 sm:inline">
          Live overview
        </span>
      </div>

      <div className="grid min-w-0 bg-white sm:grid-cols-[10rem_minmax(0,1fr)]">
        <aside className="hidden border-r border-slate-200 bg-slate-50 p-3 sm:block">
          <div className="space-y-1">
            {sidebarItems.map(([label, Icon], index) => (
              <div
                key={label}
                className={`flex items-center gap-2 rounded-md px-3 py-2 text-xs font-semibold ${
                  index === 0 ? "bg-slate-950 text-white" : "text-slate-600"
                }`}
              >
                <Icon size={15} />
                <span>{label}</span>
              </div>
            ))}
          </div>
          <div className="mt-5 rounded-lg border border-slate-200 bg-white p-3">
            <p className="text-xs font-semibold text-slate-500">Plan access</p>
            <p className="mt-2 text-lg font-semibold text-slate-950">Ultra</p>
            <div className="mt-3 h-2 rounded-full bg-slate-100">
              <div className="h-2 w-4/5 rounded-full bg-emerald-500" />
            </div>
          </div>
        </aside>

        <div className="min-w-0 p-3 sm:p-4">
          <div className="flex flex-col gap-3 border-b border-slate-200 pb-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-semibold text-emerald-700">Today</p>
              <h2 className="mt-1 text-xl font-semibold text-slate-950">Business command center</h2>
            </div>
            <div className="grid grid-cols-2 gap-2 text-center text-xs sm:grid-cols-3">
              {[
                ["128", "Invoices"],
                ["42", "Tasks"],
                ["16", "Bookings"],
              ].map(([value, label]) => (
                <div key={label} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                  <p className="font-semibold text-slate-950">{value}</p>
                  <p className="mt-1 text-slate-500">{label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 grid gap-3 lg:grid-cols-[1fr_0.85fr]">
            <div className="rounded-lg border border-slate-200 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold text-slate-500">Revenue pipeline</p>
                  <p className="mt-2 text-2xl font-semibold text-slate-950">
                    <CurrencyAmount usd={48200} compact />
                  </p>
                </div>
                <span className="rounded-md bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700">
                  +18%
                </span>
              </div>
              <div className="mt-5 flex h-28 items-end gap-2">
                {[42, 68, 54, 80, 61, 88, 74, 96].map((height, index) => (
                  <div key={index} className="flex flex-1 items-end rounded-md bg-slate-100">
                    <div
                      className={`w-full rounded-md ${index > 4 ? "bg-emerald-500" : "bg-sky-500"}`}
                      style={{ height: `${height}%` }}
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-lg border border-slate-200 p-4">
              <p className="text-xs font-semibold text-slate-500">Finance pulse</p>
              <div className="mt-4 space-y-3 text-sm">
                {[
                  ["Income", 18400, "bg-emerald-500"],
                  ["Expenses", 6120, "bg-amber-500"],
                  ["Profit", 12280, "bg-sky-500"],
                ].map(([label, amount, color]) => (
                  <div key={String(label)}>
                    <div className="flex justify-between gap-3">
                      <span className="text-slate-600">{label}</span>
                      <span className="font-semibold text-slate-950">
                        <CurrencyAmount usd={Number(amount)} />
                      </span>
                    </div>
                    <div className="mt-1 h-2 rounded-full bg-slate-100">
                      <div className={`h-2 rounded-full ${color}`} style={{ width: label === "Expenses" ? "42%" : "76%" }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-3 rounded-lg border border-slate-200">
            {activity.map(([title, time, tag]) => (
              <div key={title} className="grid grid-cols-[1fr_auto] gap-3 border-b border-slate-100 px-4 py-3 text-sm last:border-b-0">
                <div className="min-w-0">
                  <p className="truncate font-semibold text-slate-800">{title}</p>
                  <p className="mt-1 text-xs text-slate-500">{time}</p>
                </div>
                <span className="self-center rounded-md bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600">
                  {tag}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <main className="min-h-screen overflow-x-hidden bg-slate-50 text-slate-950">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur-xl">
        <nav className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
          <Link href="/" className="flex min-w-0 items-center gap-3 rounded-lg px-1 py-1 font-semibold text-slate-950">
            <Image
              src="/logo.png"
              alt="Comvexa logo"
              width={42}
              height={42}
              className="size-10 rounded-lg object-contain"
              priority
            />
            <span className="truncate text-lg">Comvexa</span>
          </Link>

          <div className="hidden items-center gap-6 text-sm font-semibold text-slate-600 lg:flex">
            {navLinks.map((link) => (
              <a key={link.href} href={link.href} className="hover:text-slate-950">
                <HomeText id={link.textId} />
              </a>
            ))}
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <div className="hidden items-center gap-2 md:flex">
              <CurrencySelector tone="light" />
              <LanguageSelector tone="light" />
            </div>
            <Link href="/login" className="hidden rounded-md px-3 py-2 text-sm font-semibold text-slate-600 hover:text-slate-950 sm:inline-flex">
              <HomeText id="login" />
            </Link>
            <Link
              href="/register"
              className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-slate-950 px-4 text-sm font-semibold text-white shadow-lg shadow-slate-300/70 hover:bg-slate-800"
            >
              <span className="hidden sm:inline">
                <HomeText id="startTrial" />
              </span>
              <span className="sm:hidden">Start</span>
              <ArrowRight size={16} />
            </Link>
          </div>
        </nav>
      </header>

      <section className="relative overflow-hidden border-b border-slate-200 bg-[linear-gradient(180deg,#f8fbff_0%,#eef6ff_58%,#ffffff_100%)]">
        <div
          className="absolute inset-0 opacity-60"
          style={{
            backgroundImage:
              "linear-gradient(rgba(15, 23, 42, 0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(15, 23, 42, 0.06) 1px, transparent 1px)",
            backgroundSize: "56px 56px",
          }}
          aria-hidden="true"
        />
        <div className="relative mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8 lg:py-16">
          <div className="grid min-w-0 items-center gap-10 lg:grid-cols-[0.82fr_1.18fr]">
            <div className="min-w-0">
              <p className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm">
                <Sparkles size={16} className="text-emerald-600" />
                <HomeText id="eyebrow" />
              </p>
              <h1 className="mt-5 text-5xl font-semibold leading-none text-slate-950 sm:text-6xl lg:text-7xl">
                Comvexa
              </h1>
              <p className="mt-5 max-w-2xl text-2xl font-semibold leading-tight text-slate-900 sm:text-3xl">
                <HomeText id="headline" />
              </p>
              <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
                Company management software for customers, staff, bookings,
                invoices, payments, documents, inventory, branches, reports,
                approvals, and everyday operational control.
              </p>

              <div className="mt-6 flex flex-wrap gap-2">
                {heroModules.map((item) => {
                  const Icon = item.icon;

                  return (
                    <span key={item.label} className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700">
                      <Icon size={15} className="text-sky-600" />
                      {item.label}
                    </span>
                  );
                })}
              </div>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/register"
                  className="inline-flex items-center justify-center gap-2 rounded-md bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-200 hover:bg-emerald-700"
                >
                  <HomeText id="createWorkspace" />
                  <ArrowRight size={17} />
                </Link>
                <a
                  href="#platform"
                  className="inline-flex items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-800 hover:border-slate-400 hover:bg-slate-50"
                >
                  <HomeText id="explorePlatform" />
                  <ChevronRight size={17} />
                </a>
              </div>

              <dl className="mt-8 grid max-w-2xl grid-cols-2 gap-3 sm:grid-cols-4">
                {proofPoints.map(([value, label]) => (
                  <div key={label} className="border-l border-slate-300 pl-3">
                    <dt className="text-xl font-semibold text-slate-950">{value}</dt>
                    <dd className="mt-1 text-sm text-slate-600">{label}</dd>
                  </div>
                ))}
              </dl>
            </div>

            <ProductPreview />
          </div>
        </div>
      </section>

      <section className="border-b border-slate-200 bg-white px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-3 md:grid-cols-3">
          {trustSignals.map((item) => {
            const Icon = item.icon;

            return (
              <div key={item.title} className="flex gap-3 rounded-lg border border-slate-200 bg-white p-4">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-slate-950 text-white">
                  <Icon size={18} />
                </span>
                <div>
                  <h2 className="font-semibold text-slate-950">{item.title}</h2>
                  <p className="mt-1 text-sm leading-6 text-slate-600">{item.text}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section id="platform" className="px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-8 lg:grid-cols-[0.82fr_1.18fr] lg:items-end">
            <div>
              <p className="text-sm font-semibold text-emerald-700">Platform</p>
              <h2 className="mt-3 max-w-3xl text-3xl font-semibold leading-tight text-slate-950 sm:text-4xl">
                One workspace for the work that usually gets scattered.
              </h2>
              <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">
                Comvexa brings operating data, finance records, staff activity,
                documents, stock, reports, and access control into one business
                system that can scale from a simple company to a branch network.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {workspaceLanes.map((lane) => {
                const Icon = lane.icon;

                return (
                  <div key={lane.title} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/60">
                    <div className="flex items-center gap-3">
                      <span className="flex size-10 items-center justify-center rounded-md bg-sky-50 text-sky-700">
                        <Icon size={19} />
                      </span>
                      <h3 className="font-semibold text-slate-950">{lane.title}</h3>
                    </div>
                    <p className="mt-3 text-sm leading-6 text-slate-600">{lane.text}</p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {lane.items.map((item) => (
                        <span key={item} className="rounded-md bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600">
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {modules.map((module) => {
              const Icon = module.icon;

              return (
                <div key={module.title} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/60">
                  <Icon size={21} className="text-emerald-700" />
                  <h3 className="mt-4 font-semibold text-slate-950">{module.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{module.text}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section id="accounting" className="border-y border-slate-200 bg-white px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
          <div>
            <p className="text-sm font-semibold text-emerald-700">Finance and accounting</p>
            <h2 className="mt-3 max-w-3xl text-3xl font-semibold leading-tight text-slate-950 sm:text-4xl">
              Know what was billed, paid, owed, spent, approved, and left open.
            </h2>
            <p className="mt-4 text-base leading-7 text-slate-600">
              Comvexa is built for operational accounting workflows. Your team
              can issue invoices, record payments, manage expenses, monitor
              supplier bills, and review cash flow without separating the work
              from the records.
            </p>
            <div className="mt-6 grid gap-3">
              {financeStack.map(([title, text]) => (
                <div key={title} className="flex gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <Check className="mt-0.5 shrink-0 text-emerald-700" size={18} />
                  <div>
                    <h3 className="font-semibold text-slate-950">{title}</h3>
                    <p className="mt-1 text-sm leading-6 text-slate-600">{text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-slate-950 p-4 text-white shadow-2xl shadow-slate-300/70">
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                ["Invoices", "128 open and paid records", ReceiptText],
                ["Payments", "Cards, bank, cash, and notes", CreditCard],
                ["Supplier bills", "Due dates and approval status", Landmark],
                ["Recurring work", "Subscriptions and repeat invoices", Repeat],
              ].map(([title, text, Icon]) => (
                <div key={String(title)} className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
                  <Icon size={21} className="text-emerald-300" />
                  <h3 className="mt-4 font-semibold">{String(title)}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-300">{String(text)}</p>
                </div>
              ))}
            </div>
            <div className="mt-3 rounded-lg border border-white/10 bg-white/[0.04] p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-300">This month</p>
                  <p className="mt-1 text-3xl font-semibold">
                    <CurrencyAmount usd={62450} compact />
                  </p>
                </div>
                <span className="rounded-md bg-emerald-400/10 px-3 py-1 text-sm font-semibold text-emerald-200">
                  Reconciled
                </span>
              </div>
              <div className="mt-5 grid gap-2 text-sm">
                {[
                  ["Collected", "82%", "bg-emerald-400"],
                  ["Outstanding", "14%", "bg-sky-400"],
                  ["Overdue", "4%", "bg-amber-300"],
                ].map(([label, value, color]) => (
                  <div key={label} className="grid grid-cols-[6rem_1fr_3rem] items-center gap-3">
                    <span className="text-slate-300">{label}</span>
                    <span className="h-2 rounded-full bg-white/10">
                      <span className={`block h-2 rounded-full ${color}`} style={{ width: value }} />
                    </span>
                    <span className="text-right font-semibold">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold text-emerald-700">Workflow</p>
            <h2 className="mt-3 text-3xl font-semibold leading-tight text-slate-950 sm:text-4xl">
              From the first record to the final report.
            </h2>
          </div>
          <div className="mt-8 grid gap-3 md:grid-cols-4">
            {workflowSteps.map(([step, title, text]) => (
              <div key={step} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/60">
                <span className="text-sm font-semibold text-emerald-700">{step}</span>
                <h3 className="mt-4 font-semibold text-slate-950">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="pricing" className="border-y border-slate-200 bg-white px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-sm font-semibold text-emerald-700">Pricing</p>
            <h2 className="mt-3 text-3xl font-semibold leading-tight text-slate-950 sm:text-4xl">
              Choose the operating system your company needs now.
            </h2>
            <p className="mt-4 text-base leading-7 text-slate-600">
              Start with essentials, add staff and scheduling, or unlock the
              full multi-branch control layer with Ultra.
            </p>
          </div>
          <PricingCards plans={plans} />
        </div>
      </section>

      <section className="px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.82fr_1.18fr]">
          <div>
            <p className="text-sm font-semibold text-emerald-700">Security and readiness</p>
            <h2 className="mt-3 text-3xl font-semibold leading-tight text-slate-950 sm:text-4xl">
              Built like business software, not a spreadsheet dressed up as an app.
            </h2>
            <p className="mt-4 text-base leading-7 text-slate-600">
              Plan-based access, company-separated records, secure document
              workflows, global settings, white-label options, and audit-ready
              controls are part of the product direction from the beginning.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              ["Access control", "Roles, permissions, plans, and module visibility.", LockKeyhole],
              ["Approval workflows", "Review sensitive work before it moves forward.", ClipboardCheck],
              ["AI support", "Ask questions about plans, settings, invoices, and modules.", Bot],
              ["Data import", "Bring business records into the workspace as you grow.", UploadCloud],
            ].map(([title, text, Icon]) => (
              <div key={String(title)} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/60">
                <Icon size={21} className="text-sky-700" />
                <h3 className="mt-4 font-semibold text-slate-950">{String(title)}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{String(text)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="faq" className="border-y border-slate-200 bg-white px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <div className="text-center">
            <p className="text-sm font-semibold text-emerald-700">FAQ</p>
            <h2 className="mt-3 text-3xl font-semibold leading-tight text-slate-950 sm:text-4xl">
              Questions before you start?
            </h2>
          </div>
          <div className="mt-8 grid gap-3 md:grid-cols-2">
            {faqs.map((faq) => (
              <div key={faq.question} className="rounded-lg border border-slate-200 bg-white p-5">
                <h3 className="font-semibold text-slate-950">{faq.question}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-600">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-slate-950 px-4 py-14 text-white sm:px-6 sm:py-20 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[1fr_0.8fr] lg:items-center">
          <div>
            <p className="inline-flex items-center gap-2 rounded-md bg-white/10 px-3 py-2 text-sm font-semibold text-emerald-200">
              <BadgeCheck size={16} />
              Start with your company workspace
            </p>
            <h2 className="mt-5 max-w-3xl text-3xl font-semibold leading-tight sm:text-4xl">
              Sign up, choose a plan, complete payment setup, then open the dashboard.
            </h2>
            <p className="mt-4 max-w-2xl text-base leading-7 text-slate-300">
              Comvexa can start simple, then expand into accounting, operations,
              documents, inventory, permissions, automation, branches, and reports.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row lg:justify-end">
            <Link
              href="/register"
              className="inline-flex items-center justify-center gap-2 rounded-md bg-emerald-500 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-600"
            >
              Create account
              <ArrowRight size={17} />
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center justify-center rounded-md border border-white/20 px-5 py-3 text-sm font-semibold text-white hover:bg-white/10"
            >
              Login
            </Link>
          </div>
        </div>
      </section>

      <footer className="bg-white px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-8 border-b border-slate-200 pb-8 md:grid-cols-[1.2fr_1fr_1fr_1fr]">
          <div>
            <Link href="/" className="flex items-center gap-3 font-semibold text-slate-950">
              <Image
                src="/logo.png"
                alt="Comvexa logo"
                width={44}
                height={44}
                className="size-11 rounded-lg object-contain"
              />
              <span className="text-xl">Comvexa</span>
            </Link>
            <p className="mt-4 max-w-md text-sm leading-6 text-slate-600">
              Global company management software for operations, finance,
              documents, inventory, branches, permissions, and reports.
            </p>
          </div>
          {[
            ["Platform", ["Operations workspace", "Accounting tools", "Reports", "AI assistant"]],
            ["Account", ["Login", "Register", "Dashboard", "Contact Us"]],
            ["Legal", ["Privacy Policy", "Terms of Service", "Refund Policy", "Cookie Policy"]],
          ].map(([title, links]) => (
            <div key={String(title)}>
              <h3 className="font-semibold text-slate-950">{String(title)}</h3>
              <div className="mt-4 grid gap-3 text-sm text-slate-600">
                {(links as string[]).map((item) => {
                  const href =
                    item === "Login"
                      ? "/login"
                      : item === "Register"
                        ? "/register"
                        : item === "Dashboard"
                          ? "/dashboard"
                          : item === "Contact Us"
                            ? "/contact"
                            : item === "Privacy Policy"
                              ? "/privacy"
                              : item === "Terms of Service"
                                ? "/terms"
                                : item === "Refund Policy"
                                  ? "/refund"
                                  : item === "Cookie Policy"
                                    ? "/cookies"
                                    : "#platform";

                  return href.startsWith("/") ? (
                    <Link key={item} href={href} className="hover:text-slate-950">
                      {item}
                    </Link>
                  ) : (
                    <a key={item} href={href} className="hover:text-slate-950">
                      {item}
                    </a>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
        <div className="mx-auto flex max-w-7xl flex-col gap-3 pt-6 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <p>Copyright 2026 Comvexa. All rights reserved.</p>
          <div className="flex flex-wrap gap-2">
            {["Global SaaS", "Multi-company", "Plan-based access"].map((item) => (
              <span key={item} className="rounded-md bg-slate-100 px-3 py-1 font-semibold text-slate-600">
                {item}
              </span>
            ))}
          </div>
        </div>
      </footer>
    </main>
  );
}
