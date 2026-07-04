import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, CheckCircle2, ShieldCheck, Sparkles, Waves } from "lucide-react";
import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <main className="summer-auth relative isolate flex min-h-screen items-center justify-center overflow-hidden px-3 py-4 text-slate-950 sm:px-6 sm:py-12">
      <div className="summer-auth-sun" aria-hidden="true" />
      <div className="summer-auth-cloud summer-auth-cloud-one" aria-hidden="true" />
      <div className="summer-auth-cloud summer-auth-cloud-two" aria-hidden="true" />

      <div className="relative z-10 grid w-full max-w-6xl overflow-hidden rounded-3xl border border-white/70 bg-white/85 shadow-xl shadow-cyan-200/40 backdrop-blur-xl sm:rounded-[2rem] sm:bg-white/70 sm:shadow-2xl sm:shadow-cyan-200/60 lg:grid-cols-[0.92fr_1.08fr]">
        <section className="relative hidden overflow-hidden bg-cyan-950 p-8 text-white sm:p-10 lg:block">
          <div className="absolute -bottom-20 -left-16 size-56 rounded-full bg-cyan-400/20 blur-2xl" />
          <div className="absolute -right-12 top-12 size-44 rounded-full bg-[#ffcf5a]/30 blur-2xl" />

          <div className="relative">
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
                Summer-ready workspace
              </p>
              <h1 className="mt-6 max-w-md text-4xl font-semibold leading-tight tracking-normal sm:text-5xl">
                Welcome back to brighter business days.
              </h1>
              <p className="mt-5 max-w-md text-base leading-7 text-cyan-50/80">
                Open your Comvexa dashboard, review the day, and keep every
                customer, payment, task, and report moving.
              </p>
            </div>

            <div className="mt-10 grid gap-3">
              {[
                ["Secure account access", ShieldCheck],
                ["Company workspace protected", CheckCircle2],
                ["Daily operations in one calm view", Waves],
              ].map(([item, Icon]) => (
                <div key={String(item)} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.07] p-4 text-sm text-cyan-50">
                  <Icon className="text-amber-200" size={18} />
                  <span>{String(item)}</span>
                </div>
              ))}
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
              Login
            </p>
            <h2 className="mt-2 text-3xl font-semibold tracking-normal text-slate-950 sm:mt-3">
              Welcome back
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600 sm:mt-3">
              Log in to manage your business workspace.
            </p>
          </div>

          <LoginForm />

          <p className="mt-7 text-center text-sm text-slate-600">
            New to Comvexa?{" "}
            <Link href="/register" className="font-semibold text-cyan-700 hover:text-cyan-900">
              Create an account
            </Link>
          </p>
        </section>
      </div>
    </main>
  );
}
