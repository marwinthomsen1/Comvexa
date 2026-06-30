import Link from "next/link";
import Image from "next/image";
import { RegisterForm } from "./register-form";

export default function RegisterPage() {
  return (
    <main className="min-h-screen bg-slate-50 px-6 py-12">
      <div className="mx-auto grid w-full max-w-6xl gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
        <section className="rounded-2xl bg-slate-950 p-8 text-white">
          <Link href="/" className="inline-flex items-center gap-3 font-semibold">
            <Image
              src="/logo.png"
              alt="Comvexa logo"
              width={40}
              height={40}
              className="size-10 rounded-lg object-contain"
              priority
            />
            Comvexa
          </Link>
          <h1 className="mt-12 text-3xl font-semibold tracking-normal">
            Start building a cleaner global business workflow.
          </h1>
          <p className="mt-4 leading-7 text-slate-300">
            Create your business workspace first. After signup, you will choose
            your plan and continue to payment.
          </p>
          <div className="mt-10 grid gap-3">
            {["Company-isolated data", "Global-ready structure", "Expandable modules"].map((item) => (
              <div key={item} className="rounded-lg border border-slate-800 bg-slate-900 p-4 text-sm text-slate-200">
                {item}
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <div>
            <h2 className="text-2xl font-semibold tracking-normal text-slate-950">Create account</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Create your owner login and company workspace.
            </p>
          </div>

          <RegisterForm />

          <p className="mt-6 text-center text-sm text-slate-600">
            Already have an account?{" "}
            <Link href="/login" className="font-semibold text-emerald-700 hover:text-emerald-800">
              Login
            </Link>
          </p>
        </section>
      </div>
    </main>
  );
}
