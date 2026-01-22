
import { supabase } from "./supabase";
import { toast } from "sonner";
import { NavigateFunction } from "react-router-dom";

/**
 * Handles signing out a user safely with proper cleanup and error handling
 */
export const handleSignOut = async (navigate: NavigateFunction): Promise<void> => {
  try {
    // First check if a session actually exists to avoid unnecessary API calls
    const { data: { session } } = await supabase.auth.getSession();
    
    // Always clean up local storage regardless of session state
    localStorage.removeItem('supabase.auth.token');
    
    if (session) {
      // Attempt to sign out properly through Supabase
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('Error during sign out:', error);
        // Still redirect even if there's an API error
        navigate("/login");
        toast.success("Signed out successfully");
        return;
      }
    }

    // Always navigate to login page after logout attempt
    navigate("/login");
    toast.success("Signed out successfully");
    
  } catch (error: any) {
    // Catch any unexpected errors
    console.error('Sign out error:', error);
    
    // Clean up local storage to ensure user gets logged out
    localStorage.removeItem('supabase.auth.token');
    
    navigate("/login");
    toast.error("An error occurred while signing out, but you've been logged out");
  }
};
