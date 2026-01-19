
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/quran/lib/supabase";
import { toast } from "sonner";
import { useUserRole } from "./useUserRole";

export const useAuthRedirect = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigate = useNavigate();
  const { userRole } = useUserRole();

  useEffect(() => {
    // Check if the user is authenticated
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
        setIsLoading(false);
      } catch (error) {
        console.error("Auth check failed:", error);
        setIsAuthenticated(false);
        setIsLoading(false);
      }
    };

    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setIsAuthenticated(!!session);
    });

    checkAuth();

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate]);

  // Get redirect path based on user role
  const getRedirectPath = () => {
    if (!userRole) return "/quran/login";
    
    switch (userRole) {
      case "admin":
      case "teacher":
        return "/quran/dashboard";
      case "parent":
        return "/quran/parent-dashboard";
      case "student":
        return "/quran/student"; // Will need the ID appended in practice
      default:
        return "/quran/login";
    }
  };

  return { isLoading, isAuthenticated, userRole, getRedirectPath };
};
