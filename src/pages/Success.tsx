
import { useEffect, useState } from "react";
import { useNavigate, useSearchParams, useLocation } from "react-router-dom";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Check, AlertTriangle } from "lucide-react";

const Success = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  
  // Check for success in the search parameter
  const [isSuccess, setIsSuccess] = useState(false);
  
  useEffect(() => {
    // Get the success parameter from the URL
    const successParam = searchParams.get("success");
    
    // If no success parameter, check if the path itself indicates success
    // This handles cases where query params might be lost
    const pathIndicatesSuccess = location.pathname === "/success" || 
                                location.pathname === "/success/" || 
                                location.pathname.includes("/succes");
    
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

    // Show appropriate toast based on success status
    if (isSuccessful) {
      toast.success("Registration Complete", {
        description: "Thank you for registering! We'll be in touch soon."
      });
    } else {
      toast.error("Registration Incomplete", {
        description: "There was an issue with your registration. Please try again."
      });
    }
  }, [searchParams, location]);

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
