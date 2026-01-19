
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";

export const useUserRole = () => {
  const [isLoading, setIsLoading] = useState(true);
  
  const { data: userRole, isError } = useQuery({
    queryKey: ['userRole'],
    queryFn: async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          setIsLoading(false);
          return null;
        }
        
        const { data, error } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', session.user.id)
          .maybeSingle();
        
        if (error) {
          console.error('Error checking user role:', error);
          throw error;
        }
        
        return data?.role;
      } catch (error) {
        console.error('Error in useUserRole:', error);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    retry: 1
  });

  // Make sure loading state is properly managed
  useEffect(() => {
    if (userRole !== undefined) {
      setIsLoading(false);
    }
  }, [userRole]);

  const isAdmin = userRole === 'admin';
  const isTeacher = userRole === 'teacher';
  const isParent = userRole === 'parent';
  const isStudent = userRole === 'student';

  return { 
    userRole, 
    isAdmin, 
    isTeacher,
    isParent,
    isStudent,
    isLoading: isLoading,
    isError
  };
};
