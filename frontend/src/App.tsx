import { Link, Route, Routes } from "react-router-dom";
import SatisfactionQuestionnaire from "./pages/SatisfactionQuestionnaire";
import Dashboard from "./pages/Dashboard";

export default function App() {
  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="border-b bg-white">
        <div className="mx-auto flex max-w-7xl items-center gap-4 px-6 py-4">
          <Link to="/" className="font-semibold text-gray-900">
            Survey Form
          </Link>
          <Link to="/dashboard" className="font-semibold text-gray-900">
            Dashboard
          </Link>
        </div>
      </nav>

      <Routes>
        <Route path="/" element={<SatisfactionQuestionnaire />} />
        <Route path="/dashboard" element={<Dashboard />} />
      </Routes>
    </div>
  );
}