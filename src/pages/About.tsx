
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { GraduationCap, Book } from "lucide-react";

const About = () => {
  const offerings = [
    {
      title: "Quran Recitation & Memorization",
      description: "Master proper Quranic recitation and build a strong foundation in memorization.",
      icon: <Book className="h-6 w-6" />
    },
    {
      title: "Islamic Studies",
      description: "Comprehensive learning of Aqeedah, Fiqh, Seerah, and Hadith.",
      icon: <GraduationCap className="h-6 w-6" />
    }
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />

      <main className="flex-1 pt-16">
        <section className="relative py-24 bg-primary/5 overflow-hidden">
          <div className="container px-4 relative z-10">
            <div className="max-w-3xl mx-auto text-center">
              <h1 className="text-4xl md:text-5xl font-outfit font-bold mb-6 text-foreground">Who We Are</h1>
              <div className="h-1 w-24 bg-primary mx-auto rounded-full mb-8"></div>
              <p className="text-xl text-muted-foreground leading-relaxed">
                Iqra Dugsi is an Islamic learning center that focuses on Quranic education, Islamic studies, and Arabic literacy. Our mission is to ensure that students of all ages develop a deep understanding of their faith and can read and understand the Quran fluently.
              </p>
            </div>
          </div>
        </section>

        <section className="py-24">
          <div className="container px-4">
            <h2 className="text-3xl md:text-4xl font-outfit font-bold text-center mb-16">What We Offer</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              {offerings.map((offering, index) => (
                <div key={index} className="group bg-card rounded-xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 border border-border/50 hover:-translate-y-1">
                  <div className="h-14 w-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-6 group-hover:bg-primary group-hover:text-white transition-colors duration-300">
                    {offering.icon}
                  </div>
                  <h3 className="text-2xl font-outfit font-bold mb-4 text-foreground">
                    {offering.title}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed text-lg">
                    {offering.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="container px-4 pb-24">
          <div className="max-w-4xl mx-auto text-center bg-muted/50 rounded-3xl p-12 border border-border/50">
            <h2 className="text-3xl font-outfit font-bold mb-6">Our Commitment</h2>
            <p className="text-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto">
              Our dedicated teachers create a supportive and engaging environment to help students succeed in their spiritual journey. We believe in fostering a love for learning while building strong foundations in Islamic education.
            </p>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default About;
