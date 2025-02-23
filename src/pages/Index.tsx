
import Navigation from "@/components/Navigation";
import Hero from "@/components/Hero";
import Footer from "@/components/Footer";
import { Calendar, BookOpen, Users } from "lucide-react";

const Index = () => {
  const features = [
    {
      icon: <BookOpen className="h-6 w-6" />,
      title: "Quran & Islamic Studies",
      description:
        "Comprehensive curriculum focusing on Quran recitation, memorization, and understanding of Islamic principles.",
    },
    {
      icon: <Calendar className="h-6 w-6" />,
      title: "Flexible Schedule",
      description:
        "Classes available throughout the week, accommodating different age groups and learning levels.",
    },
    {
      icon: <Users className="h-6 w-6" />,
      title: "Expert Teachers",
      description:
        "Learn from qualified instructors dedicated to nurturing your spiritual and educational growth.",
    },
  ];

  const quote = {
    text: "The best among you are those who learn the Quran and teach it.",
    author: "Prophet Muhammad ﷺ",
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      
      <main>
        <Hero />

        <section className="container px-4 py-24">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
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
              <p className="text-2xl md:text-3xl font-outfit">
                "{quote.text}"
              </p>
              <footer className="text-muted-foreground">
                – {quote.author}
              </footer>
            </blockquote>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Index;
