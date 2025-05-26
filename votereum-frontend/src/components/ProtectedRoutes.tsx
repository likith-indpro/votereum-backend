import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { authService } from "../services/apiService";

interface ProtectedRouteProps {
  children: ReactNode;
  requireAdmin?: boolean;
}

export default function ProtectedRoute({
  children,
  requireAdmin = false,
}: ProtectedRouteProps) {
  const location = useLocation();
  const isAuthenticated = !!authService.getCurrentUser();
  const isAdmin = authService.isAdmin();

  if (!isAuthenticated) {
    // Redirect to login if not authenticated
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requireAdmin && !isAdmin) {
    // Redirect to dashboard if admin access is required but user is not an admin
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
