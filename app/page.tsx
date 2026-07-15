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
  Layers3,
  LineChart,
  ListChecks,
  LockKeyhole,
  ReceiptText,
  ShieldCheck,
  Sparkles,
  Users,
  WalletCards,
  Workflow,
} from "lucide-react";
import { CurrencyAmount, CurrencySelector } from "./_components/currency-display";
import { HomeText, LanguageSelector } from "./_components/language-display";
import { PricingCards } from "./_components/pricing-cards";
import { comvexaPrices } from "@/src/lib/pricing";

const modules = [
  { title: "Customers", text: "Profiles, balances, notes, history, and every conversation in one place.", icon: Users, tone: "coral" },
  { title: "Employees", text: "Roles, salaries, schedules, and clear team accountability.", icon: Building2, tone: "sun" },
  { title: "Bookings", text: "Appointments, field work, service times, and daily planning.", icon: CalendarDays, tone: "aqua" },
  { title: "Tasks", text: "Priorities, owners, due dates, and everyday follow-up.", icon: ListChecks, tone: "navy" },
  { title: "Invoices", text: "Professional invoices, totals, due dates, and payment status.", icon: ReceiptText, tone: "aqua" },
  { title: "Payments", text: "Collection methods, payment dates, notes, and reconciliation.", icon: CreditCard, tone: "coral" },
  { title: "Expenses", text: "Vendors, categories, tax fields, and business cost tracking.", icon: HandCoins, tone: "sun" },
  { title: "Documents", text: "PDF storage, expiry dates, file types, and secure records.", icon: FileText, tone: "navy" },
  { title: "Inventory", text: "Stock, suppliers, units, valuation, and low-stock alerts.", icon: Boxes, tone: "coral" },
  { title: "Branches", text: "Locations, branch performance, teams, and local settings.", icon: Layers3, tone: "aqua" },
  { title: "Permissions", text: "The right access for staff, managers, and administrators.", icon: LockKeyhole, tone: "sun" },
  { title: "Reports", text: "Revenue, expenses, cash flow, activity, and profit or loss.", icon: BarChart3, tone: "navy" },
];

const plans = [
  {
    name: "Basic",
    monthlyPriceUsd: comvexaPrices.Basic.monthly,
    yearlyPriceUsd: comvexaPrices.Basic.yearly,
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
    monthlyPriceUsd: comvexaPrices.Pro.monthly,
    yearlyPriceUsd: comvexaPrices.Pro.yearly,
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
    monthlyPriceUsd: comvexaPrices.Ultra.monthly,
    yearlyPriceUsd: comvexaPrices.Ultra.yearly,
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
    answer: "Yes. Comvexa is flexible enough for service businesses, retailers, agencies, clinics, contractors, salons, maintenance teams, and field operations.",
  },
  {
    question: "Is company data separated?",
    answer: "Yes. Operational records are designed around company workspaces, keeping each business's customers, invoices, documents, and settings separate.",
  },
  {
    question: "Does Comvexa include accounting tools?",
    answer: "Comvexa includes invoices, payments, expenses, supplier bills, tax fields, receivables, cash flow, and profit or loss summaries for operational accounting.",
  },
  {
    question: "Which plan has a free trial?",
    answer: "Pro includes a 3-day free trial, Ultra includes a 7-day free trial, and Basic starts as a paid plan without a trial.",
  },
];

