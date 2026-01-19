
import { ReactNode, useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { supabase } from "@/quran/lib/supabase";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: ReactNode;
}

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("Auth error:", error);
          setIsAuthenticated(false);
          setIsLoading(false);
          return;
        }
        
        setIsAuthenticated(!!session);
      } catch (error) {
        console.error("Auth check failed:", error);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        // Force set authenticated to false on sign out
        setIsAuthenticated(false);
        setIsLoading(false);
      } else {
        setIsAuthenticated(!!session);
        setIsLoading(false);
      }
    });

    checkAuth();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-quran-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    // Redirect them to the login page and save their intended destination
    return <Navigate to="/quran/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};
