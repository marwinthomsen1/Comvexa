"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { CheckCircle2, Clock3, Flame, ListChecks, Plus, Trash2 } from "lucide-react";
import { supabase } from "@/src/lib/supabase/client";
import { PlanGate } from "../_components/plan-gate";

type Task = {
  id: string;
  company_id: string;
  title: string | null;
  description: string | null;
  status: string | null;
  priority: string | null;
  due_date: string | null;
  created_at: string | null;
};

const columns = [
  { key: "pending", title: "To do", icon: ListChecks },
  { key: "in progress", title: "In progress", icon: Clock3 },
  { key: "completed", title: "Done", icon: CheckCircle2 },
];

export default function TasksPage() {
  return (
    <PlanGate moduleName="Tasks">
      <TasksBoard />
    </PlanGate>
  );
}

function TasksBoard() {
  const [companyId, setCompanyId] = useState("");
  const [tasks, setTasks] = useState<Task[]>([]);
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  async function loadTasks() {
    const { data: sessionData } = await supabase.auth.getSession();
    const user = sessionData.session?.user;

    if (!user) {
      setError("You must be logged in to view tasks.");
      return;
    }

    const { data: profile } = await supabase.from("profiles").select("company_id").eq("id", user.id).single();

    if (!profile?.company_id) {
      setError("Your profile is not connected to a company yet.");
      return;
    }

    setCompanyId(profile.company_id);
    const { data, error: tasksError } = await supabase
      .from("tasks")
      .select("*")
      .eq("company_id", profile.company_id)
      .order("due_date", { ascending: true });

    if (tasksError) {
      setError(tasksError.message);
      return;
    }

    setTasks((data ?? []) as Task[]);
  }

  useEffect(() => {
    const timeout = window.setTimeout(() => void loadTasks(), 0);
    return () => window.clearTimeout(timeout);
  }, []);

  const overdue = useMemo(
    () => tasks.filter((task) => task.due_date && task.due_date < new Date().toISOString().slice(0, 10) && task.status !== "completed").length,
    [tasks],
  );

  async function addTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!companyId) {
      setError("Your company workspace is not ready yet.");
      return;
    }

    setIsSaving(true);
    const formData = new FormData(event.currentTarget);
    const { error: insertError } = await supabase.from("tasks").insert({
      company_id: companyId,
      title: String(formData.get("title") ?? "").trim(),
      priority: String(formData.get("priority") ?? "normal"),
      status: "pending",
      due_date: String(formData.get("due_date") ?? "") || null,
      description: String(formData.get("description") ?? "").trim() || null,
    });
    setIsSaving(false);

    if (insertError) {
      setError(insertError.message);
      return;
    }

    event.currentTarget.reset();
    await loadTasks();
  }

  async function updateStatus(task: Task, status: string) {
    const { error: updateError } = await supabase.from("tasks").update({ status }).eq("id", task.id);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    await loadTasks();
  }

  async function deleteTask(id: string) {
    const { error: deleteError } = await supabase.from("tasks").delete().eq("id", id);

    if (deleteError) {
      setError(deleteError.message);
      return;
    }

    await loadTasks();
  }

  return (
    <main className="mx-auto w-full max-w-[1500px] flex-1 p-4 sm:p-6">
      <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/70">
        <p className="text-xs font-semibold uppercase tracking-widest text-blue-700">Task board</p>
        <div className="mt-3 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h2 className="text-3xl font-semibold tracking-normal text-slate-950">Tasks</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
              Move work through a simple operational board instead of digging through rows.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center text-sm">
            <Metric label="Open" value={String(tasks.filter((task) => task.status !== "completed").length)} />
            <Metric label="Overdue" value={String(overdue)} />
            <Metric label="Done" value={String(tasks.filter((task) => task.status === "completed").length)} />
          </div>
        </div>
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-[360px_1fr]">
        <form onSubmit={addTask} className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/70">
          <h3 className="font-semibold text-slate-950">Add quick task</h3>
          <div className="mt-5 grid gap-4">
            <input name="title" required placeholder="Task title" className="h-11 rounded-xl border border-slate-300 px-3 text-sm outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100" />
            <div className="grid grid-cols-2 gap-3">
              <select name="priority" defaultValue="normal" className="h-11 rounded-xl border border-slate-300 px-3 text-sm capitalize outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100">
                <option value="low">low</option>
                <option value="normal">normal</option>
                <option value="high">high</option>
              </select>
              <input name="due_date" type="date" className="h-11 rounded-xl border border-slate-300 px-3 text-sm outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100" />
            </div>
            <textarea name="description" rows={4} placeholder="Details or next step" className="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100" />
            {error ? <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 ring-1 ring-red-100">{error}</p> : null}
            <button disabled={isSaving || !companyId} className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-700 disabled:bg-blue-300">
              <Plus size={17} />
              {isSaving ? "Saving..." : "Add task"}
            </button>
          </div>
        </form>

        <div className="grid gap-4 lg:grid-cols-3">
          {columns.map((column) => {
            const Icon = column.icon;
            const columnTasks = tasks.filter((task) => (task.status ?? "pending") === column.key);

            return (
              <section key={column.key} className="min-h-[28rem] rounded-[2rem] border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="flex items-center gap-2 font-semibold text-slate-950">
                    <Icon size={18} />
                    {column.title}
                  </h3>
                  <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-600 ring-1 ring-slate-200">{columnTasks.length}</span>
                </div>
                <div className="mt-4 space-y-3">
                  {columnTasks.map((task) => (
                    <article key={task.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold text-slate-950">{task.title}</p>
                          <p className="mt-2 text-sm leading-6 text-slate-500">{task.description ?? "No details"}</p>
                        </div>
                        <button onClick={() => void deleteTask(task.id)} className="rounded-lg p-1.5 text-red-600 hover:bg-red-50" aria-label="Delete task">
                          <Trash2 size={15} />
                        </button>
                      </div>
                      <div className="mt-4 flex flex-wrap items-center gap-2">
                        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${task.priority === "high" ? "bg-red-50 text-red-700" : "bg-slate-100 text-slate-600"}`}>
                          {task.priority === "high" ? <Flame size={13} /> : null}
                          {task.priority ?? "normal"}
                        </span>
                        {task.due_date ? <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">{task.due_date}</span> : null}
                      </div>
                      <div className="mt-4 grid grid-cols-2 gap-2">
                        {columns.filter((item) => item.key !== column.key).map((next) => (
                          <button key={next.key} type="button" onClick={() => void updateStatus(task, next.key)} className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50">
                            Move to {next.title}
                          </button>
                        ))}
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      </section>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-slate-50 px-4 py-3 ring-1 ring-slate-200">
      <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">{label}</p>
      <p className="mt-1 text-xl font-semibold text-slate-950">{value}</p>
    </div>
  );
}