function ProductCockpit() {
  const activity = [
    { title: "Invoice CX-2044 paid", meta: "2 min ago", color: "bg-[#39d9c6]" },
    { title: "New booking assigned", meta: "18 min ago", color: "bg-[#ff7757]" },
    { title: "Supplier bill approved", meta: "42 min ago", color: "bg-[#ffc857]" },
  ];

  return (
    <div className="summer-cockpit-wrap relative mx-auto min-w-0 w-full max-w-[42rem] lg:max-w-none">
      <div className="summer-float-card summer-float-card-one" aria-hidden="true">
        <span className="grid size-9 place-items-center rounded-full bg-[#d9fff8] text-[#087468]">
          <LineChart size={17} />
        </span>
        <span>
          <strong className="block text-sm text-[#073d47]">+18.4%</strong>
          <span className="text-[11px] text-slate-500">this month</span>
        </span>
      </div>

      <div className="summer-float-card summer-float-card-two" aria-hidden="true">
        <span className="size-2.5 rounded-full bg-[#ff7757]" />
        <span className="text-xs font-bold text-[#073d47]">42 tasks cleared</span>
      </div>

      <div className="summer-cockpit relative overflow-hidden rounded-[1.5rem] border border-white/60 bg-[#fffdf8] p-2 shadow-[0_35px_90px_rgba(4,57,68,0.28)] sm:rounded-[2rem] sm:p-3">
        <div className="overflow-hidden rounded-[1.1rem] border border-[#0c5964]/10 bg-white sm:rounded-[1.5rem]">
          <div className="flex items-center justify-between bg-[#073d47] px-4 py-3.5 text-white sm:px-5">
            <div className="flex items-center gap-3">
              <Image
                src="/logo.png"
                alt=""
                width={36}
                height={36}
                className="size-8 rounded-lg bg-white object-contain p-1 sm:size-9"
              />
              <div>
                <p className="text-xs font-bold sm:text-sm">Comvexa workspace</p>
                <p className="text-[10px] text-white/55 sm:text-[11px]">Your business, live</p>
              </div>
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 text-[10px] font-bold text-[#8ef0df] ring-1 ring-white/10 sm:px-3 sm:text-[11px]">
              <span className="size-1.5 rounded-full bg-[#55e6ce]" />
              Live
            </span>
          </div>

          <div className="grid min-w-0 bg-[#fbf9f3] sm:grid-cols-[8.5rem_minmax(0,1fr)]">
            <aside className="hidden border-r border-[#0c5964]/10 bg-[#f6f2e8] p-3 sm:block">
              {["Overview", "Customers", "Invoices", "Tasks", "Reports"].map((item, index) => (
                <div
                  key={item}
                  className={`mb-1.5 rounded-xl px-3 py-2 text-[11px] font-bold ${
                    index === 0 ? "bg-[#ff7757] text-white shadow-md shadow-orange-200" : "text-[#45656b]"
                  }`}
                >
                  {item}
                </div>
              ))}
            </aside>

            <div className="min-w-0 p-3 sm:p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#0c8b84]">Today</p>
                  <h2 className="mt-1 text-base font-bold tracking-[-0.03em] text-[#073d47] sm:text-xl">Good morning, Maya</h2>
                </div>
                <span className="rounded-full bg-[#fff0ba] px-2.5 py-1 text-[10px] font-bold text-[#865c00]">All clear</span>
              </div>

              <div className="mt-4 grid min-w-0 grid-cols-3 gap-2 sm:gap-3">
                {[
                  { label: "Revenue", value: <CurrencyAmount usd={48200} compact />, accent: "bg-[#39d9c6]" },
                  { label: "Invoices", value: "128", accent: "bg-[#ff7757]" },
                  { label: "Bookings", value: "16", accent: "bg-[#ffc857]" },
                ].map((stat) => (
                  <div key={stat.label} className="min-w-0 rounded-xl border border-[#0c5964]/10 bg-white p-2.5 sm:rounded-2xl sm:p-3.5">
                    <span className={`mb-2 block h-1 w-6 rounded-full ${stat.accent}`} />
                    <p className="truncate text-sm font-black tracking-[-0.03em] text-[#073d47] sm:text-lg">{stat.value}</p>
                    <p className="mt-0.5 truncate text-[9px] text-slate-500 sm:text-[11px]">{stat.label}</p>
                  </div>
                ))}
              </div>

              <div className="mt-3 grid gap-3 md:grid-cols-[1.15fr_0.85fr]">
                <div className="min-w-0 overflow-hidden rounded-xl border border-[#0c5964]/10 bg-white p-3 sm:rounded-2xl sm:p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[10px] text-slate-500">Revenue flow</p>
                      <p className="mt-0.5 text-sm font-black text-[#073d47]"><CurrencyAmount usd={48200} compact /></p>
                    </div>
                    <span className="rounded-full bg-[#dffff8] px-2 py-1 text-[9px] font-bold text-[#087468]">+18%</span>
                  </div>
                  <svg viewBox="0 0 240 78" className="mt-2 h-14 min-w-0 w-full sm:h-16" aria-hidden="true">
                    <defs>
                      <linearGradient id="summer-chart-fill" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0%" stopColor="#39d9c6" stopOpacity="0.38" />
                        <stop offset="100%" stopColor="#39d9c6" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    <path d="M0 64 C22 57 30 64 49 50 S82 38 99 46 S128 54 145 31 S177 25 193 14 S222 19 240 4 L240 78 L0 78 Z" fill="url(#summer-chart-fill)" />
                    <path d="M0 64 C22 57 30 64 49 50 S82 38 99 46 S128 54 145 31 S177 25 193 14 S222 19 240 4" fill="none" stroke="#10a99e" strokeWidth="4" strokeLinecap="round" />
                  </svg>
                </div>

                <div className="hidden rounded-2xl bg-[#073d47] p-4 text-white md:block">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold">Cash flow</p>
                    <WalletCards size={15} className="text-[#ffc857]" />
                  </div>
                  <div className="mt-4 space-y-3 text-[10px]">
                    <div className="flex justify-between text-white/60"><span>Income</span><strong className="text-white"><CurrencyAmount usd={18400} /></strong></div>
                    <div className="flex justify-between text-white/60"><span>Expenses</span><strong className="text-white"><CurrencyAmount usd={6120} /></strong></div>
                    <div className="border-t border-white/10 pt-3">
                      <div className="flex justify-between"><span className="text-white/60">Profit</span><strong className="text-[#8ef0df]"><CurrencyAmount usd={12280} /></strong></div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-3 hidden rounded-2xl border border-[#0c5964]/10 bg-white sm:block">
                {activity.map((item) => (
                  <div key={item.title} className="flex items-center justify-between border-b border-[#0c5964]/10 px-4 py-2.5 last:border-0">
                    <div className="flex items-center gap-2.5">
                      <span className={`size-2 rounded-full ${item.color}`} />
                      <span className="text-[10px] font-bold text-[#284f56]">{item.title}</span>
                    </div>
                    <span className="text-[9px] text-slate-400">{item.meta}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <div className="comvexa-landing min-h-screen overflow-hidden bg-[#fffaf0] text-[#073d47]">
      <a href="#main-content" className="fixed left-4 top-3 z-[100] -translate-y-24 rounded-full bg-[#073d47] px-5 py-3 text-sm font-black text-white shadow-xl transition focus:translate-y-0">
        Skip to content
      </a>
      <header className="sticky top-0 z-50 border-b border-[#073d47]/10 bg-[#fffaf0]/88 backdrop-blur-xl">
        <nav aria-label="Primary" className="mx-auto flex h-[4.6rem] max-w-7xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
          <Link href="/" className="group flex min-w-0 items-center gap-2.5" aria-label="Comvexa home">
            <span className="relative grid size-10 shrink-0 place-items-center overflow-hidden rounded-[0.9rem] bg-white shadow-sm ring-1 ring-[#073d47]/10">
              <Image src="/logo.png" alt="" width={40} height={40} className="size-full object-contain p-1" priority />
            </span>
            <span className="text-lg font-black tracking-[-0.04em] text-[#073d47] sm:text-xl">Comvexa</span>
            <span className="hidden rounded-full bg-[#fff0ba] px-2 py-1 text-[9px] font-black uppercase tracking-[0.15em] text-[#865c00] lg:inline">Summer 26</span>
          </Link>

          <div className="hidden items-center gap-7 text-sm font-bold text-[#41656b] md:flex">
            <a href="#platform" className="transition hover:text-[#ff6547]"><HomeText id="platform" /></a>
            <a href="#accounting" className="transition hover:text-[#ff6547]"><HomeText id="accounting" /></a>
            <a href="#pricing" className="transition hover:text-[#ff6547]"><HomeText id="pricing" /></a>
            <a href="#faq" className="transition hover:text-[#ff6547]"><HomeText id="faq" /></a>
          </div>

          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <div className="hidden items-center gap-2 lg:flex">
              <CurrencySelector tone="light" />
              <LanguageSelector tone="light" />
            </div>
            <Link href="/login" className="hidden px-2 text-sm font-bold text-[#41656b] transition hover:text-[#073d47] sm:inline">
              <HomeText id="login" />
            </Link>
            <Link href="/register" className="inline-flex items-center justify-center gap-2 rounded-full bg-[#c7432f] px-4 py-2.5 text-xs font-black text-white shadow-[0_10px_25px_rgba(199,67,47,0.28)] transition hover:-translate-y-0.5 hover:bg-[#ad3524] sm:px-5 sm:text-sm">
              <span className="hidden sm:inline"><HomeText id="startTrial" /></span>
              <span className="sm:hidden">Start free</span>
              <ArrowRight size={15} />
            </Link>
          </div>
        </nav>
      </header>

      <main id="main-content">
      <section className="summer-2026-hero relative isolate">
        <div className="summer-2026-sun" aria-hidden="true"><span /></div>
        <div className="summer-2026-orbit summer-2026-orbit-one" aria-hidden="true" />
        <div className="summer-2026-orbit summer-2026-orbit-two" aria-hidden="true" />
        <div className="summer-2026-grain" aria-hidden="true" />

        <div className="relative z-10 mx-auto grid min-w-0 max-w-7xl items-center gap-12 px-4 pb-20 pt-12 sm:px-6 sm:pb-28 sm:pt-16 lg:grid-cols-[0.88fr_1.12fr] lg:gap-14 lg:px-8 lg:pb-36 lg:pt-24">
          <div className="summer-2026-reveal min-w-0">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#073d47]/10 bg-white/75 px-3.5 py-2 text-[11px] font-black uppercase tracking-[0.16em] text-[#0b7773] shadow-sm backdrop-blur sm:text-xs">
              <Sparkles size={14} className="text-[#ff6547]" />
              <HomeText id="eyebrow" />
            </div>

            <h1 className="mt-6 max-w-3xl text-[3.25rem] font-black leading-[0.92] tracking-[-0.07em] text-[#073d47] sm:text-[4.75rem] lg:text-[5.8rem]">
              <HomeText id="headline" />
            </h1>
            <p className="mt-5 max-w-lg text-lg font-bold leading-7 text-[#ff6547] sm:text-xl">Less admin. More momentum.</p>
            <p className="mt-3 max-w-xl text-base leading-7 text-[#41656b] sm:text-lg sm:leading-8">
              <HomeText id="subhead" />
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/register" className="group inline-flex items-center justify-center gap-3 rounded-full bg-[#073d47] px-6 py-3.5 text-sm font-black text-white shadow-[0_18px_35px_rgba(7,61,71,0.24)] transition hover:-translate-y-1 hover:bg-[#0a505c]">
                <HomeText id="createWorkspace" />
                <span className="grid size-7 place-items-center rounded-full bg-[#ffc857] text-[#073d47] transition group-hover:translate-x-1"><ArrowRight size={15} /></span>
              </Link>
              <a href="#platform" className="inline-flex items-center justify-center gap-2 rounded-full border border-[#073d47]/15 bg-white/70 px-6 py-3.5 text-sm font-black text-[#073d47] backdrop-blur transition hover:-translate-y-1 hover:bg-white">
                <HomeText id="explorePlatform" />
                <ChevronRight size={16} />
              </a>
            </div>

            <div className="mt-8 flex flex-wrap gap-x-5 gap-y-2 text-xs font-bold text-[#41656b] sm:mt-10">
              {["No card to start", "Setup in minutes", "Cancel anytime"].map((item) => (
                <span key={item} className="inline-flex items-center gap-1.5"><Check size={14} className="text-[#0c9b90]" />{item}</span>
              ))}
            </div>
          </div>

          <div className="summer-2026-reveal summer-2026-reveal-delay min-w-0">
            <ProductCockpit />
          </div>
        </div>

        <div className="summer-2026-tide" aria-hidden="true" />
      </section>

      <section className="relative z-20 -mt-1 bg-[#073d47] text-white">
        <div className="mx-auto grid max-w-7xl divide-y divide-white/10 px-4 sm:grid-cols-2 sm:divide-x sm:divide-y-0 sm:px-6 lg:grid-cols-4 lg:px-8">
          {[
            ["28", "connected modules"],
            ["One", "clear company view"],
            ["Global", "currency ready"],
            ["7 days", "Ultra free trial"],
          ].map(([value, label]) => (
            <div key={label} className="flex items-center gap-3 px-3 py-5 sm:px-5 sm:py-6">
              <strong className="text-2xl font-black tracking-[-0.04em] text-[#ffc857]">{value}</strong>
              <span className="text-xs font-bold leading-5 text-white/60">{label}</span>
            </div>
          ))}
        </div>
      </section>

      <section id="platform" className="relative bg-[#fffaf0] px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-8 lg:grid-cols-[0.78fr_1.22fr] lg:items-end">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-[#ff6547]">One calm command center</p>
              <h2 className="mt-4 max-w-xl text-4xl font-black leading-[0.98] tracking-[-0.055em] text-[#073d47] sm:text-5xl">Every moving part, finally moving together.</h2>
            </div>
            <div className="lg:pb-1">
              <p className="max-w-2xl text-base leading-7 text-[#527078] sm:text-lg">Replace scattered tools and messy handoffs with one workspace for your customers, people, money, inventory, documents, and decisions.</p>
              <div className="mt-5 flex flex-wrap gap-2">
                {["Service teams", "Retail", "Agencies", "Clinics", "Contractors", "Multi-branch"].map((item) => (
                  <span key={item} className="rounded-full border border-[#073d47]/10 bg-white px-3 py-1.5 text-xs font-bold text-[#41656b]">{item}</span>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-12 grid gap-4 lg:grid-cols-12">
            <article className="summer-bento-card relative min-h-[25rem] overflow-hidden rounded-[2rem] bg-[#c94e38] p-6 text-white lg:col-span-7 lg:p-9">
              <div className="absolute -right-20 -top-20 size-72 rounded-full border-[3.5rem] border-white/10" aria-hidden="true" />
              <div className="relative z-10 max-w-xl">
                <span className="grid size-12 place-items-center rounded-2xl bg-white/15 ring-1 ring-white/20"><Workflow size={23} /></span>
                <p className="mt-8 text-xs font-black uppercase tracking-[0.2em] text-white/65">Daily operations</p>
                <h3 className="mt-3 text-3xl font-black tracking-[-0.045em] sm:text-4xl">Your whole day has one rhythm.</h3>
                <p className="mt-4 max-w-lg leading-7 text-white/75">Move from a new customer to a booked service, assigned task, paid invoice, and clear report without losing the thread.</p>
              </div>
              <div className="relative z-10 mt-9 grid gap-2 sm:grid-cols-2">
                {["Bookings assigned", "Tasks in progress", "Customers updated", "Schedules aligned"].map((item, index) => (
                  <div key={item} className="flex items-center justify-between rounded-2xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur">
                    <span className="text-sm font-bold">{item}</span>
                    <span className="grid size-7 place-items-center rounded-full bg-white text-[10px] font-black text-[#ff6547]">{index + 1}</span>
                  </div>
                ))}
              </div>
            </article>

            <article className="summer-bento-card relative overflow-hidden rounded-[2rem] bg-[#073d47] p-6 text-white lg:col-span-5 lg:p-9">
              <div className="absolute -bottom-14 -right-12 size-48 rounded-full bg-[#39d9c6]/15 blur-2xl" aria-hidden="true" />
              <span className="grid size-12 place-items-center rounded-2xl bg-[#39d9c6]/15 text-[#8ef0df] ring-1 ring-[#8ef0df]/15"><WalletCards size={23} /></span>
              <p className="mt-8 text-xs font-black uppercase tracking-[0.2em] text-[#8ef0df]">Money clarity</p>
              <h3 className="mt-3 text-3xl font-black tracking-[-0.045em]">Know the numbers before they become questions.</h3>
              <div className="mt-8 rounded-2xl bg-white/[0.07] p-4 ring-1 ring-white/10">
                <div className="flex items-end justify-between">
                  <div><p className="text-xs text-white/50">Net cash flow</p><p className="mt-1 text-2xl font-black"><CurrencyAmount usd={32780} compact /></p></div>
                  <span className="rounded-full bg-[#39d9c6]/15 px-3 py-1 text-xs font-black text-[#8ef0df]">Healthy</span>
                </div>
                <div className="mt-5 flex h-20 items-end gap-2" aria-hidden="true">
                  {[32, 48, 42, 64, 56, 78, 92, 82, 100].map((height, index) => (
                    <span key={`${height}-${index}`} className={`flex-1 rounded-t-md ${index > 6 ? "bg-[#ffc857]" : "bg-[#39d9c6]"}`} style={{ height: `${height}%`, opacity: 0.48 + index * 0.05 }} />
                  ))}
                </div>
              </div>
            </article>

            <article className="summer-bento-card rounded-[2rem] border border-[#073d47]/10 bg-[#fff0ba] p-6 lg:col-span-4 lg:p-8">
              <span className="grid size-11 place-items-center rounded-2xl bg-[#073d47] text-[#ffc857]"><Users size={21} /></span>
              <h3 className="mt-7 text-2xl font-black tracking-[-0.04em]">People know what is next.</h3>
              <p className="mt-3 text-sm leading-6 text-[#52686b]">Schedules, roles, bookings, tasks, and performance stay visible to the right people.</p>
            </article>

            <article className="summer-bento-card rounded-[2rem] border border-[#073d47]/10 bg-[#dffff8] p-6 lg:col-span-4 lg:p-8">
              <span className="grid size-11 place-items-center rounded-2xl bg-[#0c8b84] text-white"><Boxes size={21} /></span>
              <h3 className="mt-7 text-2xl font-black tracking-[-0.04em]">Stock stays one step ahead.</h3>
              <p className="mt-3 text-sm leading-6 text-[#52686b]">Track inventory, suppliers, purchase orders, branches, and low-stock alerts.</p>
            </article>

            <article className="summer-bento-card rounded-[2rem] border border-[#073d47]/10 bg-white p-6 lg:col-span-4 lg:p-8">
              <span className="grid size-11 place-items-center rounded-2xl bg-[#ff7757]/10 text-[#ff6547]"><ShieldCheck size={21} /></span>
              <h3 className="mt-7 text-2xl font-black tracking-[-0.04em]">Control without friction.</h3>
              <p className="mt-3 text-sm leading-6 text-[#52686b]">Permissions, approvals, audit logs, and reports keep work moving safely.</p>
            </article>
          </div>
        </div>
      </section>

      <section className="border-y border-[#073d47]/10 bg-white px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-[#0c8b84]">Built around your business</p>
              <h2 className="mt-4 max-w-2xl text-4xl font-black leading-[1] tracking-[-0.055em] sm:text-5xl">Everything useful. Nothing scattered.</h2>
            </div>
            <Link href="/register" className="inline-flex items-center gap-2 text-sm font-black text-[#ff6547] hover:text-[#ef5135]">See it in your workspace <ArrowRight size={17} /></Link>
          </div>

          <div className="mt-12 grid gap-px overflow-hidden rounded-[2rem] border border-[#073d47]/10 bg-[#073d47]/10 sm:grid-cols-2 lg:grid-cols-4">
            {modules.map((module) => {
              const Icon = module.icon;
              const tone = {
                coral: "bg-[#fff0eb] text-[#ff6547]",
                sun: "bg-[#fff4c9] text-[#8a6500]",
                aqua: "bg-[#dffff8] text-[#0c8b84]",
                navy: "bg-[#e9f0ef] text-[#073d47]",
              }[module.tone];

              return (
                <article key={module.title} className="group bg-white p-6 transition hover:bg-[#fffaf0]">
                  <span className={`grid size-11 place-items-center rounded-2xl ${tone}`}><Icon size={20} /></span>
                  <h3 className="mt-5 text-base font-black text-[#073d47]">{module.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-[#617a7f]">{module.text}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section id="accounting" className="relative isolate overflow-hidden bg-[#073d47] px-4 py-20 text-white sm:px-6 sm:py-28 lg:px-8">
        <div className="summer-finance-glow" aria-hidden="true" />
        <div className="relative z-10 mx-auto grid max-w-7xl gap-14 lg:grid-cols-[0.88fr_1.12fr] lg:items-center">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-[#8ef0df]">Finance without the fog</p>
            <h2 className="mt-4 text-4xl font-black leading-[0.98] tracking-[-0.055em] sm:text-5xl">See what came in, what went out, and what comes next.</h2>
            <p className="mt-6 max-w-xl text-base leading-7 text-white/60 sm:text-lg">Invoices, payments, expenses, supplier bills, receivables, tax fields, cash flow, and profit or loss—connected to the work behind every number.</p>
            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              {[
                "Live receivables and invoice status",
                "Expenses, vendors, and supplier bills",
                "Cash flow and profit summaries",
                "Multi-currency business records",
              ].map((item) => (
                <div key={item} className="flex gap-2.5 rounded-2xl border border-white/10 bg-white/[0.05] p-4 text-sm font-bold text-white/75">
                  <Check size={16} className="mt-0.5 shrink-0 text-[#8ef0df]" />{item}
                </div>
              ))}
            </div>
          </div>

          <div className="relative rounded-[2rem] border border-white/15 bg-white/[0.07] p-3 shadow-[0_35px_90px_rgba(0,0,0,0.25)] backdrop-blur sm:p-5">
            <div className="rounded-[1.4rem] bg-[#fffaf0] p-5 text-[#073d47] sm:p-7">
              <div className="flex items-center justify-between gap-4">
                <div><p className="text-xs font-bold text-[#668086]">Financial pulse</p><p className="mt-1 text-2xl font-black tracking-[-0.04em]">A clear month at a glance</p></div>
                <span className="hidden rounded-full bg-[#dffff8] px-3 py-1.5 text-xs font-black text-[#0c8b84] sm:block">Live data</span>
              </div>
              <div className="mt-7 grid gap-3 sm:grid-cols-3">
                {[
                  { label: "Income", value: 18400, width: "w-[84%]", color: "bg-[#0caaa0]" },
                  { label: "Expenses", value: 6120, width: "w-[38%]", color: "bg-[#ff7757]" },
                  { label: "Profit", value: 12280, width: "w-[64%]", color: "bg-[#ffc857]" },
                ].map((item) => (
                  <div key={item.label} className="rounded-2xl border border-[#073d47]/10 bg-white p-4">
                    <p className="text-xs font-bold text-[#668086]">{item.label}</p>
                    <p className="mt-2 text-xl font-black"><CurrencyAmount usd={item.value} /></p>
                    <div className="mt-4 h-1.5 rounded-full bg-[#e9eeeb]"><div className={`h-full rounded-full ${item.width} ${item.color}`} /></div>
                  </div>
                ))}
              </div>
              <div className="mt-4 overflow-hidden rounded-2xl border border-[#073d47]/10 bg-white">
                {[
                  { title: "Invoice #CX-2044", status: "Paid", value: 4200 },
                  { title: "Monthly supplier bill", status: "Approved", value: -1180 },
                  { title: "Booking deposit", status: "Received", value: 860 },
                ].map((row) => (
                  <div key={row.title} className="grid grid-cols-[1fr_auto] items-center gap-3 border-b border-[#073d47]/10 px-4 py-3.5 last:border-0 sm:grid-cols-[1fr_auto_auto]">
                    <span className="text-sm font-black">{row.title}</span>
                    <span className="hidden rounded-full bg-[#f1f5f2] px-2.5 py-1 text-[10px] font-bold text-[#668086] sm:block">{row.status}</span>
                    <strong className={row.value > 0 ? "text-[#0c8b84]" : "text-[#ff6547]"}>{row.value > 0 ? "+" : "-"}<CurrencyAmount usd={Math.abs(row.value)} /></strong>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden bg-[#ffc857] px-4 py-20 sm:px-6 sm:py-24 lg:px-8">
        <div className="absolute -right-20 top-1/2 size-80 -translate-y-1/2 rounded-full border-[4rem] border-white/20" aria-hidden="true" />
        <div className="relative z-10 mx-auto max-w-7xl">
          <div className="max-w-3xl">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-[#8a5300]">A smoother operating day</p>
            <h2 className="mt-4 text-4xl font-black leading-[0.98] tracking-[-0.055em] text-[#073d47] sm:text-5xl">From first customer to final report, without the tool hopping.</h2>
          </div>
          <div className="mt-12 grid gap-3 md:grid-cols-4">
            {[
              ["01", "Create your space", "Choose a plan and shape the workspace around your company."],
              ["02", "Bring the business in", "Add customers, people, services, stock, and documents."],
              ["03", "Run the day", "Schedule work, assign tasks, invoice, collect, and follow up."],
              ["04", "See the whole picture", "Review cash flow, performance, approvals, and open work."],
            ].map(([step, title, text]) => (
              <article key={step} className="rounded-[1.75rem] border border-[#073d47]/10 bg-[#fff8d9]/80 p-6 backdrop-blur transition hover:-translate-y-1 hover:bg-white">
                <span className="text-xs font-black tracking-[0.18em] text-[#ff6547]">{step}</span>
                <h3 className="mt-8 text-xl font-black tracking-[-0.035em] text-[#073d47]">{title}</h3>
                <p className="mt-3 text-sm leading-6 text-[#5c6d6d]">{text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="pricing" className="summer-pricing relative isolate overflow-hidden bg-[#fffaf0] px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
        <div className="summer-pricing-orb" aria-hidden="true" />
        <div className="relative z-10 mx-auto max-w-7xl">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-[#ff6547]">Simple pricing</p>
            <h2 className="mt-4 text-4xl font-black leading-[0.98] tracking-[-0.055em] text-[#073d47] sm:text-5xl">Pick your pace. Grow when you are ready.</h2>
            <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-[#617a7f]">Start with the tools you need today. Pro includes a 3-day trial and Ultra includes a 7-day trial.</p>
          </div>
          <PricingCards plans={plans} />
        </div>
      </section>

      <section className="border-y border-[#073d47]/10 bg-white px-4 py-20 sm:px-6 sm:py-24 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[0.7fr_1.3fr] lg:items-center">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-[#0c8b84]">Confidence built in</p>
            <h2 className="mt-4 text-4xl font-black leading-[1] tracking-[-0.055em] text-[#073d47]">Bright outside. Serious underneath.</h2>
            <p className="mt-5 text-base leading-7 text-[#617a7f]">Comvexa is designed for real company operations, with separated workspaces, plan-based access, global settings, and secure document workflows.</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              { title: "Workspace separation", text: "Company records stay tied to the correct workspace.", icon: ShieldCheck },
              { title: "Global settings", text: "Currency, timezone, language, and branding controls.", icon: Globe2 },
              { title: "Plan-based access", text: "Teams see the modules included in their subscription.", icon: Layers3 },
              { title: "Document control", text: "Private company file storage and organized PDF records.", icon: FileText },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <article key={item.title} className="rounded-[1.75rem] border border-[#073d47]/10 bg-[#fffaf0] p-6">
                  <span className="grid size-10 place-items-center rounded-xl bg-[#dffff8] text-[#0c8b84]"><Icon size={19} /></span>
                  <h3 className="mt-5 font-black text-[#073d47]">{item.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-[#617a7f]">{item.text}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section id="faq" className="bg-[#f0fbf8] px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[0.65fr_1.35fr]">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-[#0c8b84]">Questions, answered</p>
            <h2 className="mt-4 text-4xl font-black leading-[1] tracking-[-0.055em] text-[#073d47] sm:text-5xl">A clear start should feel clear.</h2>
            <p className="mt-5 max-w-md text-base leading-7 text-[#617a7f]">The essentials before you create your Comvexa workspace.</p>
          </div>
          <div className="grid gap-3">
            {faqs.map((faq, index) => (
              <details key={faq.question} className="group rounded-2xl border border-[#073d47]/10 bg-white px-5 py-1 open:shadow-lg open:shadow-[#0c8b84]/5" open={index === 0}>
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-5 font-black text-[#073d47] [&::-webkit-details-marker]:hidden">
                  {faq.question}
                  <span className="grid size-8 shrink-0 place-items-center rounded-full bg-[#fff0ba] text-lg leading-none transition group-open:rotate-45">+</span>
                </summary>
                <p className="max-w-2xl pb-5 pr-10 text-sm leading-6 text-[#617a7f]">{faq.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#fffaf0] px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
        <div className="summer-final-cta relative mx-auto max-w-7xl overflow-hidden rounded-[2.25rem] px-6 py-12 text-white shadow-[0_35px_90px_rgba(7,61,71,0.22)] sm:px-10 sm:py-16 lg:px-16">
          <div className="summer-final-sun" aria-hidden="true" />
          <div className="relative z-10 max-w-3xl">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-[#fff0ba]">Your clearest workday starts here</p>
            <h2 className="mt-5 text-4xl font-black leading-[0.98] tracking-[-0.06em] sm:text-6xl">Put your business in the sunshine.</h2>
            <p className="mt-5 max-w-xl text-base leading-7 text-white/70 sm:text-lg">Create your workspace, choose your plan, and bring customers, people, operations, and money into one beautiful view.</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/register" className="inline-flex items-center justify-center gap-2 rounded-full bg-[#ffc857] px-6 py-3.5 text-sm font-black text-[#073d47] transition hover:-translate-y-1 hover:bg-[#ffd66f]">Start your workspace <ArrowRight size={17} /></Link>
              <Link href="/login" className="inline-flex items-center justify-center rounded-full border border-white/20 bg-white/10 px-6 py-3.5 text-sm font-black text-white backdrop-blur transition hover:bg-white/15">Login</Link>
            </div>
          </div>
        </div>
      </section>

      </main>

      <footer className="bg-[#052f37] px-4 pb-8 pt-14 text-white sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-10 border-b border-white/10 pb-12 md:grid-cols-[1.3fr_0.7fr_0.7fr]">
            <div>
              <Link href="/" className="flex items-center gap-3 font-black">
                <Image src="/logo.png" alt="" width={44} height={44} className="size-11 rounded-xl bg-white object-contain p-1" />
                <span className="text-xl tracking-[-0.04em]">Comvexa</span>
              </Link>
              <p className="mt-5 max-w-md text-sm leading-6 text-white/50">One clear workspace for customers, people, operations, finance, documents, inventory, branches, and reports.</p>
            </div>
            <div>
              <h3 className="text-sm font-black text-white">Explore</h3>
              <div className="mt-4 grid gap-3 text-sm text-white/50">
                <a href="#platform" className="hover:text-[#ffc857]">Platform</a>
                <a href="#accounting" className="hover:text-[#ffc857]">Accounting</a>
                <a href="#pricing" className="hover:text-[#ffc857]">Pricing</a>
                <a href="#faq" className="hover:text-[#ffc857]">FAQ</a>
              </div>
            </div>
            <div>
              <h3 className="text-sm font-black text-white">Company</h3>
              <div className="mt-4 grid gap-3 text-sm text-white/50">
                <Link href="/contact" className="hover:text-[#ffc857]">Contact</Link>
                <Link href="/privacy" className="hover:text-[#ffc857]">Privacy</Link>
                <Link href="/terms" className="hover:text-[#ffc857]">Terms</Link>
                <Link href="/refund" className="hover:text-[#ffc857]">Refunds</Link>
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-3 pt-6 text-xs text-white/35 sm:flex-row sm:items-center sm:justify-between">
            <p>Copyright 2026 Comvexa. All rights reserved.</p>
            <p>Built for businesses that are ready to flow.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
