type Stat = {
  label: string;
  value: string;
  note: string;
};

type Column<T> = {
  key: keyof T;
  label: string;
};

type ModulePageProps<T extends Record<string, string>> = {
  title: string;
  description: string;
  actionLabel: string;
  stats: Stat[];
  columns: Column<T>[];
  rows: T[];
};

export function ModulePage<T extends Record<string, string>>({
  title,
  description,
  actionLabel,
  stats,
  columns,
  rows,
}: ModulePageProps<T>) {
  return (
    <main className="mx-auto w-full max-w-7xl flex-1 p-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/70">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-emerald-700">
            Comvexa module
          </p>
          <h2 className="text-2xl font-semibold tracking-normal text-slate-950">{title}</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">{description}</p>
        </div>
        <button
          type="button"
          className="rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-emerald-900/20 hover:bg-emerald-700"
        >
          {actionLabel}
        </button>
      </div>
      </div>

      <section className="mt-6 grid gap-4 md:grid-cols-3">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/70">
            <p className="text-sm font-medium text-slate-500">{stat.label}</p>
            <p className="mt-3 text-2xl font-semibold tracking-normal text-slate-950">{stat.value}</p>
            <p className="mt-2 text-sm text-slate-500">{stat.note}</p>
          </div>
        ))}
      </section>

      <section className="mt-6 rounded-2xl border border-slate-200 bg-white shadow-sm shadow-slate-200/70">
        <div className="flex flex-col gap-3 border-b border-slate-200 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="font-semibold tracking-normal text-slate-950">Records</h3>
            <p className="mt-1 text-sm text-slate-500">Sample data for the current company workspace.</p>
          </div>
          <input
            type="search"
            placeholder="Search records"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100 sm:w-64"
          />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
              <tr>
                {columns.map((column) => (
                  <th key={String(column.key)} className="px-5 py-3 font-semibold">
                    {column.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((row, index) => (
                <tr key={`${title}-${index}`} className="hover:bg-slate-50">
                  {columns.map((column, columnIndex) => (
                    <td
                      key={String(column.key)}
                      className={`px-5 py-4 ${
                        columnIndex === 0 ? "font-medium text-slate-950" : "text-slate-600"
                      }`}
                    >
                      {row[column.key]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
