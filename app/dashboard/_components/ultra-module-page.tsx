import { ArrowRight, CheckCircle2, LucideIcon } from "lucide-react";
import { PlanGate } from "./plan-gate";

type Highlight = {
  title: string;
  text: string;
};

type UltraModulePageProps = {
  moduleName: string;
  eyebrow: string;
  title: string;
  description: string;
  icon: LucideIcon;
  highlights: Highlight[];
  actions: string[];
};

export function UltraModulePage({
  moduleName,
  eyebrow,
  title,
  description,
  icon: Icon,
  highlights,
  actions,
}: UltraModulePageProps) {
  return (
    <PlanGate moduleName={moduleName}>
      <main className="mx-auto w-full max-w-[1500px] flex-1 p-4 sm:p-6">
        <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm shadow-slate-200/70">
          <div className="grid gap-0 xl:grid-cols-[1fr_360px]">
            <div className="bg-gradient-to-br from-white via-blue-50/70 to-emerald-50/70 p-6 sm:p-8">
              <p className="text-xs font-semibold uppercase tracking-widest text-blue-700">
                {eyebrow}
              </p>
              <h2 className="mt-3 max-w-3xl text-3xl font-semibold tracking-normal text-slate-950 sm:text-4xl">
                {title}
              </h2>
              <p className="mt-4 max-w-3xl text-sm leading-6 text-slate-600">
                {description}
              </p>
            </div>
            <div className="border-t border-slate-200 p-6 xl:border-l xl:border-t-0 sm:p-8">
              <span className="flex size-14 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-200">
                <Icon size={26} />
              </span>
              <p className="mt-5 text-sm font-semibold uppercase tracking-widest text-slate-500">
                Ultra workspace
              </p>
              <p className="mt-2 text-2xl font-semibold tracking-normal text-slate-950">
                Premium module
              </p>
              <p className="mt-3 text-sm leading-6 text-slate-500">
                Built for companies that need more control, automation, and visibility across teams.
              </p>
            </div>
          </div>
        </section>

        <section className="mt-6 grid gap-4 lg:grid-cols-3">
          {highlights.map((item) => (
            <div key={item.title} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/70">
              <CheckCircle2 className="text-emerald-600" size={22} />
              <p className="mt-4 text-base font-semibold text-slate-950">{item.title}</p>
              <p className="mt-2 text-sm leading-6 text-slate-500">{item.text}</p>
            </div>
          ))}
        </section>

        <section className="mt-6 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/70">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-950">What this unlocks</p>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                These workflows are prepared as Ultra control areas so the dashboard feels complete while deeper data connections are added.
              </p>
            </div>
            <span className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white">
              Ready in Ultra
              <ArrowRight size={16} />
            </span>
          </div>
          <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {actions.map((action) => (
              <div key={action} className="rounded-2xl border border-blue-100 bg-[#f7fbff] p-4 text-sm font-semibold text-blue-950">
                {action}
              </div>
            ))}
          </div>
        </section>
      </main>
    </PlanGate>
  );
}
