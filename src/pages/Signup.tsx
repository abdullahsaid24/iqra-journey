import { useState } from "react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { Mail, Phone, User, Plus, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Student {
  name: string;
  age: string;
}

const Signup = () => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isAdultSignup, setIsAdultSignup] = useState(false);
  const [students, setStudents] = useState<Student[]>([{ name: "", age: "" }]);
  const [formData, setFormData] = useState({
    parentName: "",
    email: "",
    phone: "",
  });

  const handleParentInfoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleStudentChange = (index: number, field: keyof Student, value: string) => {
    const newStudents = [...students];
    newStudents[index][field] = value;
    setStudents(newStudents);
  };

  const addStudent = () => {
    setStudents([...students, { name: "", age: "" }]);
  };

  const removeStudent = (index: number) => {
    if (students.length > 1) {
      setStudents(students.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Insert registration data
      const { data: registration, error: registrationError } = await supabase
        .from('registrations')
        .insert({
          registration_type: isAdultSignup ? 'adult' : 'parent',
          parent_name: isAdultSignup ? students[0].name : formData.parentName,
          email: formData.email,
          phone: formData.phone,
        })
        .select()
        .single();

      if (registrationError) throw registrationError;

      // Insert student information
      const studentsToInsert = students.map(student => ({
        registration_id: registration.id,
        name: student.name,
        age: parseInt(student.age),
      }));

      const { error: studentsError } = await supabase
        .from('registration_students')
        .insert(studentsToInsert);

      if (studentsError) throw studentsError;

      // Redirect to Stripe payment
      const baseUrl = "https://buy.stripe.com/5kA17652s7Ui1uEcMM";
      const quantity = students.length;
      const finalUrl = `${baseUrl}#quantity=${quantity}`;
      window.location.href = finalUrl;

    } catch (error) {
      console.error('Error saving registration:', error);
      toast({
        title: "Registration Error",
        description: "There was a problem saving your registration. Please try again.",
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
              
              <div className="flex justify-center gap-4 mb-8">
                <Button
                  variant={isAdultSignup ? "outline" : "default"}
                  onClick={() => setIsAdultSignup(false)}
                >
                  Parent Registration
                </Button>
                <Button
                  variant={isAdultSignup ? "default" : "outline"}
                  onClick={() => setIsAdultSignup(true)}
                >
                  Adult Registration
                </Button>
              </div>
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
                <p className="text-sm mt-2 text-muted-foreground">
                  Note: All registered students will be added to our Quran Portal system for online learning access.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-8">
                {!isAdultSignup && (
                  // Parent/Guardian Information
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Parent/Guardian Information</h3>
                    <div className="grid gap-4">
                      <div>
                        <Label htmlFor="parentName">Full Name</Label>
                        <div className="flex mt-1.5">
                          <User className="w-4 h-4 text-muted-foreground mr-2 mt-3" />
                          <Input
                            id="parentName"
                            name="parentName"
                            type="text"
                            required
                            value={formData.parentName}
                            onChange={handleParentInfoChange}
                          />
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="email">Email Address</Label>
                        <div className="flex mt-1.5">
                          <Mail className="w-4 h-4 text-muted-foreground mr-2 mt-3" />
                          <Input
                            id="email"
                            name="email"
                            type="email"
                            required
                            value={formData.email}
                            onChange={handleParentInfoChange}
                          />
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="phone">Phone Number</Label>
                        <div className="flex mt-1.5">
                          <Phone className="w-4 h-4 text-muted-foreground mr-2 mt-3" />
                          <Input
                            id="phone"
                            name="phone"
                            type="tel"
                            required
                            value={formData.phone}
                            onChange={handleParentInfoChange}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Students Information */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium">
                      {isAdultSignup ? "Student Information" : "Children Information"}
                    </h3>
                    {!isAdultSignup && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={addStudent}
                        className="flex items-center gap-2"
                      >
                        <Plus className="h-4 w-4" /> Add Student
                      </Button>
                    )}
                  </div>

                  {(isAdultSignup ? [students[0]] : students).map((student, index) => (
                    <div key={index} className="p-4 border rounded-lg space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">
                          {isAdultSignup ? "Personal Information" : `Student ${index + 1}`}
                        </h4>
                        {!isAdultSignup && students.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeStudent(index)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>

                      <div className="grid gap-4">
                        <div>
                          <Label htmlFor={`student-name-${index}`}>Full Name</Label>
                          <Input
                            id={`student-name-${index}`}
                            type="text"
                            required
                            value={student.name}
                            onChange={(e) => handleStudentChange(index, "name", e.target.value)}
                          />
                        </div>

                        <div>
                          <Label htmlFor={`student-age-${index}`}>Age</Label>
                          <Input
                            id={`student-age-${index}`}
                            type="number"
                            required
                            min={isAdultSignup ? "18" : "4"}
                            max={isAdultSignup ? "100" : "17"}
                            value={student.age}
                            onChange={(e) => handleStudentChange(index, "age", e.target.value)}
                          />
                        </div>

                        {isAdultSignup && (
                          <>
                            <div>
                              <Label htmlFor="email">Email Address</Label>
                              <div className="flex mt-1.5">
                                <Mail className="w-4 h-4 text-muted-foreground mr-2 mt-3" />
                                <Input
                                  id="email"
                                  name="email"
                                  type="email"
                                  required
                                  value={formData.email}
                                  onChange={handleParentInfoChange}
                                />
                              </div>
                            </div>

                            <div>
                              <Label htmlFor="phone">Phone Number</Label>
                              <div className="flex mt-1.5">
                                <Phone className="w-4 h-4 text-muted-foreground mr-2 mt-3" />
                                <Input
                                  id="phone"
                                  name="phone"
                                  type="tel"
                                  required
                                  value={formData.phone}
                                  onChange={handleParentInfoChange}
                                />
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
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
