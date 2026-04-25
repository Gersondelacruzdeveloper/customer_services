
import { Plus, Search } from "lucide-react";
export function Topbar({ active }: { active: string }) {
  return (
    <div className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="flex flex-col gap-3 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-sm text-slate-500">Operations</p>
          <h2 className="text-2xl font-semibold capitalize tracking-tight text-slate-900">{active.replace("_", " ")}</h2>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2">
            <Search className="h-4 w-4 text-slate-400" />
            <input
              className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400 sm:w-72"
              placeholder="Search reservation, hotel, provider..."
            />
          </div>
          <button className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:opacity-90">
            <Plus className="h-4 w-4" />
            New reservation
          </button>
        </div>
      </div>
    </div>
  );
}
