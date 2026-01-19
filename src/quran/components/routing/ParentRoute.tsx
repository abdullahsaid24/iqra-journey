
import { ReactNode, useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useUserRole } from "@/quran/hooks/useUserRole";
import { Loader2 } from "lucide-react";

interface ParentRouteProps {
  children: ReactNode;
}

export const ParentRoute = ({ children }: ParentRouteProps) => {
  const { userRole, isLoading } = useUserRole();
  const location = useLocation();
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    if (!isLoading) {
      setIsAuthorized(userRole === 'parent');
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
      return <Navigate to="/quran/dashboard" replace />;
    } else if (userRole === 'student') {
      return <Navigate to="/quran/student" replace />;
    }
    
    // If no valid role or not authenticated
    return <Navigate to="/quran/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};
