
import { excursions} from "../data/excursions";
import { getProviderName } from "../lib/utils";
import { providers } from "../data/Provider";

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 0,
});

export function ExcursionsView() {
  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="grid gap-6 lg:grid-cols-2">
        {excursions.map((excursion) => (
          <div key={excursion.id} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">{excursion.name}</h3>
                <p className="mt-1 text-sm text-slate-500">Default departure: {excursion.defaultStartTime}</p>
                <p className="text-sm text-slate-500">Meeting point: {excursion.meetingPoint}</p>
              </div>
              <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-700">Active</span>
            </div>

            <div className="mt-4 space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Provider prices</p>
              {excursion.providerOptions.map((option:any) => (
                <div key={option.providerId} className="flex items-center justify-between rounded-2xl bg-slate-50 p-3">
                  <div>
                    <p className="font-medium text-slate-900">{getProviderName(option.providerId, providers)}</p>
                    <p className="text-sm text-slate-500">Selectable override allowed per reservation</p>
                  </div>
                  <p className="font-semibold text-slate-900">{option.defaultPrice > 0 ? currency.format(option.defaultPrice) : "Transport only"}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
