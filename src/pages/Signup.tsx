import { useState } from "react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { Mail, Phone, User, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { useNavigate } from "react-router-dom";

interface Student {
  name: string;
  age: string;
}
type Registration = Database['public']['Tables']['registrations']['Insert'];
type RegistrationStudent = Database['public']['Tables']['registration_students']['Insert'];

const Signup = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isAdultSignup, setIsAdultSignup] = useState(false);
  const [students, setStudents] = useState<Student[]>([{
    name: "",
    age: ""
  }]);
  const [formData, setFormData] = useState({
    parentName: "",
    email: "",
    phone: ""
  });

  const handleParentInfoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleStudentChange = (index: number, field: keyof Student, value: string) => {
    const newStudents = [...students];
    newStudents[index][field] = value;
    setStudents(newStudents);
  };

  const addStudent = () => {
    setStudents([...students, {
      name: "",
      age: ""
    }]);
  };

  const removeStudent = (index: number) => {
    if (students.length > 1) {
      setStudents(students.filter((_, i) => i !== index));
    }
  };

  const createCheckoutSession = async (registrationId: string, maxRetries = 2) => {
    let retries = 0;

    const tryCheckout = async () => {
      try {
        const checkoutPayload = {
          studentCount: students.length,
          email: formData.email,
          successUrl: `${window.location.origin}/success?success=true`,
          cancelUrl: `${window.location.origin}/success?success=false`,
          registrationId: registrationId
        };

        console.log("Creating checkout session with payload:", checkoutPayload);

        const { data: checkoutData, error: checkoutError } = await supabase.functions.invoke('create-checkout-session', {
          body: checkoutPayload
        });

        console.log("Checkout response:", { data: checkoutData, error: checkoutError });

        if (checkoutError) {
          console.error('Checkout error:', checkoutError);
          throw new Error(`Checkout failed: ${checkoutError.message || "Unknown error"}`);
        }

        if (!checkoutData?.url) {
          throw new Error('Checkout URL not returned');
        }

        toast({
          title: "Registration Successful",
          description: "Redirecting to payment..."
        });

        console.log("Redirecting to checkout URL:", checkoutData.url);
        window.location.href = checkoutData.url;

      } catch (error) {
        console.error('Error in checkout process:', error);

        if (retries < maxRetries) {
          retries++;
          console.log(`Retry attempt ${retries}/${maxRetries}...`);
          await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second before retrying
          return tryCheckout();
        }

        toast({
          title: "Payment Setup Error",
          description: `There was a problem setting up the payment: ${error.message}. Please try again.`,
          variant: "destructive"
        });

        navigate("/success?success=false");
      }
    };

    return tryCheckout();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const registrationData: Registration = {
        registration_type: isAdultSignup ? 'adult' : 'parent',
        parent_name: isAdultSignup ? students[0].name : formData.parentName,
        email: formData.email,
        phone: formData.phone
      };

      console.log("Submitting registration data:", registrationData);

      const { data: registration, error: registrationError } = await supabase
        .from('registrations')
        .insert(registrationData)
        .select()
        .single();

      if (registrationError) {
        console.error('Registration error:', registrationError);
        throw new Error(`Registration failed: ${registrationError.message}`);
      }

      if (!registration?.id) {
        throw new Error('Registration ID not returned');
      }

      console.log("Registration successful:", registration);

      const studentsToInsert: RegistrationStudent[] = students.map(student => ({
        registration_id: registration.id,
        name: student.name,
        age: parseInt(student.age)
      }));

      console.log("Inserting students:", studentsToInsert);

      const { error: studentsError } = await supabase
        .from('registration_students')
        .insert(studentsToInsert);

      if (studentsError) {
        console.error('Students registration error:', studentsError);
        throw new Error(`Student registration failed: ${studentsError.message}`);
      }

      console.log("Students registered successfully");

      await createCheckoutSession(registration.id);

    } catch (error) {
      console.error('Error in registration process:', error);
      toast({
        title: "Registration Error",
        description: error.message || "There was a problem saving your registration. Please try again.",
        variant: "destructive"
      });
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />

      <main className="flex-1 py-16">
        <section className="container px-4">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-10">
              <h1 className="text-3xl md:text-4xl font-outfit font-bold mb-4 text-foreground">
                Student Registration
              </h1>
              <p className="text-lg text-muted-foreground">
                Join our Islamic education program today
              </p>
            </div>

            <div className="bg-card shadow-xl rounded-2xl overflow-hidden border border-border/50">
              <div className="grid grid-cols-2 p-2 gap-2 bg-muted/50 m-2 rounded-xl">
                <button
                  className={`py-3 rounded-lg text-sm font-medium transition-all duration-300 ${!isAdultSignup ? "bg-white text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                  onClick={() => setIsAdultSignup(false)}
                >
                  Parent Registration
                </button>
                <button
                  className={`py-3 rounded-lg text-sm font-medium transition-all duration-300 ${isAdultSignup ? "bg-white text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                  onClick={() => setIsAdultSignup(true)}
                >
                  Adult Registration
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-8">
                {/* Program Fees Box */}
                <div className="bg-primary/5 border border-primary/10 p-6 rounded-xl mb-8">
                  <h2 className="font-outfit font-bold text-lg mb-2 text-primary">Program Fees</h2>
                  <p className="text-muted-foreground mb-3">The registration fee is <span className="font-semibold text-foreground">$50 per student per month</span>.</p>
                  <p className="text-sm text-primary/80 leading-relaxed">
                    <strong>Important:</strong> If you are experiencing financial difficulties, please don't hesitate to discuss with our Mualim. We ensure that no student is denied education due to financial constraints.
                  </p>
                </div>

                {!isAdultSignup && (
                  <div className="mb-8 space-y-6">
                    <h2 className="text-xl font-outfit font-bold pb-2 border-b border-border">Parent/Guardian Information</h2>

                    <div className="space-y-5">
                      <div>
                        <Label htmlFor="parentName" className="text-sm font-medium block mb-2">Full Name</Label>
                        <Input
                          id="parentName"
                          name="parentName"
                          type="text"
                          required
                          value={formData.parentName}
                          onChange={handleParentInfoChange}
                          className="h-12 border-input bg-background"
                          placeholder="Parent's full name"
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div>
                          <Label htmlFor="email" className="text-sm font-medium block mb-2">Email Address</Label>
                          <Input
                            id="email"
                            name="email"
                            type="email"
                            required
                            value={formData.email}
                            onChange={handleParentInfoChange}
                            className="h-12 border-input bg-background"
                            placeholder="parent@example.com"
                          />
                        </div>

                        <div>
                          <Label htmlFor="phone" className="text-sm font-medium block mb-2">Phone Number</Label>
                          <Input
                            id="phone"
                            name="phone"
                            type="tel"
                            required
                            value={formData.phone}
                            onChange={handleParentInfoChange}
                            className="h-12 border-input bg-background"
                            placeholder="(555) 555-5555"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Students Information */}
                <div className="mb-8 space-y-6">
                  <div className="flex items-center justify-between pb-2 border-b border-border">
                    <h2 className="text-xl font-outfit font-bold">
                      {isAdultSignup ? "Student Information" : "Children Information"}
                    </h2>
                    {!isAdultSignup && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={addStudent}
                        className="flex items-center gap-2 hover:bg-primary/5 hover:text-primary transition-colors"
                      >
                        <Plus className="h-4 w-4" /> Add Student
                      </Button>
                    )}
                  </div>

                  {(isAdultSignup ? [students[0]] : students).map((student, index) => (
                    <div key={index} className="p-6 bg-muted/30 rounded-xl border border-border/50 space-y-5 relative group">
                      {!isAdultSignup && students.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeStudent(index)}
                          className="absolute top-4 right-4 text-muted-foreground hover:text-destructive transition-colors text-xs font-medium"
                        >
                          Remove
                        </button>
                      )}

                      <div className="flex items-center gap-2 mb-2">
                        <div className="h-6 w-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">
                          {index + 1}
                        </div>
                        <h3 className="font-medium text-foreground">
                          Student Details
                        </h3>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
                        <div className="md:col-span-3">
                          <Label htmlFor={`student-name-${index}`} className="text-sm font-medium block mb-2">Full Name</Label>
                          <Input
                            id={`student-name-${index}`}
                            type="text"
                            required
                            value={student.name}
                            onChange={e => handleStudentChange(index, "name", e.target.value)}
                            className="h-11 border-input bg-background"
                            placeholder="Student's name"
                          />
                        </div>

                        <div>
                          <Label htmlFor={`student-age-${index}`} className="text-sm font-medium block mb-2">Age</Label>
                          <Input
                            id={`student-age-${index}`}
                            type="number"
                            required
                            min={isAdultSignup ? "18" : "4"}
                            max={isAdultSignup ? "100" : "17"}
                            value={student.age}
                            onChange={e => handleStudentChange(index, "age", e.target.value)}
                            className="h-11 border-input bg-background"
                            placeholder="Age"
                          />
                        </div>
                      </div>

                      {isAdultSignup && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
                          <div>
                            <Label htmlFor="email" className="text-sm font-medium block mb-2">Email Address</Label>
                            <Input
                              id="email"
                              name="email"
                              type="email"
                              required
                              value={formData.email}
                              onChange={handleParentInfoChange}
                              className="h-11 border-input bg-background"
                              placeholder="student@example.com"
                            />
                          </div>

                          <div>
                            <Label htmlFor="phone" className="text-sm font-medium block mb-2">Phone Number</Label>
                            <Input
                              id="phone"
                              name="phone"
                              type="tel"
                              required
                              value={formData.phone}
                              onChange={handleParentInfoChange}
                              className="h-11 border-input bg-background"
                              placeholder="(555) 555-5555"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <Button
                  type="submit"
                  className="w-full h-14 text-lg font-medium rounded-xl shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all"
                  disabled={isLoading}
                >
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
