
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Phone, Mail, MapPin, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";

const Contact = () => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: ""
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "Message Sent",
      description: "Thank you for contacting us. We'll get back to you soon!",
    });
    setFormData({ name: "", email: "", message: "" });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />

      <main className="flex-1 pt-16">
        <section className="relative py-24 bg-primary/5 overflow-hidden">
          <div className="container px-4 relative z-10">
            <div className="max-w-3xl mx-auto text-center">
              <h1 className="text-4xl md:text-5xl font-outfit font-bold mb-6 text-foreground">Contact Us</h1>
              <div className="h-1 w-24 bg-primary mx-auto rounded-full mb-8"></div>
              <p className="text-xl text-muted-foreground">
                We'd love to hear from you. Get in touch with us for any questions or inquiries.
              </p>
            </div>
          </div>
        </section>

        <section className="container px-4 py-24">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24">
              <div>
                <h2 className="text-2xl font-outfit font-bold mb-8 text-foreground">Get in Touch</h2>
                <div className="space-y-8">
                  <div className="flex items-start gap-6 group">
                    <div className="h-14 w-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0 group-hover:bg-primary group-hover:text-white transition-colors duration-300">
                      <MapPin className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="font-outfit font-bold text-lg mb-2 text-foreground">Visit Us</h3>
                      <p className="text-muted-foreground leading-relaxed">
                        3711A 98 St NW<br />
                        Edmonton, AB, T6E 5V4<br />
                        Canada
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-6 group">
                    <div className="h-14 w-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0 group-hover:bg-primary group-hover:text-white transition-colors duration-300">
                      <Phone className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="font-outfit font-bold text-lg mb-2 text-foreground">Call Us</h3>
                      <p className="text-muted-foreground font-medium text-lg">(780) 990-7823</p>
                      <p className="text-sm text-muted-foreground mt-1">Mon-Fri from 8am to 5pm</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-6 group">
                    <div className="h-14 w-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0 group-hover:bg-primary group-hover:text-white transition-colors duration-300">
                      <Mail className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="font-outfit font-bold text-lg mb-2 text-foreground">Email Us</h3>
                      <p className="text-muted-foreground font-medium text-lg">mualim@iqradugsi.com</p>
                      <p className="text-sm text-muted-foreground mt-1">We'll get back to you soon</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-card p-8 rounded-3xl shadow-lg border border-border/50">
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium mb-2 text-foreground">
                      Name
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 rounded-xl border border-input bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
                      placeholder="Your name"
                    />
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-sm font-medium mb-2 text-foreground">
                      Email
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 rounded-xl border border-input bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
                      placeholder="your@email.com"
                    />
                  </div>

                  <div>
                    <label htmlFor="message" className="block text-sm font-medium mb-2 text-foreground">
                      Message
                    </label>
                    <textarea
                      id="message"
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      required
                      rows={5}
                      className="w-full px-4 py-3 rounded-xl border border-input bg-background resize-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
                      placeholder="How can we help you?"
                    />
                  </div>

                  <Button type="submit" className="w-full h-12 text-lg font-medium rounded-xl">
                    Send Message
                    <Send className="ml-2 h-4 w-4" />
                  </Button>
                </form>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Contact;
