    import { useState } from "react";
    import { useNavigate } from "react-router-dom";
    import { getMe, login } from "../lib/api";

    export default function LoginPage() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
        const tokens = await login(username, password);

        localStorage.setItem("access", tokens.access);
        localStorage.setItem("refresh", tokens.refresh);

        const me = await getMe(tokens.access);
        localStorage.setItem("me", JSON.stringify(me));

        if (!me.is_staff) {
            setError("This account is not allowed to view the dashboard.");
            localStorage.removeItem("access");
            localStorage.removeItem("refresh");
            localStorage.removeItem("me");
            setLoading(false);
            return;
        }

        navigate("/dashboard");
        } catch {
        setError("Invalid username or password.");
        } finally {
        setLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
        <form
            onSubmit={handleSubmit}
            className="w-full max-w-md rounded-3xl bg-white p-6 shadow-xl"
        >
              {/* LOGO */}
      <div className="flex justify-center">
        <img
          src="https://ecoadventurespc.com/wp-content/uploads/2018/12/cropped-logo1.png"
          alt="Eco Adventures Logo"
          className="h-16 w-auto"
        />
      </div>
            <h1 className="text-2xl font-bold text-slate-900">Admin Login</h1>
            <p className="mt-1 text-sm text-slate-500">
            Sign in to view the dashboard
            </p>

            <div className="mt-6 space-y-4">
            <input
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
            />

            <input
                type="password"
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
            />
            </div>

            {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

            <button
            type="submit"
            disabled={loading}
            className="mt-6 w-full rounded-2xl bg-slate-900 px-4 py-3 font-semibold text-white disabled:opacity-60"
            >
            {loading ? "Signing in..." : "Login"}
            </button>
        </form>
        </div>
    );
    }