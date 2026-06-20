import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) return null;

  if (user?.email !== "ed.ufpe@gmail.com") {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
