import { Navigate } from "react-router-dom";

export default function ProtectedRoute({
  children,
}: {
  children: React.ReactNode;
}) {
  const token = localStorage.getItem("access");
  const meRaw = localStorage.getItem("me");

  if (!token || !meRaw) {
    return <Navigate to="/login" replace />;
  }

  const me = JSON.parse(meRaw);

  if (!me.is_staff) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}