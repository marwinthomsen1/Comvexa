import Link from "next/link";
import Image from "next/image";
import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-6 py-12">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <Link href="/" className="mb-8 inline-flex items-center gap-3 font-semibold text-slate-950">
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
        <div>
          <h1 className="text-2xl font-semibold tracking-normal text-slate-950">Welcome back</h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Log in to manage your business workspace.
          </p>
        </div>

        <LoginForm />

        <p className="mt-6 text-center text-sm text-slate-600">
          New to Comvexa?{" "}
          <Link href="/register" className="font-semibold text-emerald-700 hover:text-emerald-800">
            Create an account
          </Link>
        </p>
      </div>
    </main>
  );
}
