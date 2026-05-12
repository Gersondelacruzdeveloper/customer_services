import { useEffect, useMemo, useState } from "react";
import { KeyRound, Save, Search, Pencil, RefreshCcw } from "lucide-react";
import { getAgencies, updateAgencyAccess } from "../lib/api";

type Agency = {
  id: number;
  name: string;
  email?: string;
  user?: number | null;
  login_username?: string;
  login_email?: string;
};

export function AgencyAccessView() {
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [selectedAgency, setSelectedAgency] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [editingAgencyId, setEditingAgencyId] = useState<number | null>(null);

  useEffect(() => {
    loadAgencies();
  }, []);

  async function loadAgencies() {
    const data = (await getAgencies()) as Agency[];
    setAgencies(data);
  }

  const filteredAgencies = useMemo(() => {
    const term = search.toLowerCase();

    return agencies.filter((agency) =>
      agency.name.toLowerCase().includes(term) ||
      agency.login_username?.toLowerCase().includes(term) ||
      agency.login_email?.toLowerCase().includes(term) ||
      agency.email?.toLowerCase().includes(term)
    );
  }, [agencies, search]);

  function resetForm() {
    setSelectedAgency("");
    setUsername("");
    setPassword("");
    setEmail("");
    setEditingAgencyId(null);
  }

  function handleEditAgency(agency: Agency) {
    setEditingAgencyId(agency.id);
    setSelectedAgency(String(agency.id));
    setUsername(agency.login_username || "");
    setEmail(agency.login_email || agency.email || "");
    setPassword("");
  }

  async function handleSaveAccess() {
    if (!selectedAgency) {
      alert("Por favor seleccione una agencia");
      return;
    }

    if (!username) {
      alert("El nombre de usuario es obligatorio");
      return;
    }

    if (!editingAgencyId && !password) {
      alert("La contraseña es obligatoria");
      return;
    }

    const payload: {
      username: string;
      email?: string;
      password?: string;
    } = {
      username,
      email,
    };

    if (password.trim()) {
      payload.password = password;
    }

    try {
      setLoading(true);

      await updateAgencyAccess(Number(selectedAgency), payload);

      alert(
        editingAgencyId
          ? "Acceso de la agencia actualizado correctamente"
          : "Acceso de la agencia creado correctamente"
      );

      resetForm();
      await loadAgencies();
    } catch (error) {
      console.error(error);
      alert("Error al guardar el acceso de la agencia");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-6 flex items-center gap-3">
          <div className="rounded-2xl bg-slate-100 p-3 text-slate-700">
            <KeyRound className="h-5 w-5" />
          </div>

          <div>
            <h2 className="text-2xl font-bold text-slate-950">
              Acceso de Agencias
            </h2>
            <p className="text-sm text-slate-500">
              Crear o actualizar credenciales de acceso para agencias.
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <select
            value={selectedAgency}
            onChange={(e) => setSelectedAgency(e.target.value)}
            className="rounded-2xl border border-slate-200 px-4 py-3 text-sm"
          >
            <option value="">Seleccionar agencia</option>
            {agencies.map((agency) => (
              <option key={agency.id} value={agency.id}>
                {agency.name}
              </option>
            ))}
          </select>

          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Nombre de usuario"
            className="rounded-2xl border border-slate-200 px-4 py-3 text-sm"
          />

          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={
              editingAgencyId
                ? "Nueva contraseña opcional"
                : "Contraseña"
            }
            className="rounded-2xl border border-slate-200 px-4 py-3 text-sm"
          />

          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Correo electrónico opcional"
            className="rounded-2xl border border-slate-200 px-4 py-3 text-sm"
          />
        </div>

        <button
          type="button"
          onClick={handleSaveAccess}
          disabled={loading}
          className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white"
        >
          {editingAgencyId ? (
            <RefreshCcw className="h-4 w-4" />
          ) : (
            <Save className="h-4 w-4" />
          )}

          {loading
            ? "Guardando..."
            : editingAgencyId
            ? "Actualizar acceso"
            : "Crear acceso"}
        </button>

        {editingAgencyId && (
          <button
            type="button"
            onClick={resetForm}
            className="ml-3 rounded-2xl border border-slate-200 px-5 py-3 text-sm font-semibold"
          >
            Cancelar
          </button>
        )}
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-5 flex items-center justify-between gap-3">
          <h3 className="text-lg font-bold text-slate-950">
            Accesos de agencias
          </h3>

          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar agencia..."
              className="w-full rounded-2xl border border-slate-200 py-3 pl-10 pr-4 text-sm"
            />
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Agencia</th>
                <th className="px-4 py-3">Usuario</th>
                <th className="px-4 py-3">Correo</th>
                <th className="px-4 py-3 text-right">Acción</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {filteredAgencies.map((agency) => (
                <tr key={agency.id}>
                  <td className="px-4 py-3 font-semibold">
                    {agency.name}
                  </td>

                  <td className="px-4 py-3">
                    {agency.login_username || "Sin acceso todavía"}
                  </td>

                  <td className="px-4 py-3">
                    {agency.login_email || agency.email || "—"}
                  </td>

                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => handleEditAgency(agency)}
                      className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold"
                    >
                      <Pencil className="h-3.5 w-3.5" />

                      {agency.login_username
                        ? "Cambiar contraseña"
                        : "Crear acceso"}
                    </button>
                  </td>
                </tr>
              ))}

              {filteredAgencies.length === 0 && (
                <tr>
                  <td
                    colSpan={4}
                    className="px-4 py-8 text-center text-slate-500"
                  >
                    No se encontraron agencias.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}