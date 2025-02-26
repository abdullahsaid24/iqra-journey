
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Check } from "lucide-react";

const Success = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    toast({
      title: "Registration Complete",
      description: "Thank you for registering! We'll be in touch soon.",
    });
  }, [toast]);

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
