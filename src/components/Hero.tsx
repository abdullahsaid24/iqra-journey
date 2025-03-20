
import { ArrowRight, BookOpen, Star } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const Hero = () => {
  return (
    <div className="relative h-screen w-full flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ 
            backgroundImage: "url('https://images.unsplash.com/photo-1466442929976-97f336a657be')",
            backgroundPosition: "center",
            backgroundSize: "cover"
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-background/70 via-background/80 to-background/95"></div>
        </div>
      </div>
      
      <div className="container relative px-4">
        <div className="max-w-3xl mx-auto text-center space-y-8">
          <div className="flex items-center justify-center mb-4">
            <div className="h-12 w-12 rounded-full bg-primary/20 text-primary flex items-center justify-center">
              <BookOpen className="h-6 w-6" />
            </div>
          </div>
          
          <h1 className="font-outfit text-4xl md:text-5xl lg:text-6xl font-semibold tracking-tight">
            Welcome to <span className="text-primary">Iqra Dugsi</span>
            <span className="block text-2xl text-primary/90 mt-3 font-normal">Proudly serving our community for over 20 years</span>
          </h1>
          
          <p className="text-lg md:text-xl text-muted-foreground leading-relaxed">
            Join our Islamic education center dedicated to teaching students of all ages the Quran, Islamic studies, Arabic, and reading skills.
          </p>

          <div className="flex flex-wrap justify-center gap-4 pt-2">
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
          
          <div className="mt-12 pt-8 flex items-center justify-center">
            <div className="flex items-center space-x-1 text-primary">
              <Star className="h-4 w-4 fill-primary" />
              <Star className="h-4 w-4 fill-primary" />
              <Star className="h-4 w-4 fill-primary" />
              <Star className="h-4 w-4 fill-primary" />
              <Star className="h-4 w-4 fill-primary" />
            </div>
            <span className="text-sm text-muted-foreground ml-2">Trusted by hundreds of families</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Hero;
