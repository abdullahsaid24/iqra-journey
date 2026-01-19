
import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />

      <main className="flex-1 container px-4 py-24">
        <div className="max-w-2xl mx-auto text-center">
          <div className="mb-8 flex justify-center">
            <div className="h-16 w-16 rounded-full bg-amber-100 flex items-center justify-center">
              <span className="text-2xl font-bold text-amber-600">404</span>
            </div>
          </div>

          <h1 className="text-3xl font-outfit font-medium mb-4">
            Page Not Found
          </h1>
          
          <p className="text-muted-foreground mb-8">
            We couldn't find the page you're looking for. This might be because:
          </p>

          <ul className="text-left list-disc pl-5 mb-8 text-muted-foreground">
            <li>The URL might be incorrect</li>
            <li>The page may have been moved or deleted</li>
            <li>You may have been redirected incorrectly after payment</li>
          </ul>

          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              If you just completed a payment and were redirected here, please contact us with your registration details.
            </p>
            
            <Link to="/">
              <Button className="mt-4">
                Return to Homepage
              </Button>
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default NotFound;
