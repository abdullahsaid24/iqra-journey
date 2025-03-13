
import Navigation from "@/components/Navigation";
import Hero from "@/components/Hero";
import Footer from "@/components/Footer";
import { BookOpen, Users, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

const Index = () => {
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

      <div className="fixed bottom-6 right-6 z-50">
        <div className="bg-card rounded-lg shadow-lg border border-border/50 p-4 max-w-[320px]">
          <h4 className="text-sm font-medium mb-2">Need to update your payment method?</h4>
          <p className="text-xs text-muted-foreground mb-3">
            Use the email you signed up with to access your billing portal.
          </p>
          <Button asChild size="sm" className="w-full">
            <a 
              href="https://billing.stripe.com/p/login/fZe5mSaqA5iB4I84gg" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center justify-center"
            >
              Update Payment Method
              <ExternalLink className="ml-2 h-4 w-4" />
            </a>
          </Button>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Index;
