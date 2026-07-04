import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, CheckCircle2, CreditCard, Layers3, ShieldCheck, Sparkles } from "lucide-react";
import { RegisterForm } from "./register-form";

export default function RegisterPage() {
  return (
    <main className="summer-auth relative isolate min-h-screen overflow-hidden px-3 py-4 text-slate-950 sm:px-6 sm:py-12">
      <div className="summer-auth-sun" aria-hidden="true" />
      <div className="summer-auth-cloud summer-auth-cloud-one" aria-hidden="true" />
      <div className="summer-auth-cloud summer-auth-cloud-two" aria-hidden="true" />

      <div className="relative z-10 mx-auto grid w-full max-w-6xl overflow-hidden rounded-3xl border border-white/70 bg-white/85 shadow-xl shadow-cyan-200/40 backdrop-blur-xl sm:rounded-[2rem] sm:bg-white/70 sm:shadow-2xl sm:shadow-cyan-200/60 lg:grid-cols-[0.9fr_1.1fr] lg:items-stretch">
        <section className="relative hidden overflow-hidden bg-cyan-950 p-8 text-white sm:p-10 lg:block">
          <div className="absolute -bottom-24 -left-20 size-64 rounded-full bg-cyan-400/20 blur-2xl" />
          <div className="absolute -right-16 top-10 size-52 rounded-full bg-[#ffcf5a]/30 blur-2xl" />

          <div className="relative flex h-full flex-col">
            <Link href="/" className="inline-flex items-center gap-3 font-semibold">
              <Image
                src="/logo.png"
                alt="Comvexa logo"
                width={44}
                height={44}
                className="size-11 rounded-xl bg-white object-contain p-1"
                priority
              />
              <span className="text-lg">Comvexa</span>
            </Link>

            <div className="mt-16">
              <p className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-semibold text-amber-100 ring-1 ring-white/15">
                <Sparkles size={16} />
                Start sunny, scale cleanly
              </p>
              <h1 className="mt-6 max-w-md text-4xl font-semibold leading-tight tracking-normal sm:text-5xl">
                Build your company workspace in minutes.
              </h1>
              <p className="mt-5 max-w-md text-base leading-7 text-cyan-50/80">
                Create your owner account, set up your company, then choose the
                plan that fits how your team works.
              </p>
            </div>

            <div className="mt-10 grid gap-3">
              {[
                ["Company-isolated data", ShieldCheck],
                ["Pick a plan after signup", CreditCard],
                ["Expandable modules for growth", Layers3],
              ].map(([item, Icon]) => (
                <div key={String(item)} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.07] p-4 text-sm text-cyan-50">
                  <Icon className="text-amber-200" size={18} />
                  <span>{String(item)}</span>
                </div>
              ))}
            </div>

            <div className="mt-auto pt-10">
              <div className="rounded-3xl bg-white/[0.08] p-5 ring-1 ring-white/10">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="text-amber-200" size={20} />
                  <p className="text-sm font-semibold">Pro includes a 3-day trial</p>
                </div>
                <p className="mt-2 text-sm leading-6 text-cyan-50/70">
                  Sign up first, then unlock the dashboard modules included in
                  your selected plan.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-white/90 p-5 sm:p-10 lg:p-12">
          <div className="mb-6 flex items-center justify-between gap-3 sm:mb-10">
            <Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-cyan-800 hover:text-cyan-950">
              <ArrowLeft size={16} />
              Back
            </Link>
            <Link href="/" className="inline-flex items-center gap-2 font-semibold lg:hidden">
              <Image
                src="/logo.png"
                alt="Comvexa logo"
                width={32}
                height={32}
                className="size-8 rounded-lg bg-white object-contain p-1"
                priority
              />
              <span>Comvexa</span>
            </Link>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-[#ff6b4a] sm:text-sm">
              Register
            </p>
            <h2 className="mt-2 text-3xl font-semibold tracking-normal text-slate-950 sm:mt-3">Create account</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600 sm:mt-3">
              Create your owner login and company workspace.
            </p>
          </div>

          <RegisterForm />

          <p className="mt-6 text-center text-sm text-slate-600">
            Already have an account?{" "}
            <Link href="/login" className="font-semibold text-cyan-700 hover:text-cyan-900">
              Login
            </Link>
          </p>
        </section>
      </div>
    </main>
  );
}
