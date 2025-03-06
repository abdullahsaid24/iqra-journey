
import { useState } from "react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { Mail, Phone, User, Plus, Trash2 } from "lucide-react";
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
          phone: formData.phone,
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

        // Show success message
        toast({
          title: "Registration Successful",
          description: "Redirecting to payment..."
        });

        // Redirect to Stripe Checkout
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
        
        // Navigate to a fallback page if payment setup fails
        navigate("/success?success=false");
      }
    };
    
    return tryCheckout();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      // Insert registration data
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

      // Insert student information
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
      
      // Create Stripe checkout session with retry logic
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
  
  return <div className="min-h-screen flex flex-col">
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
              
              <div className="flex justify-center gap-4 mb-8">
                <Button variant={isAdultSignup ? "outline" : "default"} onClick={() => setIsAdultSignup(false)}>
                  Parent Registration
                </Button>
                <Button variant={isAdultSignup ? "default" : "outline"} onClick={() => setIsAdultSignup(true)}>
                  Adult Registration
                </Button>
              </div>
            </div>

            <div className="card">
              <div className="bg-muted p-4 rounded-lg mb-6">
                <h2 className="font-medium mb-2">Program Fees</h2>
                <p className="text-muted-foreground text-sm">The registration fee is $50 per student per month.</p>
                <p className="text-sm mt-2 text-primary">
                  Important: If you are experiencing financial difficulties, please don't hesitate to discuss with our Mualim. We ensure that no student is denied education due to financial constraints.
                </p>
                <p className="text-sm mt-2 text-muted-foreground">
                  Note: All registered students will be added to our Quran Portal system for online learning access.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-8">
                {!isAdultSignup &&
              // Parent/Guardian Information
              <div className="space-y-4">
                    <h3 className="text-lg font-medium">Parent/Guardian Information</h3>
                    <div className="grid gap-4">
                      <div>
                        <Label htmlFor="parentName">Full Name</Label>
                        <div className="flex mt-1.5">
                          <User className="w-4 h-4 text-muted-foreground mr-2 mt-3" />
                          <Input id="parentName" name="parentName" type="text" required value={formData.parentName} onChange={handleParentInfoChange} />
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="email">Email Address</Label>
                        <div className="flex mt-1.5">
                          <Mail className="w-4 h-4 text-muted-foreground mr-2 mt-3" />
                          <Input id="email" name="email" type="email" required value={formData.email} onChange={handleParentInfoChange} />
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="phone">Phone Number</Label>
                        <div className="flex mt-1.5">
                          <Phone className="w-4 h-4 text-muted-foreground mr-2 mt-3" />
                          <Input id="phone" name="phone" type="tel" required value={formData.phone} onChange={handleParentInfoChange} />
                        </div>
                      </div>
                    </div>
                  </div>}

                {/* Students Information */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium">
                      {isAdultSignup ? "Student Information" : "Children Information"}
                    </h3>
                    {!isAdultSignup && <Button type="button" variant="outline" size="sm" onClick={addStudent} className="flex items-center gap-2">
                        <Plus className="h-4 w-4" /> Add Student
                      </Button>}
                  </div>

                  {(isAdultSignup ? [students[0]] : students).map((student, index) => <div key={index} className="p-4 border rounded-lg space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">
                          {isAdultSignup ? "Personal Information" : `Student ${index + 1}`}
                        </h4>
                        {!isAdultSignup && students.length > 1 && <Button type="button" variant="ghost" size="sm" onClick={() => removeStudent(index)} className="text-destructive hover:text-destructive">
                            <Trash2 className="h-4 w-4" />
                          </Button>}
                      </div>

                      <div className="grid gap-4">
                        <div>
                          <Label htmlFor={`student-name-${index}`}>Full Name</Label>
                          <Input id={`student-name-${index}`} type="text" required value={student.name} onChange={e => handleStudentChange(index, "name", e.target.value)} />
                        </div>

                        <div>
                          <Label htmlFor={`student-age-${index}`}>Age</Label>
                          <Input id={`student-age-${index}`} type="number" required min={isAdultSignup ? "18" : "4"} max={isAdultSignup ? "100" : "17"} value={student.age} onChange={e => handleStudentChange(index, "age", e.target.value)} />
                        </div>

                        {isAdultSignup && <>
                            <div>
                              <Label htmlFor="email">Email Address</Label>
                              <div className="flex mt-1.5">
                                <Mail className="w-4 h-4 text-muted-foreground mr-2 mt-3" />
                                <Input id="email" name="email" type="email" required value={formData.email} onChange={handleParentInfoChange} />
                              </div>
                            </div>

                            <div>
                              <Label htmlFor="phone">Phone Number</Label>
                              <div className="flex mt-1.5">
                                <Phone className="w-4 h-4 text-muted-foreground mr-2 mt-3" />
                                <Input id="phone" name="phone" type="tel" required value={formData.phone} onChange={handleParentInfoChange} />
                              </div>
                            </div>
                          </>}
                      </div>
                    </div>)}
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
    </div>;
};

export default Signup;
