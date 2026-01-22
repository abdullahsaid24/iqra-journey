
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Navigation } from "@/components/landing/Navigation";
import { HeroSection } from "@/components/landing/HeroSection";
import { Loader2 } from "lucide-react";
import { useUserRole } from "@/hooks/useUserRole";
import { supabase } from "@/lib/supabase";
import { handleSignOut } from "@/lib/authUtils";

const Landing = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const { userRole, isLoading: isRoleLoading } = useUserRole();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          if (error.message.includes('Invalid Refresh Token')) {
            await supabase.auth.signOut();
            setIsAuthenticated(false);
            navigate('/login');
            return;
          }
          throw error;
        }

        setIsAuthenticated(!!session);
        
        // If authenticated and have role, redirect to appropriate dashboard
        if (session && userRole && !isRoleLoading) {
          redirectBasedOnRole(userRole);
        }
      } catch (error: any) {
        console.error('Auth check failed:', error);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN') {
        setIsAuthenticated(true);
        // Wait a moment for role to be loaded
        setTimeout(() => {
          if (userRole && !isRoleLoading) {
            redirectBasedOnRole(userRole);
          }
        }, 500);
      } else if (event === 'SIGNED_OUT') {
        setIsAuthenticated(false);
      }
    });

    const redirectBasedOnRole = (role: string | null) => {
      if (!role) return;
      
      if (role === 'admin' || role === 'teacher') {
        navigate('/dashboard');
      } else if (role === 'parent') {
        navigate('/parent-dashboard');
      } else if (role === 'student') {
        // For students, we'd need their ID
        // For simplicity, redirect to login
        navigate('/login');
      }
    };

    checkAuth();

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate, userRole, isRoleLoading]);

  useEffect(() => {
    if (isAuthenticated && userRole && !isRoleLoading) {
      if (userRole === 'admin' || userRole === 'teacher') {
        navigate('/dashboard');
      } else if (userRole === 'parent') {
        navigate('/parent-dashboard');
      } else if (userRole === 'student') {
        navigate('/student');
      }
    }
  }, [isAuthenticated, userRole, isRoleLoading, navigate]);

  const handleUserSignOut = async () => {
    await handleSignOut(navigate);
    setIsAuthenticated(false);
  };

  if (isLoading || (isAuthenticated && isRoleLoading)) {
    return (
      <div className="min-h-screen bg-quran-bg flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-white" />
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen bg-cover bg-center relative" 
      style={{ 
        backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)), url('https://images.unsplash.com/photo-1466442929976-97f336a657be?auto=format&fit=crop&q=80')` 
      }}
    >
      <Navigation isAuthenticated={isAuthenticated} onSignOut={handleUserSignOut} />
      <HeroSection isAuthenticated={isAuthenticated} />

      <div className="mt-12 md:mt-24 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto px-4 md:px-6 pb-12">
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 text-white">
            <h3 className="text-xl font-bold mb-3">For Teachers</h3>
            <p className="text-white/80">
              Efficiently manage your students' progress, track memorization, and provide
              detailed feedback on Tajweed.
            </p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 text-white">
            <h3 className="text-xl font-bold mb-3">For Students</h3>
            <p className="text-white/80">
              Track your progress, access your lessons, and receive guidance from your
              teachers to improve your Quranic recitation.
            </p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 text-white">
            <h3 className="text-xl font-bold mb-3">For Parents</h3>
            <p className="text-white/80">
              Stay involved in your child's Quranic education journey with detailed
              progress reports and direct communication with teachers.
            </p>
          </div>
      </div>
    </div>
  );
};

export default Landing;
