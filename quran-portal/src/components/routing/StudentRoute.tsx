
import { ReactNode, useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useUserRole } from "@/hooks/useUserRole";
import { Loader2 } from "lucide-react";

interface StudentRouteProps {
  children: ReactNode;
}

export const StudentRoute = ({ children }: StudentRouteProps) => {
  const { userRole, isLoading } = useUserRole();
  const location = useLocation();
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    if (!isLoading) {
      setIsAuthorized(userRole === 'student');
    }
  }, [userRole, isLoading]);

  if (isLoading || isAuthorized === null) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-quran-primary" />
      </div>
    );
  }

  if (!isAuthorized) {
    // Redirect to appropriate dashboard based on role
    if (userRole === 'admin' || userRole === 'teacher') {
      return <Navigate to="/dashboard" replace />;
    } else if (userRole === 'parent') {
      return <Navigate to="/parent-dashboard" replace />;
    }
    
    // If no valid role or not authenticated
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};
