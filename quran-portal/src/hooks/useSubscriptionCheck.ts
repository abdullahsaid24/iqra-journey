import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const useSubscriptionCheck = () => {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const checkSubscription = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.log('No session found');
        setIsSubscribed(false);
        setIsLoading(false);
        return;
      }

      console.log('Checking subscription for user:', session.user.id);

      // First check if user is admin
      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', session.user.id)
        .eq('role', 'admin')
        .maybeSingle();

      if (roleError) {
        console.error('Error checking admin role:', roleError);
        throw roleError;
      }

      // If user is admin, check their subscription
      if (roleData) {
        console.log('User is admin, checking subscription');
        const { data: adminSubscription, error: subError } = await supabase
          .from('user_subscriptions')
          .select('is_active')
          .eq('user_id', session.user.id)
          .maybeSingle();
        
        if (subError) {
          console.error('Error checking admin subscription:', subError);
          throw subError;
        }

        console.log('Admin subscription status:', adminSubscription);
        setIsSubscribed(!!adminSubscription?.is_active);
        setIsLoading(false);
        return;
      }

      // For non-admin users, check if any admin has an active subscription
      const { data: anyActiveSubscription, error: activeSubError } = await supabase
        .from('user_subscriptions')
        .select('is_active')
        .eq('is_active', true)
        .maybeSingle();

      if (activeSubError) {
        console.error('Error checking active subscriptions:', activeSubError);
        throw activeSubError;
      }

      console.log('Any active subscription:', anyActiveSubscription);
      setIsSubscribed(!!anyActiveSubscription?.is_active);
    } catch (error: any) {
      console.error('Error checking subscription:', error);
      setIsSubscribed(false);
      toast.error('Error checking subscription status');
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isSubscribed,
    isLoading,
    checkSubscription
  };
};