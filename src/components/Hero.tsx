
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const Hero = () => {
  return (
    <div className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1466442929976-97f336a657be')] bg-cover bg-center">
        <div className="absolute inset-0 bg-background/90 backdrop-blur-sm"></div>
      </div>
      
      <div className="container relative px-4 py-32 animate-fade-in">
        <div className="max-w-3xl mx-auto text-center space-y-8">
          <h1 className="hero-title animate-slide-up">
            Welcome to Iqra Dugsi
          </h1>
          
          <p className="text-lg md:text-xl text-muted-foreground animate-slide-up [animation-delay:200ms]">
            Join our Islamic education center dedicated to teaching students of all ages the Quran, Islamic studies, Arabic, and reading skills.
          </p>

          <div className="flex flex-wrap justify-center gap-4 animate-slide-up [animation-delay:400ms]">
            <Button asChild size="lg">
              <Link to="/classes">
                View Classes
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link to="/signup">Sign Up</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Hero;
