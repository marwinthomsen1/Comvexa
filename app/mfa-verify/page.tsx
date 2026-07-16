import Link from "next/link";
import Image from "next/image";
import { ShieldCheck } from "lucide-react";
import { MfaVerifyForm } from "./mfa-verify-form";

export default function MfaVerifyPage() {
  return (
    <main className="summer-auth relative isolate flex min-h-screen items-center justify-center overflow-hidden px-4 py-10 text-slate-950">
      <div className="summer-auth-sun" aria-hidden="true" />
      <div className="summer-auth-cloud summer-auth-cloud-one" aria-hidden="true" />
      <section className="relative z-10 w-full max-w-md rounded-[2rem] border border-white/70 bg-white/90 p-6 shadow-2xl shadow-cyan-200/60 backdrop-blur-xl sm:p-8">
        <Link href="/" className="inline-flex items-center gap-2 font-semibold text-cyan-950">
          <Image src="/logo.png" alt="Comvexa logo" width={38} height={38} className="size-9 rounded-xl bg-white object-contain p-1" />
          Comvexa
        </Link>
        <span className="mt-8 grid size-14 place-items-center rounded-2xl bg-cyan-950 text-white shadow-lg shadow-cyan-200">
          <ShieldCheck size={25} />
        </span>
        <p className="mt-6 text-xs font-semibold uppercase tracking-[0.18em] text-[#ff6b4a]">Secure login</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">Two-step verification</h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">Enter the six-digit code from your authenticator app to open Comvexa.</p>
        <MfaVerifyForm />
      </section>
    </main>
  );
}
