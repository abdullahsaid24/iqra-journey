
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
        <section className="container px-4 py-24">
          <div className="max-w-3xl mx-auto">
            <h1 className="section-title text-center mb-8">Who We Are</h1>
            <p className="text-lg text-muted-foreground text-center mb-12">
              Iqra Dugsi is an Islamic learning center that focuses on Quranic education, Islamic studies, and Arabic literacy. Our mission is to ensure that students of all ages develop a deep understanding of their faith and can read and understand the Quran fluently.
            </p>
          </div>
        </section>

        <section className="bg-muted py-24">
          <div className="container px-4">
            <h2 className="section-title text-center">What We Offer</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-12">
              {offerings.map((offering, index) => (
                <div key={index} className="card bg-card">
                  <div className="h-12 w-12 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-4">
                    {offering.icon}
                  </div>
                  <h3 className="text-xl font-outfit font-medium mb-2">
                    {offering.title}
                  </h3>
                  <p className="text-muted-foreground">
                    {offering.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="container px-4 py-24">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="section-title">Our Commitment</h2>
            <p className="text-lg text-muted-foreground">
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
