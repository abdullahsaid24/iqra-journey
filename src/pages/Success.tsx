
import { useEffect, useState } from "react";
import { useNavigate, useSearchParams, useLocation } from "react-router-dom";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { Check, AlertTriangle } from "lucide-react";
import { supabase, syncRegistrationsWithStripe } from "@/integrations/supabase/client";

const Success = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  
  // Check for success in the search parameter
  const [isSuccess, setIsSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    // Get the success parameter from the URL
    const successParam = searchParams.get("success");
    
    // If no success parameter, check if the path itself indicates success
    // This handles cases where query params might be lost
    const pathIndicatesSuccess = location.pathname === "/success" || 
                                location.pathname === "/success/" || 
                                location.pathname.includes("/success");
    
    const isSuccessful = successParam === "true" || (successParam === null && pathIndicatesSuccess);
    
    console.log("Success page loaded", { 
      path: location.pathname,
      search: location.search,
      successParam,
      pathIndicatesSuccess,
      isSuccessful,
      fullUrl: window.location.href
    });

    // Set the state based on the parameter
    setIsSuccess(isSuccessful);
    setIsLoading(false);

    // Show appropriate toast based on success status
    if (isSuccessful) {
      toast({
        title: "Registration Complete",
        description: "Thank you for registering! We'll be in touch soon.",
        variant: "default",
      });
      
      // Optionally, update the registration status in Supabase
      // This is a backup in case the webhook hasn't processed yet
      const sessionId = searchParams.get("session_id");
      if (sessionId) {
        updateRegistrationStatus(sessionId);
      }
    } else {
      toast({
        title: "Registration Incomplete",
        description: "There was an issue with your registration. Please try again.",
        variant: "destructive",
      });
    }

    // Try to sync registrations with Stripe to ensure all records are up-to-date
    // This helps ensure our database is in sync with Stripe's records
    syncRegistrations();
  }, [searchParams, location]);
  
  const syncRegistrations = async () => {
    // Run the synchronization in the background
    try {
      const result = await syncRegistrationsWithStripe();
      if (result.success) {
        console.log('Successfully synchronized registrations with Stripe:', result.data);
      } else {
        console.error('Error synchronizing registrations:', result.error);
      }
    } catch (error) {
      console.error('Exception during registration synchronization:', error);
    }
  };
  
  const updateRegistrationStatus = async (sessionId: string) => {
    try {
      // Call our Supabase edge function to check the session status
      const { data, error } = await supabase.functions.invoke('stripe-webhook', {
        body: { 
          type: 'checkout.session.completed',
          session_id: sessionId
        }
      });
      
      if (error) {
        console.error('Error updating registration status:', error);
      } else {
        console.log('Registration status updated:', data);
      }
    } catch (error) {
      console.error('Error updating registration status:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navigation />
        <main className="flex-1 container px-4 py-24">
          <div className="max-w-2xl mx-auto text-center">
            <p>Loading...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!isSuccess) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navigation />

        <main className="flex-1 container px-4 py-24">
          <div className="max-w-2xl mx-auto text-center">
            <div className="mb-8 flex justify-center">
              <div className="h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center">
                <AlertTriangle className="h-8 w-8 text-destructive" />
              </div>
            </div>

            <h1 className="text-3xl font-outfit font-medium mb-4">
              Registration Unsuccessful
            </h1>
            
            <p className="text-muted-foreground mb-8">
              We encountered an issue processing your registration. This could be due to a payment problem or a technical error.
            </p>

            <div className="space-y-4">
              <Button onClick={() => navigate("/signup")} className="mt-4">
                Try Again
              </Button>
            </div>
          </div>
        </main>

        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />

      <main className="flex-1 container px-4 py-24">
        <div className="max-w-2xl mx-auto text-center">
          <div className="mb-8 flex justify-center">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Check className="h-8 w-8 text-primary" />
            </div>
          </div>

          <h1 className="text-3xl font-outfit font-medium mb-4">
            Registration Successful
          </h1>
          
          <p className="text-muted-foreground mb-8">
            Thank you for registering with our Islamic education program. Your payment has been processed successfully. We will review your registration and contact you soon with next steps.
          </p>

          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Please check your email for confirmation details.
            </p>
            
            <Button onClick={() => navigate("/")} className="mt-4">
              Return to Homepage
            </Button>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Success;
