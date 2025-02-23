
import { useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { Mail, Phone, User } from "lucide-react";

const stripePromise = loadStripe("your_publishable_key"); // Replace with your Stripe publishable key

const Signup = () => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    studentName: "",
    parentName: "",
    email: "",
    phone: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Here you would typically make an API call to your backend to create a Stripe Checkout session
      // For now, we'll just show a success message
      toast({
        title: "Success!",
        description: "You will be redirected to the payment page shortly.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />

      <main className="flex-1 pt-16">
        <section className="container px-4 py-24">
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-12">
              <h1 className="text-3xl font-outfit font-medium mb-4">
                Student Registration
              </h1>
              <p className="text-muted-foreground mb-6">
                Join our Islamic education program today
              </p>
            </div>

            <div className="card">
              <div className="bg-muted p-4 rounded-lg mb-6">
                <h2 className="font-medium mb-2">Program Fees</h2>
                <p className="text-muted-foreground text-sm">
                  The registration fee is $60 per student per month.
                </p>
                <p className="text-sm mt-2 text-primary">
                  Important: If you are experiencing financial difficulties, please don't hesitate to discuss with our Mualim. We ensure that no student is denied education due to financial constraints.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-4">
                  <div className="grid gap-2">
                    <Label htmlFor="studentName">Student's Full Name</Label>
                    <Input
                      id="studentName"
                      name="studentName"
                      type="text"
                      required
                      value={formData.studentName}
                      onChange={handleChange}
                      icon={<User className="h-4 w-4" />}
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="parentName">Parent/Guardian's Name</Label>
                    <Input
                      id="parentName"
                      name="parentName"
                      type="text"
                      required
                      value={formData.parentName}
                      onChange={handleChange}
                      icon={<User className="h-4 w-4" />}
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      required
                      value={formData.email}
                      onChange={handleChange}
                      icon={<Mail className="h-4 w-4" />}
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      required
                      value={formData.phone}
                      onChange={handleChange}
                      icon={<Phone className="h-4 w-4" />}
                    />
                  </div>
                </div>

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Processing..." : "Proceed to Payment"}
                </Button>
              </form>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Signup;
