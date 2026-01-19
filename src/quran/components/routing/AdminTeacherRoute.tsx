
import { ReactNode, useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useUserRole } from "@/quran/hooks/useUserRole";
import { Loader2 } from "lucide-react";

interface AdminTeacherRouteProps {
  children: ReactNode;
}

export const AdminTeacherRoute = ({ children }: AdminTeacherRouteProps) => {
  const { userRole, isLoading } = useUserRole();
  const location = useLocation();
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    if (!isLoading) {
      setIsAuthorized(userRole === 'admin' || userRole === 'teacher');
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
    // Check if they have a role and redirect to appropriate dashboard
    if (userRole === 'parent') {
      return <Navigate to="/quran/parent-dashboard" replace />;
    } else if (userRole === 'student') {
      return <Navigate to="/quran/student" replace />;
    }
    
    // If no valid role or not authenticated
    return <Navigate to="/quran/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};
