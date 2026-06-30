"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { Download, FileText, Plus, RefreshCw, Trash2, Upload } from "lucide-react";
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

export function PdfDocumentsPage() {
  const [companyId, setCompanyId] = useState("");
  const [documents, setDocuments] = useState<DocumentRow[]>([]);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);

  const filteredDocuments = useMemo(() => {
    const term = search.toLowerCase().trim();

    if (!term) {
      return documents;
    }

    return documents.filter((document) =>
      [document.title, document.document_type, document.notes]
        .some((value) => String(value ?? "").toLowerCase().includes(term)),
    );
  }, [documents, search]);

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

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("company_id")
      .eq("id", user.id)
      .single();

    if (profileError || !profile?.company_id) {
      setError("Your profile is not connected to a company yet.");
      setIsLoading(false);
      return;
    }

    setCompanyId(profile.company_id);

    const { data, error: documentsError } = await supabase
      .from("documents")
      .select("id, title, file_url, document_type, expiry_date, notes, created_at")
      .eq("company_id", profile.company_id)
      .order("created_at", { ascending: false });

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
    const { error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(storagePath, file, {
        contentType: "application/pdf",
        upsert: false,
      });

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
      setError(insertError.message);
      return;
    }

    form.reset();
    await loadDocuments();
  }

  async function openDocument(path: string | null) {
    if (!path) {
      return;
    }

    const { data, error: signedUrlError } = await supabase.storage
      .from(bucketName)
      .createSignedUrl(path, 60);

    if (signedUrlError || !data?.signedUrl) {
      setError(signedUrlError?.message ?? "Could not open this PDF.");
      return;
    }

    window.open(data.signedUrl, "_blank", "noopener,noreferrer");
  }

  async function deleteDocument(document: DocumentRow) {
    setError("");

    if (document.file_url) {
      await supabase.storage.from(bucketName).remove([document.file_url]);
    }

    const { error: deleteError } = await supabase
      .from("documents")
      .delete()
      .eq("id", document.id);

    if (deleteError) {
      setError(deleteError.message);
      return;
    }

    setDocuments((currentDocuments) =>
      currentDocuments.filter((item) => item.id !== document.id),
    );
  }

  return (
    <main className="mx-auto w-full max-w-7xl flex-1 p-6">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/70">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-emerald-700">
              PDF document storage
            </p>
            <h2 className="mt-2 text-3xl font-semibold tracking-normal text-slate-950">
              Documents
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
              Upload company PDFs such as contracts, licenses, invoices,
              policies, certificates, and reports. Files are stored in Supabase
              Storage under the current company workspace.
            </p>
          </div>
          <button
            type="button"
            onClick={loadDocuments}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
          >
            <RefreshCw size={16} />
            Refresh
          </button>
        </div>

        {error ? (
          <p className="mt-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </p>
        ) : null}

        <form onSubmit={handleUpload} className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <label>
            <span className="text-sm font-medium text-slate-700">Title</span>
            <input
              name="title"
              placeholder="Contract, license, report..."
              className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
            />
          </label>
          <label>
            <span className="text-sm font-medium text-slate-700">Document type</span>
            <input
              name="document_type"
              placeholder="Contract"
              className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
            />
          </label>
          <label>
            <span className="text-sm font-medium text-slate-700">Expiry date</span>
            <input
              name="expiry_date"
              type="date"
              className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
            />
          </label>
          <label>
            <span className="text-sm font-medium text-slate-700">PDF file</span>
            <input
              name="pdf"
              type="file"
              accept="application/pdf,.pdf"
              required
              className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-emerald-50 file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-emerald-700"
            />
          </label>
          <label className="md:col-span-2 xl:col-span-3">
            <span className="text-sm font-medium text-slate-700">Notes</span>
            <input
              name="notes"
              placeholder="Optional notes"
              className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
            />
          </label>
          <button
            type="submit"
            disabled={isUploading || !companyId}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-emerald-900/20 hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-300 xl:self-end"
          >
            <Upload size={16} />
            {isUploading ? "Uploading..." : "Upload PDF"}
          </button>
        </form>
      </section>

      <section className="mt-6 rounded-3xl border border-slate-200 bg-white shadow-sm shadow-slate-200/70">
        <div className="flex flex-col gap-3 border-b border-slate-200 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="font-semibold tracking-normal text-slate-950">Uploaded PDFs</h3>
            <p className="mt-1 text-sm text-slate-500">
              {isLoading ? "Loading documents..." : `${filteredDocuments.length} PDF records in this company workspace.`}
            </p>
          </div>
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search PDFs"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100 sm:w-64"
          />
        </div>
        <div className="grid gap-4 p-5 md:grid-cols-2 xl:grid-cols-3">
          {filteredDocuments.map((document) => (
            <div key={document.id} className="rounded-2xl border border-slate-200 p-5">
              <div className="flex items-start gap-4">
                <span className="flex size-11 items-center justify-center rounded-xl bg-red-50 text-red-700 ring-1 ring-red-100">
                  <FileText size={20} />
                </span>
                <div className="min-w-0">
                  <h4 className="truncate font-semibold text-slate-950">
                    {document.title ?? "Untitled PDF"}
                  </h4>
                  <p className="mt-1 text-sm text-slate-500">
                    {document.document_type ?? "PDF"}
                    {document.expiry_date ? ` · expires ${document.expiry_date}` : ""}
                  </p>
                </div>
              </div>
              {document.notes ? (
                <p className="mt-4 text-sm leading-6 text-slate-600">{document.notes}</p>
              ) : null}
              <div className="mt-5 flex gap-2">
                <button
                  type="button"
                  onClick={() => openDocument(document.file_url)}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-slate-950 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-800"
                >
                  <Download size={15} />
                  Open
                </button>
                <button
                  type="button"
                  onClick={() => deleteDocument(document)}
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-100"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
          {!isLoading && filteredDocuments.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500 md:col-span-2 xl:col-span-3">
              <Plus className="mx-auto mb-3 text-slate-400" size={24} />
              No PDFs uploaded yet. Add your first company document above.
            </div>
          ) : null}
        </div>
      </section>
    </main>
  );
}
