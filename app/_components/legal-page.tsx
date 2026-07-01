import Image from "next/image";
import Link from "next/link";

type LegalSection = {
  title: string;
  body: string[];
};

type LegalPageProps = {
  title: string;
  updated: string;
  intro: string;
  sections: LegalSection[];
};

const legalLinks = [
  { href: "/privacy", label: "Privacy Policy" },
  { href: "/terms", label: "Terms of Service" },
  { href: "/refund", label: "Refund Policy" },
  { href: "/cookies", label: "Cookie Policy" },
];

export function LegalPage({ title, updated, intro, sections }: LegalPageProps) {
  return (
    <main className="min-h-screen bg-[#f4f7fb] text-slate-950">
      <header className="border-b border-slate-200 bg-white">
        <nav className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
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
        <article className="mx-auto max-w-5xl rounded-3xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/70 sm:p-10">
          <p className="text-sm font-semibold uppercase tracking-widest text-emerald-700">
            Legal
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-normal sm:text-5xl">
            {title}
          </h1>
          <p className="mt-3 text-sm text-slate-500">Last updated: {updated}</p>
          <p className="mt-8 max-w-3xl text-base leading-8 text-slate-700">
            {intro}
          </p>

          <div className="mt-10 grid gap-8">
            {sections.map((section) => (
              <section key={section.title} className="border-t border-slate-200 pt-8">
                <h2 className="text-2xl font-semibold tracking-normal text-slate-950">
                  {section.title}
                </h2>
                <div className="mt-4 grid gap-4 text-base leading-8 text-slate-700">
                  {section.body.map((paragraph) => (
                    <p key={paragraph}>{paragraph}</p>
                  ))}
                </div>
              </section>
            ))}
          </div>

          <div className="mt-12 flex flex-wrap gap-3 border-t border-slate-200 pt-8">
            {legalLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:border-emerald-300 hover:text-emerald-700"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </article>
      </section>
    </main>
  );
}
