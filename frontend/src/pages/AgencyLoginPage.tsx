import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { login, getAgencyPortal } from "../lib/api";

export default function AgencyLoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    setError("");

    try {
      setLoading(true);

      const tokens = await login(username, password);

      localStorage.setItem("access", tokens.access);
      localStorage.setItem("refresh", tokens.refresh);

      const agencyPortal = await getAgencyPortal();

      if (!agencyPortal.agency_id) {
        localStorage.removeItem("access");
        localStorage.removeItem("refresh");

        setError("This account is not linked to an agency.");
        return;
      }

      localStorage.setItem(
        "agency_portal",
        JSON.stringify(agencyPortal),
      );

      navigate("/agency/reservations");
    } catch (error) {
      console.error(error);
      setError("Invalid username or password.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md rounded-3xl bg-white p-8 shadow-sm"
      >
        <h1 className="text-2xl font-bold text-slate-950">
          Agency Portal
        </h1>

        <p className="mt-2 text-sm text-slate-500">
          Login to manage reservations.
        </p>

        {error && (
          <div className="mt-4 rounded-2xl bg-red-50 p-3 text-sm text-red-600">
            {error}
          </div>
        )}

        <input
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Username"
          className="mt-6 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm"
        />

        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          className="mt-3 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm"
        />

        <button
          type="submit"
          disabled={loading}
          className="mt-6 w-full rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
        >
          {loading ? "Logging in..." : "Login"}
        </button>
      </form>
    </div>
  );
}