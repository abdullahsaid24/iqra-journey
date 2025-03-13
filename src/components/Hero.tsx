
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const Hero = () => {
  return (
    <div className="relative h-screen w-screen flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1466442929976-97f336a657be')] bg-cover bg-center">
        <div className="absolute inset-0 bg-gradient-to-b from-background/80 to-background/95 backdrop-blur-sm"></div>
      </div>
      
      <div className="container relative px-4 animate-fade-in">
        <div className="max-w-3xl mx-auto text-center space-y-8">
          <h1 className="hero-title animate-slide-up">
            Welcome to Iqra Dugsi
            <span className="block text-2xl text-primary mt-2 font-normal">Proudly serving our community for over 20 years</span>
          </h1>
          
          <p className="text-lg md:text-xl text-muted-foreground animate-slide-up [animation-delay:200ms] leading-relaxed">
            Join our Islamic education center dedicated to teaching students of all ages the Quran, Islamic studies, Arabic, and reading skills.
          </p>

          <div className="flex flex-wrap justify-center gap-4 animate-slide-up [animation-delay:400ms]">
            <Button asChild size="lg" className="shadow-md hover:shadow-lg transition-all">
              <Link to="/classes">
                View Classes
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="shadow-sm hover:shadow-md transition-all">
              <Link to="/signup">Sign Up</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Hero;
