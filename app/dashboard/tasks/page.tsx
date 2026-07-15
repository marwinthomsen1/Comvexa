"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronRight,
  Circle,
  Clock3,
  Flame,
  ListFilter,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { supabase } from "@/src/lib/supabase/client";
import { getWorkspaceCompanyId } from "@/src/lib/supabase/workspace";
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

const taskCache = new Map<string, Task[]>();
const statusOptions = [
  { value: "pending", label: "To do" },
  { value: "in progress", label: "In progress" },
  { value: "completed", label: "Completed" },
];

export default function TasksPage() {
  return (
    <PlanGate moduleName="Tasks">
      <TasksQueue />
    </PlanGate>
  );
}

function TasksQueue() {
  const [companyId, setCompanyId] = useState("");
  const [tasks, setTasks] = useState<Task[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("open");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [showComposer, setShowComposer] = useState(false);
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [cacheKey, setCacheKey] = useState("");

  useEffect(() => {
    async function loadTasks() {
      const { data: sessionData } = await supabase.auth.getSession();
      const user = sessionData.session?.user;

      if (!user) {
        setError("You must be logged in to view tasks.");
        setIsLoading(false);
        return;
      }

      const cacheKey = `${user.id}:tasks`;
      setCacheKey(cacheKey);
      const cached = taskCache.get(cacheKey);
      if (cached) {
        setTasks(cached);
        setIsLoading(false);
      }

      const workspaceCompanyId = await getWorkspaceCompanyId(user.id);
      if (!workspaceCompanyId) {
        setError("Your profile is not connected to a company yet.");
        setIsLoading(false);
        return;
      }

      setCompanyId(workspaceCompanyId);
      const { data, error: tasksError } = await supabase
        .from("tasks")
        .select("*")
        .eq("company_id", workspaceCompanyId)
        .order("due_date", { ascending: true, nullsFirst: false });

      if (tasksError) {
        setError(tasksError.message);
        setIsLoading(false);
        return;
      }

      const nextTasks = (data ?? []) as Task[];
      taskCache.set(cacheKey, nextTasks);
      setTasks(nextTasks);
      setIsLoading(false);
    }

    const timeout = window.setTimeout(() => void loadTasks(), 0);
    return () => window.clearTimeout(timeout);
  }, []);

  useEffect(() => {
    if (!showComposer) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setShowComposer(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [showComposer]);

  const today = getTodayKey();
  const openTasks = tasks.filter((task) => normalizeStatus(task.status) !== "completed");
  const completedTasks = tasks.filter((task) => normalizeStatus(task.status) === "completed");
  const overdueTasks = openTasks.filter((task) => task.due_date && task.due_date < today);
  const todayTasks = openTasks.filter((task) => task.due_date === today);
  const completionPercent = tasks.length ? Math.round((completedTasks.length / tasks.length) * 100) : 0;

  const filteredTasks = useMemo(() => {
    const term = search.trim().toLowerCase();
    return tasks.filter((task) => {
      const status = normalizeStatus(task.status);
      const matchesSearch = !term || [task.title, task.description, task.priority, task.due_date].some((value) => String(value ?? "").toLowerCase().includes(term));
      const matchesStatus = statusFilter === "all" || (statusFilter === "open" ? status !== "completed" : status === statusFilter);
      const matchesPriority = priorityFilter === "all" || String(task.priority ?? "normal").toLowerCase() === priorityFilter;
      return matchesSearch && matchesStatus && matchesPriority;
    });
  }, [priorityFilter, search, statusFilter, tasks]);

  const groups = useMemo(() => buildTaskGroups(filteredTasks, today), [filteredTasks, today]);

  function updateLocalTasks(nextTasks: Task[]) {
    setTasks(nextTasks);
    if (cacheKey) taskCache.set(cacheKey, nextTasks);
  }

  async function addTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!companyId) {
      setError("Your company workspace is not ready yet.");
      return;
    }

    const form = event.currentTarget;
    const formData = new FormData(form);
    const optimisticTask: Task = {
      id: crypto.randomUUID(),
      company_id: companyId,
      title: String(formData.get("title") ?? "").trim(),
      priority: String(formData.get("priority") ?? "normal"),
      status: "pending",
      due_date: String(formData.get("due_date") ?? "") || null,
      description: String(formData.get("description") ?? "").trim() || null,
      created_at: new Date().toISOString(),
    };

    setError("");
    setIsSaving(true);
    updateLocalTasks([optimisticTask, ...tasks]);
    form.reset();
    setShowComposer(false);

    const { error: insertError } = await supabase.from("tasks").insert(optimisticTask);
    setIsSaving(false);
    if (insertError) {
      updateLocalTasks(tasks);
      setError(insertError.message);
    }
  }

  async function updateStatus(task: Task, status: string) {
    const previousTasks = tasks;
    updateLocalTasks(tasks.map((item) => item.id === task.id ? { ...item, status } : item));
    const { error: updateError } = await supabase.from("tasks").update({ status }).eq("id", task.id);
    if (updateError) {
      updateLocalTasks(previousTasks);
      setError(updateError.message);
    }
  }

  async function deleteTask(task: Task) {
    const previousTasks = tasks;
    updateLocalTasks(tasks.filter((item) => item.id !== task.id));
    const { error: deleteError } = await supabase.from("tasks").delete().eq("id", task.id);
    if (deleteError) {
      updateLocalTasks(previousTasks);
      setError(deleteError.message);
    }
  }

  return (
    <main className="tasks-command-page mx-auto w-full max-w-[1500px] flex-1 p-4 sm:p-6">
      <section className="dashboard-custom-hero tasks-command-header overflow-hidden rounded-[2rem] border border-[#332d59] bg-[#211c3d] p-6 text-white shadow-xl shadow-[#211c3d]/10">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#c4b5fd]">Focus queue</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white">Today&apos;s work, clearly ordered.</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">See what needs attention, move work forward, and finish tasks without managing columns.</p>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <CommandMetric label="Open" value={String(openTasks.length)} />
            <CommandMetric label="Due today" value={String(todayTasks.length)} />
            <CommandMetric label="Overdue" value={String(overdueTasks.length)} alert={overdueTasks.length > 0} />
          </div>
        </div>
      </section>

      <section className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="tasks-focus-panel rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <label className="flex h-11 w-full items-center gap-3 rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-500 focus-within:border-violet-500 focus-within:ring-4 focus-within:ring-violet-100 lg:max-w-md">
              <Search size={17} />
              <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search tasks" className="min-w-0 flex-1 bg-transparent outline-none" />
            </label>
            <div className="flex flex-wrap gap-2">
              <label className="flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-semibold text-slate-500">
                <ListFilter size={15} />
                <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="bg-transparent text-sm font-medium text-slate-700 outline-none">
                  <option value="open">Open tasks</option>
                  <option value="all">All statuses</option>
                  <option value="pending">To do</option>
                  <option value="in progress">In progress</option>
                  <option value="completed">Completed</option>
                </select>
              </label>
              <select value={priorityFilter} onChange={(event) => setPriorityFilter(event.target.value)} className="h-11 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-medium text-slate-700 outline-none">
                <option value="all">All priorities</option>
                <option value="high">High priority</option>
                <option value="normal">Normal priority</option>
                <option value="low">Low priority</option>
              </select>
              <button type="button" onClick={() => setShowComposer(true)} className="inline-flex h-11 items-center gap-2 rounded-xl bg-[#6d4aff] px-4 text-sm font-semibold text-white hover:bg-[#5c3ce0]"><Plus size={16} />New task</button>
            </div>
          </div>

          {error ? <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 ring-1 ring-red-100" role="alert">{error}</p> : null}

          <div className="mt-5 space-y-6">
            {isLoading ? Array.from({ length: 5 }, (_, index) => <div key={index} className="h-24 animate-pulse rounded-2xl bg-slate-100" />) : groups.length ? groups.map((group) => (
              <section key={group.key}>
                <div className="mb-2 flex items-center justify-between gap-3 px-1">
                  <div className="flex items-center gap-2">
                    <span className={`size-2 rounded-full ${group.tone}`} />
                    <h3 className="text-sm font-semibold text-slate-900">{group.title}</h3>
                  </div>
                  <span className="text-xs font-semibold text-slate-400">{group.tasks.length}</span>
                </div>
                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                  {group.tasks.map((task) => (
                    <TaskQueueRow key={task.id} task={task} today={today} onStatusChange={updateStatus} onDelete={deleteTask} />
                  ))}
                </div>
              </section>
            )) : (
              <div className="grid min-h-72 place-items-center rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
                <div><CheckCircle2 className="mx-auto text-slate-300" size={36} /><p className="mt-3 font-semibold text-slate-800">Nothing in this queue</p><p className="mt-1 text-sm text-slate-500">Adjust the filters or create a new task.</p></div>
              </div>
            )}
          </div>
        </div>

        <aside className="tasks-insights-panel self-start rounded-[2rem] border border-[#ffd7c8] bg-[#fff7f2] p-5 shadow-sm xl:sticky xl:top-24">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#c25536]">Work pulse</p>
          <div className="mt-5 flex items-center gap-4">
            <div className="grid size-20 shrink-0 place-items-center rounded-full bg-white text-xl font-semibold text-[#211c3d] shadow-sm ring-8 ring-[#ffe5db]">{completionPercent}%</div>
            <div><p className="font-semibold text-slate-900">Overall completion</p><p className="mt-1 text-sm leading-5 text-slate-500">{completedTasks.length} of {tasks.length} tasks finished</p></div>
          </div>
          <div className="mt-6 h-2 overflow-hidden rounded-full bg-white ring-1 ring-[#f4d8cc]"><div className="h-full rounded-full bg-[#ff7657] transition-all" style={{ width: `${completionPercent}%` }} /></div>

          <div className="mt-6 space-y-3">
            <PulseRow icon={Flame} label="High priority" value={String(openTasks.filter((task) => task.priority === "high").length)} tone="text-red-600 bg-red-50" />
            <PulseRow icon={Clock3} label="In progress" value={String(tasks.filter((task) => normalizeStatus(task.status) === "in progress").length)} tone="text-violet-600 bg-violet-50" />
            <PulseRow icon={AlertTriangle} label="Overdue" value={String(overdueTasks.length)} tone="text-amber-700 bg-amber-50" />
          </div>

          <button type="button" onClick={() => { setStatusFilter("completed"); setPriorityFilter("all"); }} className="mt-6 flex w-full items-center justify-between rounded-2xl border border-[#f1d4c8] bg-white px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-[#fffaf7]">Review completed <ChevronRight size={16} /></button>
        </aside>
      </section>

      {showComposer ? (
        <div className="task-composer-overlay fixed inset-0 z-50 grid place-items-center p-4" role="dialog" aria-modal="true" aria-labelledby="task-composer-title">
          <button type="button" onClick={() => setShowComposer(false)} className="absolute inset-0 bg-[#17132d]/55 backdrop-blur-sm" aria-label="Close task composer" />
          <form onSubmit={addTask} className="task-composer relative w-full max-w-xl rounded-[2rem] border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-violet-600">Quick capture</p><h3 id="task-composer-title" className="mt-2 text-2xl font-semibold text-slate-950">Create a new task</h3></div>
              <button type="button" onClick={() => setShowComposer(false)} className="grid size-10 place-items-center rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50" aria-label="Close task composer"><X size={18} /></button>
            </div>
            <div className="mt-6 grid gap-4">
              <label><span className="text-sm font-medium text-slate-700">Task title</span><input name="title" required autoFocus placeholder="What needs to happen?" className="mt-2 h-12 w-full rounded-xl border border-slate-300 px-4 text-sm outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-100" /></label>
              <div className="grid gap-4 sm:grid-cols-2">
                <label><span className="text-sm font-medium text-slate-700">Priority</span><select name="priority" defaultValue="normal" className="mt-2 h-12 w-full rounded-xl border border-slate-300 px-4 text-sm outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-100"><option value="low">Low</option><option value="normal">Normal</option><option value="high">High</option></select></label>
                <label><span className="text-sm font-medium text-slate-700">Due date</span><input name="due_date" type="date" className="mt-2 h-12 w-full rounded-xl border border-slate-300 px-4 text-sm outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-100" /></label>
              </div>
              <label><span className="text-sm font-medium text-slate-700">Details</span><textarea name="description" rows={4} placeholder="Add context or the next step" className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-100" /></label>
              <button disabled={isSaving || !companyId} className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[#6d4aff] px-4 text-sm font-semibold text-white hover:bg-[#5c3ce0] disabled:opacity-50"><Plus size={17} />{isSaving ? "Saving..." : "Create task"}</button>
            </div>
          </form>
        </div>
      ) : null}
    </main>
  );
}

function TaskQueueRow({ task, today, onStatusChange, onDelete }: { task: Task; today: string; onStatusChange: (task: Task, status: string) => void; onDelete: (task: Task) => void }) {
  const status = normalizeStatus(task.status);
  const completed = status === "completed";
  const overdue = Boolean(task.due_date && task.due_date < today && !completed);
  const priority = String(task.priority ?? "normal").toLowerCase();

  return (
    <article className="task-queue-row group flex flex-col gap-3 border-b border-slate-100 bg-white p-4 last:border-b-0 sm:flex-row sm:items-center">
      <button type="button" onClick={() => onStatusChange(task, completed ? "pending" : "completed")} className={`grid size-9 shrink-0 place-items-center rounded-full border-2 ${completed ? "border-emerald-500 bg-emerald-500 text-white" : "border-slate-300 text-transparent hover:border-violet-500 hover:text-violet-500"}`} aria-label={completed ? `Reopen ${task.title}` : `Complete ${task.title}`}>{completed ? <Check size={16} /> : <Circle size={13} />}</button>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className={`font-semibold ${completed ? "text-slate-400 line-through" : "text-slate-950"}`}>{task.title ?? "Untitled task"}</p>
          <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize ${priority === "high" ? "bg-red-50 text-red-700" : priority === "low" ? "bg-slate-100 text-slate-500" : "bg-violet-50 text-violet-700"}`}>{priority}</span>
        </div>
        {task.description ? <p className="mt-1 line-clamp-1 text-sm text-slate-500">{task.description}</p> : null}
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {task.due_date ? <span className={`inline-flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-xs font-semibold ${overdue ? "bg-red-50 text-red-700" : "bg-slate-100 text-slate-600"}`}><CalendarDays size={13} />{formatTaskDate(task.due_date, today)}</span> : <span className="text-xs text-slate-400">No due date</span>}
        <select value={status} onChange={(event) => onStatusChange(task, event.target.value)} className="h-9 rounded-xl border border-slate-200 bg-white px-2 text-xs font-semibold text-slate-600 outline-none hover:bg-slate-50" aria-label={`Change status for ${task.title}`}>
          {statusOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
        </select>
        <button type="button" onClick={() => onDelete(task)} className="grid size-9 place-items-center rounded-xl text-slate-300 opacity-60 hover:bg-red-50 hover:text-red-600 group-hover:opacity-100" aria-label={`Delete ${task.title}`}><Trash2 size={15} /></button>
      </div>
    </article>
  );
}

function CommandMetric({ label, value, alert = false }: { label: string; value: string; alert?: boolean }) {
  return <div className={`min-w-24 rounded-2xl border px-4 py-3 ${alert ? "border-red-300/30 bg-red-400/10" : "border-white/10 bg-white/[0.07]"}`}><p className="text-[10px] font-semibold uppercase tracking-wider text-slate-300">{label}</p><p className={`mt-1 text-xl font-semibold ${alert ? "text-red-200" : "text-white"}`}>{value}</p></div>;
}

function PulseRow({ icon: Icon, label, value, tone }: { icon: typeof Flame; label: string; value: string; tone: string }) {
  return <div className="flex items-center justify-between rounded-2xl border border-[#f1d4c8] bg-white p-3"><div className="flex items-center gap-3"><span className={`grid size-9 place-items-center rounded-xl ${tone}`}><Icon size={16} /></span><span className="text-sm font-medium text-slate-700">{label}</span></div><span className="font-semibold text-slate-950">{value}</span></div>;
}

function normalizeStatus(status: string | null) {
  const value = String(status ?? "pending").toLowerCase();
  return value === "completed" || value === "in progress" ? value : "pending";
}

function getTodayKey() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function buildTaskGroups(tasks: Task[], today: string) {
  const definitions = [
    { key: "overdue", title: "Needs attention", tone: "bg-red-500", matches: (task: Task) => normalizeStatus(task.status) !== "completed" && Boolean(task.due_date && task.due_date < today) },
    { key: "today", title: "Today", tone: "bg-violet-500", matches: (task: Task) => normalizeStatus(task.status) !== "completed" && task.due_date === today },
    { key: "upcoming", title: "Upcoming", tone: "bg-sky-500", matches: (task: Task) => normalizeStatus(task.status) !== "completed" && Boolean(task.due_date && task.due_date > today) },
    { key: "unscheduled", title: "No date", tone: "bg-slate-400", matches: (task: Task) => normalizeStatus(task.status) !== "completed" && !task.due_date },
    { key: "completed", title: "Completed", tone: "bg-emerald-500", matches: (task: Task) => normalizeStatus(task.status) === "completed" },
  ];

  return definitions
    .map((definition) => ({ ...definition, tasks: tasks.filter(definition.matches).sort(sortTasks) }))
    .filter((group) => group.tasks.length > 0);
}

function sortTasks(left: Task, right: Task) {
  const priorityOrder: Record<string, number> = { high: 0, normal: 1, low: 2 };
  const dateCompare = String(left.due_date ?? "9999-12-31").localeCompare(String(right.due_date ?? "9999-12-31"));
  return dateCompare || (priorityOrder[String(left.priority ?? "normal")] ?? 1) - (priorityOrder[String(right.priority ?? "normal")] ?? 1);
}

function formatTaskDate(value: string, today: string) {
  if (value === today) return "Today";
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" }).format(date);
}
