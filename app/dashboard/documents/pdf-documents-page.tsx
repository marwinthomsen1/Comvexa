"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { Archive, CalendarClock, Download, FileText, FileUp, FolderLock, Plus, RefreshCw, Search, ShieldCheck, Trash2, Upload, X } from "lucide-react";
import { supabase } from "@/src/lib/supabase/client";

type DocumentRow = {
  id: string;
  title: string | null;
  file_url: string | null;
  document_type: string | null;
  expiry_date: string | null;
  notes: string | null;
  created_at: string | null;
};

const bucketName = "company-documents";
const pageSize = 20;

export function PdfDocumentsPage() {
  const [companyId, setCompanyId] = useState("");
  const [documents, setDocuments] = useState<DocumentRow[]>([]);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [typeFilter, setTypeFilter] = useState("all");
  const [page, setPage] = useState(1);

  const filteredDocuments = useMemo(() => {
    const term = search.toLowerCase().trim();
    return documents.filter((document) => {
      const matchesTerm = !term || [document.title, document.document_type, document.notes].some((value) => String(value ?? "").toLowerCase().includes(term));
      const matchesType = typeFilter === "all" || normalizeDocumentType(document.document_type) === typeFilter;
      return matchesTerm && matchesType;
    });
  }, [documents, search, typeFilter]);

  const documentTypes = useMemo(() => Array.from(new Set(documents.map((document) => normalizeDocumentType(document.document_type)))).sort(), [documents]);
  const pageCount = Math.max(1, Math.ceil(filteredDocuments.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const visibleDocuments = filteredDocuments.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const expiryStats = useMemo(() => getDocumentExpiryStats(documents), [documents]);

  async function loadDocuments() {
    setError("");
    setIsLoading(true);
    const { data: sessionData } = await supabase.auth.getSession();
    const user = sessionData.session?.user;
    if (!user) {
      setError("You must be logged in to view documents.");
      setIsLoading(false);
      return;
    }

    const { data: profile, error: profileError } = await supabase.from("profiles").select("company_id").eq("id", user.id).single();
    if (profileError || !profile?.company_id) {
      setError("Your profile is not connected to a company yet.");
      setIsLoading(false);
      return;
    }

    setCompanyId(profile.company_id);
    const { data, error: documentsError } = await supabase.from("documents").select("id, title, file_url, document_type, expiry_date, notes, created_at").eq("company_id", profile.company_id).order("created_at", { ascending: false });
    if (documentsError) {
      setError(documentsError.message);
      setIsLoading(false);
      return;
    }
    setDocuments((data ?? []) as DocumentRow[]);
    setIsLoading(false);
  }

  useEffect(() => {
    const timeout = window.setTimeout(loadDocuments, 0);
    return () => window.clearTimeout(timeout);
  }, []);

  useEffect(() => {
    if (!showUpload) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === "Escape" && !isUploading) setShowUpload(false); };
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [isUploading, showUpload]);

  async function handleUpload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!companyId) {
      setError("Your company workspace is not ready yet.");
      return;
    }
    const form = event.currentTarget;
    const formData = new FormData(form);
    const file = formData.get("pdf") as File | null;
    if (!file || file.size === 0) {
      setError("Choose a PDF file to upload.");
      return;
    }
    if (file.type !== "application/pdf") {
      setError("Only PDF files are allowed.");
      return;
    }

    setError("");
    setIsUploading(true);
    const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, "-");
    const storagePath = `${companyId}/${Date.now()}-${safeName}`;
    const { error: uploadError } = await supabase.storage.from(bucketName).upload(storagePath, file, { contentType: "application/pdf", upsert: false });
    if (uploadError) {
      setIsUploading(false);
      setError(uploadError.message);
      return;
    }

    const { error: insertError } = await supabase.from("documents").insert({
      company_id: companyId,
      title: String(formData.get("title") ?? file.name).trim() || file.name,
      document_type: String(formData.get("document_type") ?? "PDF").trim() || "PDF",
      expiry_date: String(formData.get("expiry_date") ?? "").trim() || null,
      notes: String(formData.get("notes") ?? "").trim() || null,
      file_url: storagePath,
    });
    setIsUploading(false);
    if (insertError) {
      await supabase.storage.from(bucketName).remove([storagePath]);
      setError(insertError.message);
      return;
    }
    form.reset();
    await loadDocuments();
    setShowUpload(false);
  }

  async function openDocument(path: string | null) {
    if (!path) return;
    const { data, error: signedUrlError } = await supabase.storage.from(bucketName).createSignedUrl(path, 60);
    if (signedUrlError || !data?.signedUrl) {
      setError(signedUrlError?.message ?? "Could not open this PDF.");
      return;
    }
    window.open(data.signedUrl, "_blank", "noopener,noreferrer");
  }

  async function deleteDocument(document: DocumentRow) {
    setError("");
    if (document.file_url) await supabase.storage.from(bucketName).remove([document.file_url]);
    const { error: deleteError } = await supabase.from("documents").delete().eq("id", document.id);
    if (deleteError) {
      setError(deleteError.message);
      return;
    }
    setDocuments((currentDocuments) => currentDocuments.filter((item) => item.id !== document.id));
  }

  return (
    <main className="document-vault-page mx-auto w-full max-w-[1500px] flex-1 p-4 sm:p-6">
      <section className="dashboard-custom-hero document-vault-header overflow-hidden rounded-[2rem] border border-[#342f4d] bg-[#211d34] p-6 text-white shadow-xl shadow-[#211d34]/10">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div><div className="flex items-center gap-2 text-[#c8b8ff]"><FolderLock size={16} /><p className="text-xs font-semibold uppercase tracking-[0.19em]">Secure archive</p></div><h2 className="mt-3 text-3xl font-semibold tracking-tight text-white">Document vault</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-[#c9c4dc]">Keep company PDFs organized by shelf, track expiry dates, and open protected files only when needed.</p></div>
          <div className="flex flex-wrap gap-2"><button type="button" onClick={() => void loadDocuments()} className="inline-flex h-11 items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 text-sm font-semibold text-white hover:bg-white/10"><RefreshCw size={16} />Refresh</button><button type="button" onClick={() => setShowUpload(true)} className="inline-flex h-11 items-center gap-2 rounded-xl bg-[#c8b8ff] px-4 text-sm font-semibold text-[#211d34] hover:bg-[#d9ceff]"><FileUp size={16} />Upload PDF</button></div>
        </div>
        <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <VaultMetric label="Files stored" value={String(documents.length)} icon={Archive} />
          <VaultMetric label="Archive shelves" value={String(documentTypes.length)} icon={FileText} />
          <VaultMetric label="Expiring soon" value={String(expiryStats.soon)} icon={CalendarClock} alert={expiryStats.soon > 0} />
          <VaultMetric label="No expiry" value={String(expiryStats.noDate)} icon={ShieldCheck} />
        </div>
      </section>

      {error ? <p className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">{error}</p> : null}

      <section className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_300px]">
        <div className="document-archive rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-violet-700">Archive index</p><h3 className="mt-1 text-lg font-semibold text-slate-950">Company files</h3></div>
            <label className="flex h-11 w-full items-center gap-3 rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-500 focus-within:border-violet-500 focus-within:ring-4 focus-within:ring-violet-100 lg:max-w-xs"><Search size={17} /><input type="search" value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder="Search title, type, notes" className="min-w-0 flex-1 bg-transparent outline-none" /></label>
          </div>
          <div className="mt-4 flex gap-1.5 overflow-x-auto rounded-2xl bg-slate-50 p-2" aria-label="Filter document shelf">
            {["all", ...documentTypes].map((type) => <button key={type} type="button" onClick={() => { setTypeFilter(type); setPage(1); }} aria-pressed={typeFilter === type} className={`shrink-0 rounded-xl px-3 py-2 text-xs font-semibold capitalize ${typeFilter === type ? "bg-[#4c3f78] text-white shadow-sm" : "bg-white text-slate-600 hover:bg-violet-50"}`}>{type === "all" ? "All shelves" : type}</button>)}
          </div>

          <div className="document-shelf mt-5 overflow-hidden rounded-3xl border border-slate-200">
            <div className="hidden grid-cols-[56px_minmax(180px,1fr)_130px_130px_110px] gap-4 bg-[#f5f2ff] px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-slate-500 md:grid"><span /><span>Document</span><span>Shelf</span><span>Expiry</span><span className="text-right">Actions</span></div>
            <div className="divide-y divide-slate-100">
              {isLoading ? Array.from({ length: 6 }, (_, index) => <div key={index} className="h-20 animate-pulse bg-slate-50" />) : visibleDocuments.length ? visibleDocuments.map((document, index) => {
                const expiry = getDocumentExpiry(document.expiry_date);
                return <article key={document.id} className="document-vault-row group grid gap-3 bg-white p-4 md:grid-cols-[56px_minmax(180px,1fr)_130px_130px_110px] md:items-center md:gap-4"><span className={`grid h-12 w-9 place-items-center rounded-r-xl border-l-4 text-white shadow-sm ${documentSpineTone(index)}`}><FileText size={16} /></span><div className="min-w-0"><p className="truncate text-sm font-semibold text-slate-950">{document.title ?? "Untitled PDF"}</p><p className="mt-1 truncate text-xs text-slate-400">{document.notes || formatStoredDate(document.created_at)}</p></div><span className="w-fit rounded-full bg-violet-50 px-2.5 py-1.5 text-xs font-semibold capitalize text-violet-700">{normalizeDocumentType(document.document_type)}</span><span className={`w-fit rounded-xl px-2.5 py-1.5 text-xs font-semibold ${expiry.className}`}>{expiry.label}</span><div className="flex justify-end gap-1"><button type="button" onClick={() => void openDocument(document.file_url)} className="grid size-9 place-items-center rounded-xl bg-slate-900 text-white hover:bg-violet-800" aria-label={`Open ${document.title ?? "document"}`} title="Open PDF"><Download size={15} /></button><button type="button" onClick={() => void deleteDocument(document)} className="grid size-9 place-items-center rounded-xl text-slate-300 opacity-70 hover:bg-red-50 hover:text-red-600 group-hover:opacity-100" aria-label={`Delete ${document.title ?? "document"}`}><Trash2 size={15} /></button></div></article>;
              }) : <div className="grid min-h-72 place-items-center p-8 text-center"><div><Archive size={38} className="mx-auto text-slate-300" /><p className="mt-3 font-semibold text-slate-800">This shelf is empty</p><p className="mt-1 text-sm text-slate-500">Upload a PDF or choose another document type.</p><button type="button" onClick={() => setShowUpload(true)} className="mt-4 inline-flex h-10 items-center gap-2 rounded-xl bg-[#4c3f78] px-4 text-sm font-semibold text-white"><Plus size={15} />Add document</button></div></div>}
            </div>
          </div>
          {!isLoading && filteredDocuments.length ? <div className="mt-4 flex items-center justify-between gap-3 border-t border-slate-100 pt-4 text-sm"><p className="text-slate-500">Showing <span className="font-semibold text-slate-700">{(currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, filteredDocuments.length)}</span> of {filteredDocuments.length}</p><div className="flex items-center gap-2"><button type="button" onClick={() => setPage((value) => Math.max(1, value - 1))} disabled={currentPage === 1} className="h-9 rounded-xl border border-slate-200 px-3 font-semibold text-slate-600 disabled:opacity-40">Previous</button><span className="text-xs font-semibold text-slate-500">{currentPage} / {pageCount}</span><button type="button" onClick={() => setPage((value) => Math.min(pageCount, value + 1))} disabled={currentPage === pageCount} className="h-9 rounded-xl border border-slate-200 px-3 font-semibold text-slate-600 disabled:opacity-40">Next</button></div></div> : null}
        </div>

        <aside className="document-expiry-watch self-start rounded-[2rem] border border-[#ddd6f3] bg-[#f7f5ff] p-5 shadow-sm xl:sticky xl:top-24"><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-violet-700">Expiry watch</p><h3 className="mt-2 text-lg font-semibold text-slate-950">Document health</h3></div><ShieldCheck size={21} className="text-violet-700" /></div><div className="mt-5 grid grid-cols-2 gap-2"><ExpiryTile label="Expired" value={expiryStats.expired} tone="red" /><ExpiryTile label="Due soon" value={expiryStats.soon} tone="amber" /><ExpiryTile label="Current" value={expiryStats.current} tone="green" /><ExpiryTile label="No date" value={expiryStats.noDate} tone="slate" /></div><div className="mt-5 border-t border-violet-100 pt-5"><p className="text-xs font-semibold text-slate-700">Next expirations</p><div className="mt-3 space-y-2">{getNextExpirations(documents).length ? getNextExpirations(documents).map((document) => <div key={document.id} className="rounded-2xl border border-violet-100 bg-white p-3"><p className="truncate text-xs font-semibold text-slate-800">{document.title || "Untitled PDF"}</p><p className="mt-1 text-[10px] text-slate-500">{formatExpiryDate(document.expiry_date)}</p></div>) : <p className="rounded-2xl bg-white p-4 text-center text-xs text-slate-400">No upcoming expirations.</p>}</div></div></aside>
      </section>

      {showUpload ? <div className="document-upload-overlay fixed inset-0 z-50 grid place-items-center p-4" role="dialog" aria-modal="true" aria-labelledby="document-upload-title"><button type="button" onClick={() => { if (!isUploading) setShowUpload(false); }} className="absolute inset-0 bg-[#171225]/65 backdrop-blur-sm" aria-label="Close upload form" /><form onSubmit={handleUpload} className="document-upload-form relative max-h-[92dvh] w-full max-w-3xl overflow-y-auto rounded-[2rem] border border-slate-200 bg-white p-6 shadow-2xl"><div className="flex items-start justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-violet-700">Archive intake</p><h3 id="document-upload-title" className="mt-2 text-2xl font-semibold text-slate-950">Upload company PDF</h3><p className="mt-1 text-sm text-slate-500">Add its archive details before placing it in the vault.</p></div><button type="button" disabled={isUploading} onClick={() => setShowUpload(false)} className="grid size-10 place-items-center rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40" aria-label="Close upload form"><X size={18} /></button></div>{error ? <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}<div className="mt-6 grid gap-4 sm:grid-cols-2"><VaultInput label="Title"><input name="title" placeholder="Contract, license, report..." className="document-input" /></VaultInput><VaultInput label="Document type"><input name="document_type" placeholder="Contract" className="document-input" /></VaultInput><VaultInput label="Expiry date"><input name="expiry_date" type="date" className="document-input" /></VaultInput><VaultInput label="Notes"><input name="notes" placeholder="Optional notes" className="document-input" /></VaultInput><label className="document-drop-zone sm:col-span-2"><span className="grid size-12 place-items-center rounded-2xl bg-violet-100 text-violet-700"><Upload size={20} /></span><span className="mt-3 text-sm font-semibold text-slate-800">Choose a PDF for this archive record</span><span className="mt-1 text-xs text-slate-500">PDF files only</span><input name="pdf" type="file" accept="application/pdf,.pdf" required className="mt-4 w-full text-sm text-slate-500 file:mr-3 file:rounded-xl file:border-0 file:bg-[#4c3f78] file:px-4 file:py-2 file:font-semibold file:text-white" /></label><button type="submit" disabled={isUploading || !companyId} className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[#4c3f78] px-4 text-sm font-semibold text-white hover:bg-[#3d3261] disabled:opacity-50 sm:col-span-2"><Upload size={16} />{isUploading ? "Securing PDF..." : "Store in vault"}</button></div></form></div> : null}
    </main>
  );
}

function VaultMetric({ label, value, icon: Icon, alert = false }: { label: string; value: string; icon: typeof Archive; alert?: boolean }) {
  return <div className={`rounded-2xl border px-4 py-3 ${alert ? "border-amber-300/30 bg-amber-300/10" : "border-white/10 bg-white/[0.06]"}`}><div className="flex items-center justify-between gap-3"><p className="text-[10px] font-semibold uppercase tracking-wider text-[#c9c4dc]">{label}</p><Icon size={15} className={alert ? "text-amber-300" : "text-[#c8b8ff]"} /></div><p className={`mt-2 text-xl font-semibold ${alert ? "text-amber-100" : "text-white"}`}>{value}</p></div>;
}

function VaultInput({ label, children }: { label: string; children: ReactNode }) {
  return <label><span className="text-sm font-medium text-slate-700">{label}</span>{children}</label>;
}

function ExpiryTile({ label, value, tone }: { label: string; value: number; tone: "red" | "amber" | "green" | "slate" }) {
  const tones = { red: "bg-red-50 text-red-700", amber: "bg-amber-50 text-amber-700", green: "bg-emerald-50 text-emerald-700", slate: "bg-slate-100 text-slate-600" };
  return <div className={`rounded-2xl p-3 ${tones[tone]}`}><p className="text-[10px] font-semibold uppercase tracking-wider opacity-70">{label}</p><p className="mt-2 text-xl font-semibold">{value}</p></div>;
}

function normalizeDocumentType(value: string | null) {
  return String(value ?? "PDF").trim().toLowerCase() || "pdf";
}

function getDocumentExpiry(value: string | null) {
  if (!value) return { key: "no-date", label: "No expiry", className: "bg-slate-100 text-slate-600" };
  const today = getTodayKey();
  if (value < today) return { key: "expired", label: "Expired", className: "bg-red-50 text-red-700" };
  const days = Math.ceil((new Date(`${value}T00:00:00`).getTime() - new Date(`${today}T00:00:00`).getTime()) / 86_400_000);
  if (days <= 30) return { key: "soon", label: `${days}d left`, className: "bg-amber-50 text-amber-700" };
  return { key: "current", label: formatExpiryDate(value), className: "bg-emerald-50 text-emerald-700" };
}

function getDocumentExpiryStats(documents: DocumentRow[]) {
  return documents.reduce((stats, document) => {
    const key = getDocumentExpiry(document.expiry_date).key;
    if (key === "expired") stats.expired += 1;
    else if (key === "soon") stats.soon += 1;
    else if (key === "current") stats.current += 1;
    else stats.noDate += 1;
    return stats;
  }, { expired: 0, soon: 0, current: 0, noDate: 0 });
}

function getNextExpirations(documents: DocumentRow[]) {
  const today = getTodayKey();
  return documents.filter((document) => document.expiry_date && document.expiry_date >= today).sort((first, second) => String(first.expiry_date).localeCompare(String(second.expiry_date))).slice(0, 4);
}

function getTodayKey() {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function formatExpiryDate(value: string | null) {
  if (!value) return "No expiry date";
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", year: "numeric" }).format(date);
}

function formatStoredDate(value: string | null) {
  if (!value) return "Stored in company vault";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Stored in company vault" : `Stored ${new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", year: "numeric" }).format(date)}`;
}

function documentSpineTone(index: number) {
  return ["border-l-violet-900 bg-violet-600", "border-l-rose-900 bg-rose-600", "border-l-sky-900 bg-sky-600", "border-l-amber-800 bg-amber-500", "border-l-emerald-900 bg-emerald-600"][index % 5];
}
