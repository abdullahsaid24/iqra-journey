
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { MapPin, Phone, Mail } from "lucide-react";

const Contact = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      
      <main className="flex-1 pt-16">
        <section className="container px-4 py-24">
          <div className="max-w-5xl mx-auto">
            <h1 className="section-title text-center mb-12">Contact Us</h1>
            
            <div className="max-w-2xl mx-auto">
              <div className="space-y-8">
                <div className="flex items-start gap-4">
                  <div className="h-12 w-12 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <MapPin className="h-6 w-6" />
                  </div>
                  <div>
                    <h2 className="font-outfit text-lg font-medium mb-2">Location</h2>
                    <p className="text-muted-foreground">3711A 98 St NW</p>
                    <p className="text-muted-foreground">Edmonton, AB, T6E 5V4</p>
                    <p className="text-muted-foreground">Canada</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="h-12 w-12 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <Phone className="h-6 w-6" />
                  </div>
                  <div>
                    <h2 className="font-outfit text-lg font-medium mb-2">Phone</h2>
                    <p className="text-muted-foreground">(780) 990-7823</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="h-12 w-12 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <Mail className="h-6 w-6" />
                  </div>
                  <div>
                    <h2 className="font-outfit text-lg font-medium mb-2">Email</h2>
                    <p className="text-muted-foreground">mualim@iqradugsi.com</p>
                  </div>
                </div>
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
