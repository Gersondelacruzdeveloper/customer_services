import { useMemo, useState } from "react";
import { getExcursionById, getHotelById, totalPax } from "../lib/utils";
import { excursions } from "../data/excursions";
import { hotels } from "../data/hotels";
import { reservations } from "../data/Reservation";


export function ReservationsView() {
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return reservations;
    return reservations.filter((r) => {
      const hotel = getHotelById(r.hotelId, hotels)?.name ?? "";
      const excursion = getExcursionById(r.excursionId, excursions)?.name ?? "";
      return [r.locator, r.leadName, hotel, excursion, r.agency].join(" ").toLowerCase().includes(q);
    });
  }, [query]);

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Reservations</h3>
            <p className="text-sm text-slate-500">Clean list replacing the old desktop system screen.</p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search reservations..."
              className="rounded-2xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-slate-400"
            />
            <button className="rounded-2xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white">Add reservation</button>
          </div>
        </div>

        <div className="mt-5 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500">
                <th className="py-3 pr-4 font-medium">Locator</th>
                <th className="py-3 pr-4 font-medium">Client</th>
                <th className="py-3 pr-4 font-medium">Excursion</th>
                <th className="py-3 pr-4 font-medium">Hotel</th>
                <th className="py-3 pr-4 font-medium">Date</th>
                <th className="py-3 pr-4 font-medium">Pickup</th>
                <th className="py-3 pr-4 font-medium">Pax</th>
                <th className="py-3 pr-4 font-medium">Language</th>
                <th className="py-3 pr-4 font-medium">Agency</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => (
                <tr key={item.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                  <td className="py-3 pr-4 font-semibold text-slate-900">{item.locator}</td>
                  <td className="py-3 pr-4">{item.leadName}</td>
                  <td className="py-3 pr-4">{getExcursionById(item.excursionId, excursions)?.name}</td>
                  <td className="py-3 pr-4">{getHotelById(item.hotelId, hotels)?.name}</td>
                  <td className="py-3 pr-4">{item.serviceDate}</td>
                  <td className="py-3 pr-4">{item.pickupTime}</td>
                  <td className="py-3 pr-4">{totalPax(item)}</td>
                  <td className="py-3 pr-4 uppercase">{item.language}</td>
                  <td className="py-3 pr-4">{item.agency}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
