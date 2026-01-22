
import { Button } from "@/components/ui/button";
import { AuthForm } from "@/components/AuthForm";
import { Link, Navigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useUserRole } from "@/hooks/useUserRole";
import { Loader2 } from "lucide-react";

const Login = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const { userRole, isLoading: isRoleLoading } = useUserRole();

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
      setIsAuthenticated(!!session);
      setIsLoading(false);
    });

    checkAuth();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // If authenticated, redirect based on role
  if (!isLoading && isAuthenticated && userRole) {
    if (userRole === 'admin' || userRole === 'teacher') {
      return <Navigate to="/dashboard" replace />;
    } else if (userRole === 'parent') {
      return <Navigate to="/parent-dashboard" replace />;
    } else if (userRole === 'student') {
      return <Navigate to="/student" replace />;
    }
  }

  if (isLoading || (isAuthenticated && isRoleLoading)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-quran-bg to-quran-light">
        <Loader2 className="h-8 w-8 animate-spin text-white" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-quran-bg to-quran-light">
      <div className="container mx-auto px-4 py-8">
        <Link to="/">
          <Button
            variant="ghost"
            className="mb-8 text-white hover:bg-white/10 transition-all duration-300"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Button>
        </Link>

        <div className="mx-auto max-w-md">
          <div className="mb-8 text-center">
            <h1 className="mb-2 text-4xl font-bold text-white font-arabic animate-fade-in">
              Iqra Dugsi
            </h1>
            <h2 className="mb-2 text-2xl font-semibold text-white/90 animate-fade-in delay-75">
              QuranProgress
            </h2>
            <p className="text-white/80 animate-fade-in delay-100">
              Sign in to continue your Quran learning journey
            </p>
          </div>

          <div className="rounded-xl border border-white/20 bg-white/10 p-8 backdrop-blur-xl shadow-xl animate-scale-in">
            <div className="mb-6 text-center">
              <p className="text-xl font-arabic text-white/90 font-medium">
                بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ
              </p>
            </div>
            <AuthForm mode="signin" role="teacher" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
