
import { useState, useEffect } from "react";
import Navigation from "@/components/Navigation";
import Hero from "@/components/Hero";
import Footer from "@/components/Footer";
import { BookOpen, Users, BookMarked, GraduationCap, ExternalLink, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

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
    {
      icon: <BookMarked className="h-6 w-6" />,
      title: "Arabic Language",
      description:
        "Learn to read, write and speak Arabic with our experienced teachers using modern teaching methods.",
    },
    {
      icon: <GraduationCap className="h-6 w-6" />,
      title: "Qualified Teachers",
      description:
        "Our teachers are qualified and experienced in teaching Islamic studies and the Arabic language.",
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
          <h2 className="text-3xl md:text-4xl font-outfit font-semibold text-center mb-12">
            Why Choose <span className="text-primary">Iqra Dugsi</span>
          </h2>
          
          {/* Features grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <Card
                key={index}
                className="border-none shadow-md hover:shadow-lg transition-all duration-300"
                style={{
                  animationDelay: `${index * 100}ms`,
                }}
              >
                <CardContent className="p-6">
                  <div className="h-12 w-12 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-4">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-outfit font-medium mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="bg-gradient-to-r from-primary/10 to-secondary/10 py-24">
          <div className="container px-4">
            <blockquote className="max-w-3xl mx-auto text-center space-y-4">
              <p className="text-2xl md:text-3xl font-outfit mb-4 text-foreground/90">
                {quote.arabic}
              </p>
              <p className="text-xl md:text-2xl font-outfit text-foreground/80">
                "{quote.text}"
              </p>
              <footer className="text-muted-foreground">
                <p className="font-medium">– {quote.author}</p>
                <p className="text-sm mt-1">{quote.source}</p>
              </footer>
            </blockquote>
          </div>
        </section>
      </main>

      {showPaymentNotice && (
        <div className="fixed bottom-4 right-4 z-50">
          <div className="bg-card rounded-lg shadow-lg border border-border/50 p-2 max-w-[220px] relative">
            <button 
              onClick={() => setShowPaymentNotice(false)}
              className="absolute top-1 right-1 text-muted-foreground hover:text-foreground p-0.5"
              aria-label="Close notification"
            >
              <X className="h-3 w-3" />
            </button>
            <h4 className="text-xs font-medium mb-1 pr-4">Need to update your payment method?</h4>
            <p className="text-xs text-muted-foreground mb-2 text-[11px]">
              Use the email you signed up with to access your billing portal.
            </p>
            <Button asChild size="sm" className="w-full text-xs py-0.5 h-7">
              <a 
                href="https://billing.stripe.com/p/login/fZe5mSaqA5iB4I84gg" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center justify-center"
              >
                Update Payment Method
                <ExternalLink className="ml-1 h-3 w-3" />
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
