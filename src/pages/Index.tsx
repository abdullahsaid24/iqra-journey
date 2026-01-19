import { useState } from "react";
import Navigation from "@/components/Navigation";
import Hero from "@/components/Hero";
import Footer from "@/components/Footer";
import { BookOpen, Users, X, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const Index = () => {
  const [showPaymentNotice, setShowPaymentNotice] = useState(true);

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
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-3xl md:text-5xl font-outfit font-bold text-foreground">
              Why Choose Iqra Dugsi?
            </h2>
            <div className="h-1 w-24 bg-primary mx-auto rounded-full"></div>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              We provide a nurturing environment where Islamic values meet educational excellence.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {features.map((feature, index) => (
              <Card
                key={index}
                className="group border-none shadow-lg hover:shadow-xl transition-all duration-300 bg-white hover:-translate-y-1"
              >
                <CardContent className="p-8 flex items-start gap-6">
                  <div className="h-16 w-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0 group-hover:bg-primary group-hover:text-white transition-colors duration-300">
                    {feature.icon}
                  </div>
                  <div className="text-left space-y-3">
                    <h3 className="text-2xl font-outfit font-bold text-foreground">
                      {feature.title}
                    </h3>
                    <p className="text-muted-foreground leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="relative py-24 overflow-hidden">
          <div className="absolute inset-0 bg-primary/5"></div>
          <div className="container px-4 relative">
            <div className="max-w-4xl mx-auto text-center space-y-8">
              <div className="inline-block p-4 rounded-full bg-primary/10 mb-4">
                <BookOpen className="h-8 w-8 text-primary" />
              </div>
              <blockquote className="space-y-6">
                <p className="text-3xl md:text-5xl font-outfit text-foreground/90 leading-tight" dir="rtl">
                  {quote.arabic}
                </p>
                <p className="text-xl md:text-2xl font-light text-muted-foreground italic">
                  "{quote.text}"
                </p>
                <footer className="pt-4">
                  <div className="font-semibold text-lg text-primary">{quote.author}</div>
                  <div className="text-sm text-muted-foreground">{quote.source}</div>
                </footer>
              </blockquote>
            </div>
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
