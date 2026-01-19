import { createContext, useContext, useEffect } from "react";
import { useSubscriptionCheck } from "@/quran/hooks/useSubscriptionCheck";
import { useSubscriptionRedirect } from "@/quran/hooks/useSubscriptionRedirect";

interface SubscriptionContextType {
  isSubscribed: boolean;
  isLoading: boolean;
  checkSubscription: () => Promise<void>;
  redirectToCheckout: () => void;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export const SubscriptionProvider = ({ children }: { children: React.ReactNode }) => {
  const { isSubscribed, isLoading, checkSubscription } = useSubscriptionCheck();
  const { redirectToCheckout } = useSubscriptionRedirect();

  useEffect(() => {
    checkSubscription();
  }, []);

  return (
    <SubscriptionContext.Provider value={{ 
      isSubscribed, 
      isLoading, 
      checkSubscription, 
      redirectToCheckout 
    }}>
      {children}
    </SubscriptionContext.Provider>
  );
};

export const useSubscription = () => {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
};
