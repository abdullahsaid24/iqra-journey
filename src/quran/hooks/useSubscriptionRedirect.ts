import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const useSubscriptionRedirect = () => {
  const redirectToCheckout = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Please sign in to subscribe");
        return;
      }

      const response = await fetch(
        'https://npyjkhnkdmksjqitmayi.supabase.co/functions/v1/create-checkout',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
          },
        }
      );

      const { url, error } = await response.json();
      
      if (error) {
        console.error('Error:', error);
        toast.error(error);
        return;
      }

      if (url) {
        window.location.href = url;
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error("Failed to start checkout process");
    }
  };

  return { redirectToCheckout };
};
