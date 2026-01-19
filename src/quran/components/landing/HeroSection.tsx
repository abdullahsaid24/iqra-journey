import { Button } from "@/quran/components/ui/button";
import { Link } from "react-router-dom";

interface HeroSectionProps {
  isAuthenticated: boolean;
}

export const HeroSection = ({ isAuthenticated }: HeroSectionProps) => {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 md:px-6">
      <div className="text-center max-w-3xl mx-auto">
        <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
          Track Your Quran Learning Journey
        </h1>
        <p className="text-lg md:text-xl text-white/90 mb-8 px-4">
          A comprehensive progress tracking and management system designed
          for students, teachers, and parents. Track progress, set goals, and achieve
          excellence in your Quranic studies.
        </p>
        {!isAuthenticated && (
          <Link to="/quran/login">
            <Button 
              size="lg" 
              className="w-full sm:w-auto bg-white text-quran-bg hover:bg-white/90 transition-all transform hover:scale-105"
            >
              Get Started
            </Button>
          </Link>
        )}
      </div>
    </div>
  );
};
