
import { useState, useEffect } from "react";
import Navigation from "@/components/Navigation";
import Hero from "@/components/Hero";
import Footer from "@/components/Footer";
import { BookOpen, Users, ExternalLink, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const Index = () => {
  const [showPaymentNotice, setShowPaymentNotice] = useState(true);
  
  // Features array
  const features = [
    {
      icon: <BookOpen className="h-6 w-6" />,
      title: "Quran & Islamic Studies",
      description:
        "Comprehensive curriculum focusing on Quran recitation, memorization, and understanding of Islamic principles.",
    },
    {
      icon: <Users className="h-6 w-6" />,
      title: "Classes for All Ages",
      description:
        "Multiple classes available for both brothers and sisters, catering to different learning levels and abilities.",
    },
  ];

  // Quote object
  const quote = {
    arabic: "خَيْرُكُمْ مَنْ تَعَلَّمَ الْقُرْآنَ وَعَلَّمَهُ",
    text: "The best among you are those who learn the Quran and teach it.",
    author: "Prophet Muhammad ﷺ",
    source: "Sahih al-Bukhari"
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      
      <main>
        <Hero />

        <section className="container px-4 py-24">
          {/* Features grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="card"
                style={{
                  animationDelay: `${index * 100}ms`,
                }}
              >
                <div className="h-12 w-12 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-outfit font-medium mb-2">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-muted py-24">
          <div className="container px-4">
            <blockquote className="max-w-3xl mx-auto text-center space-y-4">
              <p className="text-2xl md:text-3xl font-outfit mb-4">
                {quote.arabic}
              </p>
              <p className="text-xl md:text-2xl font-outfit">
                "{quote.text}"
              </p>
              <footer className="text-muted-foreground">
                <p>– {quote.author}</p>
                <p className="text-sm mt-1">{quote.source}</p>
              </footer>
            </blockquote>
          </div>
        </section>
      </main>

      {showPaymentNotice && (
        <div className="fixed bottom-4 right-4 z-50">
          <div className="bg-card rounded-lg shadow-lg border border-border/50 p-3 max-w-[280px] relative">
            <button 
              onClick={() => setShowPaymentNotice(false)}
              className="absolute top-1 right-1 text-muted-foreground hover:text-foreground p-1"
              aria-label="Close notification"
            >
              <X className="h-4 w-4" />
            </button>
            <h4 className="text-sm font-medium mb-1.5">Need to update your payment method?</h4>
            <p className="text-xs text-muted-foreground mb-2.5">
              Use the email you signed up with to access your billing portal.
            </p>
            <Button asChild size="sm" className="w-full text-xs py-1">
              <a 
                href="https://billing.stripe.com/p/login/fZe5mSaqA5iB4I84gg" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center justify-center"
              >
                Update Payment Method
                <ExternalLink className="ml-1.5 h-3 w-3" />
              </a>
            </Button>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};

export default Index;
