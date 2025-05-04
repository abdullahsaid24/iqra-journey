
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const Hero = () => {
  return (
    <div className="relative h-screen w-full flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1466442929976-97f336a657be')] bg-cover bg-center w-full">
        <div className="absolute inset-0 bg-gradient-to-b from-background/80 to-background/95"></div>
      </div>
      
      <div className="container relative px-4">
        <div className="max-w-3xl mx-auto text-center space-y-8">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-outfit font-bold">
            Welcome to Iqra Dugsi
            <span className="block text-2xl text-primary mt-2 font-normal">Proudly serving our community for over 20 years</span>
          </h1>
          
          <p className="text-lg md:text-xl text-muted-foreground leading-relaxed">
            Join our Islamic education center dedicated to teaching students of all ages the Quran, Islamic studies, Arabic, and reading skills.
          </p>

          <div className="flex flex-wrap justify-center gap-4">
            <Button asChild size="lg">
              <Link to="/classes">
                View Classes
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link to="/signup">Sign Up to Dugsi</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Hero;
