
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const Hero = () => {
  return (
    <div className="relative h-screen w-full flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0 bg-[url('/hero-bg.png')] bg-cover bg-center w-full animate-fade-in">
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-background"></div>
      </div>
      
      <div className="container relative px-4 text-center z-10">
        <div className="max-w-4xl mx-auto space-y-8 animate-slide-up">
          <div className="space-y-4">
            <h1 className="text-5xl md:text-7xl font-outfit font-bold tracking-tight text-white drop-shadow-lg">
              Iqra Dugsi
            </h1>
            <p className="text-2xl md:text-3xl text-primary-foreground/90 font-light font-outfit uppercase tracking-widest">
              Journey to Excellence
            </p>
            <p className="text-xl text-gray-200 mt-4 max-w-2xl mx-auto">
              Proudly serving our community for over 20 years with comprehensive Islamic education.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row justify-center gap-4 pt-8">
            <Button asChild size="lg" className="bg-primary hover:bg-primary/90 text-white text-lg px-8 h-14 rounded-full transition-transform hover:scale-105 duration-300">
              <Link to="/classes">
                View Classes
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/20 text-lg px-8 h-14 rounded-full transition-transform hover:scale-105 duration-300">
              <Link to="/signup">Join Our Community</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Hero;
