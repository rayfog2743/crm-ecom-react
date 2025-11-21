import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/components/contexts/AuthContext";

type Props = { children: React.ReactNode };

const PublicRoute: React.FC<Props> = ({ children }) => {
  const { user, isLoading } = useAuth();

  // Show loading placeholder while auth subsystem determines state
  if (isLoading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  // If logged in — redirect to dashboard (replace history)
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  // otherwise show the public route (login, forgot password, etc.)
  return <>{children}</>;
};

export default PublicRoute;
