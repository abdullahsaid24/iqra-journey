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
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-6">
              <h1 className="text-3xl font-outfit font-medium mb-4">
                Student Registration
              </h1>
              <p className="text-muted-foreground mb-6">
                Join our Islamic education program today
              </p>
              
              <div className="flex justify-center gap-4 mb-8">
                <Button 
                  className={!isAdultSignup ? "bg-[#8bac97] hover:bg-[#71a384]" : "bg-white text-black border border-gray-300 hover:bg-gray-100"} 
                  onClick={() => setIsAdultSignup(false)}
                >
                  Parent Registration
                </Button>
                <Button 
                  className={isAdultSignup ? "bg-[#8bac97] hover:bg-[#71a384]" : "bg-white text-black border border-gray-300 hover:bg-gray-100"} 
                  onClick={() => setIsAdultSignup(true)}
                >
                  Adult Registration
                </Button>
              </div>
            </div>

            <div className="bg-white shadow rounded-lg overflow-hidden border border-gray-100">
              <form onSubmit={handleSubmit} className="p-6">
                {/* Program Fees Box */}
                <div className="bg-gray-50 p-5 rounded-lg mb-6">
                  <h2 className="font-medium text-lg mb-2">Program Fees</h2>
                  <p className="text-muted-foreground">The registration fee is $50 per student per month.</p>
                  <p className="mt-2 text-[#71a384]">
                    Important: If you are experiencing financial difficulties, please don't hesitate to discuss with our Mualim. We ensure that no student is denied education due to financial constraints.
                  </p>
                  <p className="mt-2 text-muted-foreground">
                    Note: All registered students will be added to our Quran Portal system for online learning access.
                  </p>
                </div>

                {!isAdultSignup && (
                  <div className="mb-6">
                    <h2 className="text-lg font-medium mb-4">Parent/Guardian Information</h2>
                    
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="parentName" className="text-sm font-medium text-gray-700 block mb-1">Full Name</Label>
                        <Input 
                          id="parentName" 
                          name="parentName" 
                          type="text" 
                          required 
                          value={formData.parentName} 
                          onChange={handleParentInfoChange} 
                          className="w-full"
                        />
                      </div>

                      <div>
                        <Label htmlFor="email" className="text-sm font-medium text-gray-700 block mb-1">Email Address</Label>
                        <Input 
                          id="email" 
                          name="email" 
                          type="email" 
                          required 
                          value={formData.email} 
                          onChange={handleParentInfoChange} 
                          className="w-full"
                        />
                      </div>

                      <div>
                        <Label htmlFor="phone" className="text-sm font-medium text-gray-700 block mb-1">Phone Number</Label>
                        <Input 
                          id="phone" 
                          name="phone" 
                          type="tel" 
                          required 
                          value={formData.phone} 
                          onChange={handleParentInfoChange} 
                          className="w-full"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Students Information */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-medium">
                      {isAdultSignup ? "Student Information" : "Children Information"}
                    </h2>
                    {!isAdultSignup && (
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={addStudent} 
                        className="flex items-center gap-2"
                      >
                        <Plus className="h-4 w-4" /> Add Student
                      </Button>
                    )}
                  </div>

                  {(isAdultSignup ? [students[0]] : students).map((student, index) => (
                    <div key={index} className="p-4 border border-gray-100 rounded-lg mb-4">
                      <div className="mb-3">
                        <h3 className="font-medium">
                          {`Student ${index + 1}`}
                        </h3>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <Label htmlFor={`student-name-${index}`} className="text-sm font-medium text-gray-700 block mb-1">Full Name</Label>
                          <Input 
                            id={`student-name-${index}`} 
                            type="text" 
                            required 
                            value={student.name} 
                            onChange={e => handleStudentChange(index, "name", e.target.value)} 
                            className="w-full"
                          />
                        </div>

                        <div>
                          <Label htmlFor={`student-age-${index}`} className="text-sm font-medium text-gray-700 block mb-1">Age</Label>
                          <Input 
                            id={`student-age-${index}`} 
                            type="number" 
                            required 
                            min={isAdultSignup ? "18" : "4"} 
                            max={isAdultSignup ? "100" : "17"} 
                            value={student.age} 
                            onChange={e => handleStudentChange(index, "age", e.target.value)} 
                            className="w-full"
                          />
                        </div>

                        {isAdultSignup && (
                          <>
                            <div>
                              <Label htmlFor="email" className="text-sm font-medium text-gray-700 block mb-1">Email Address</Label>
                              <Input 
                                id="email" 
                                name="email" 
                                type="email" 
                                required 
                                value={formData.email} 
                                onChange={handleParentInfoChange} 
                                className="w-full"
                              />
                            </div>

                            <div>
                              <Label htmlFor="phone" className="text-sm font-medium text-gray-700 block mb-1">Phone Number</Label>
                              <Input 
                                id="phone" 
                                name="phone" 
                                type="tel" 
                                required 
                                value={formData.phone} 
                                onChange={handleParentInfoChange} 
                                className="w-full"
                              />
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <Button 
                  type="submit" 
                  className="w-full bg-[#8bac97] hover:bg-[#71a384] h-12 font-medium text-base" 
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
