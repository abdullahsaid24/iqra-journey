
import { useState, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { useQuery } from "@tanstack/react-query";
import { AdultStudentTable } from "./AdultStudentTable";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { AlertTriangle, Loader2 } from "lucide-react";
import type { AdultStudent } from "./types";

export const AdultStudentManagementForm = () => {
  // State for dialogs and selections
  const [selectedStudentId, setSelectedStudentId] = useState<string>("");
  const [isEmailDialogOpen, setIsEmailDialogOpen] = useState(false);
  const [isPhoneDialogOpen, setIsPhoneDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // Email form schema
  const emailSchema = z.object({
    email: z.string().email("Please enter a valid email address"),
  });

  const emailForm = useForm<z.infer<typeof emailSchema>>({
    resolver: zodResolver(emailSchema),
    defaultValues: {
      email: "",
    },
  });

  // Phone form schema
  const phoneSchema = z.object({
    phone: z.string()
      .min(3, "Phone number must be at least 3 characters")
      .regex(/^\+?[0-9\s\-()]+$/, "Please enter a valid phone number"),
    enableNotifications: z.boolean().default(true),
  });

  const phoneForm = useForm<z.infer<typeof phoneSchema>>({
    resolver: zodResolver(phoneSchema),
    defaultValues: {
      phone: "+1", 
      enableNotifications: true,
    },
  });

  // Fetch all adult students
  const { 
    data: adultStudents = [], 
    isLoading, 
    isError,
    refetch
  } = useQuery({
    queryKey: ['adult-students'],
    queryFn: async () => {
      try {
        // Get both adult students from auth users and from adult_students table
        console.log('Fetching adult students from both sources...');
        
        // First get users marked as students from auth
        const response = await supabase.functions.invoke('manage-users', {
          body: {
            action: 'listUsers'
          }
        });
        
        if (response.error) throw response.error;
        
        // Filter adult students from auth users
        const authAdultStudents = (response.data || []).filter(user => 
          user.role === 'student' && user.is_adult_student === true
        );
        
        console.log(`Found ${authAdultStudents.length} adult students from auth`);
        
        // Next, get all records from adult_students table
        const { data: adultStudentRecords, error: adultError } = await supabase
          .from('adult_students')
          .select('*');
          
        if (adultError) throw adultError;
        
        console.log(`Found ${adultStudentRecords?.length || 0} adult students from adult_students table`);
        
        // Combine the two sources, with preference to auth user data when available
        const combinedStudents = new Map();
        
        // First add all auth users
        authAdultStudents.forEach(student => {
          combinedStudents.set(student.id, {
            id: student.id,
            email: student.email,
            role: student.role,
            phone_number: student.phone_number || null,
            created_at: student.created_at
          });
        });
        
        // Then add or update with adult_students table data
        adultStudentRecords?.forEach(student => {
          // If already in map, update with more data
          if (combinedStudents.has(student.id)) {
            const existing = combinedStudents.get(student.id);
            combinedStudents.set(student.id, {
              ...existing,
              email: existing.email || student.email,
              phone_number: existing.phone_number || student.phone_number,
              first_name: student.first_name,
              last_name: student.last_name
            });
          } else {
            // Not in map yet, add new entry
            combinedStudents.set(student.id, {
              id: student.id,
              email: student.email,
              role: 'student',
              phone_number: student.phone_number,
              created_at: student.created_at || new Date().toISOString()
            });
          }
        });
        
        console.log(`Combined total: ${combinedStudents.size} adult students`);
        return Array.from(combinedStudents.values());
      } catch (err) {
        console.error("Error fetching adult students:", err);
        throw err;
      }
    },
    staleTime: 1000,
    retry: false,
  });

  // Add a function to sync all adult students
  const syncAdultStudents = useCallback(async () => {
    try {
      const toastId = toast.loading("Syncing adult student data...");
      
      // Call the manage-users function with syncAdultStudents action
      const { data, error } = await supabase.functions.invoke('manage-users', {
        body: {
          action: 'syncAdultStudents'
        }
      });
      
      if (error) throw error;
      
      toast.dismiss(toastId);
      toast.success(data.message || "Adult student data synced successfully");
      
      // Refetch adult student data
      refetch();
      
    } catch (error: any) {
      toast.error(error.message || "Failed to sync adult student data");
    }
  }, [refetch]);

  // Handle updating email
  const handleUpdateEmail = useCallback(async (values: z.infer<typeof emailSchema>) => {
    if (!selectedStudentId) {
      toast.error("No student selected");
      return;
    }

    try {
      const toastId = toast.loading("Updating email...");
      
      // Call the manage-users function to update email
      const { error } = await supabase.functions.invoke('manage-users', {
        body: {
          action: 'updateUserEmail',
          userId: selectedStudentId,
          email: values.email
        }
      });

      if (error) throw error;
      
      // Also update the email in adult_students table
      const { error: updateError } = await supabase
        .from('adult_students')
        .update({ email: values.email })
        .eq('id', selectedStudentId);
        
      if (updateError) {
        console.warn("Warning: Failed to update email in adult_students table", updateError);
      }
      
      toast.dismiss(toastId);
      toast.success("Email updated successfully");
      setIsEmailDialogOpen(false);
      emailForm.reset();
      
      // Refetch adult student data
      refetch();
      
    } catch (error: any) {
      toast.error(error.message || "Failed to update email");
    }
  }, [selectedStudentId, emailForm, refetch]);

  // Handle updating phone
  const handleUpdatePhone = useCallback(async (values: z.infer<typeof phoneSchema>) => {
    if (!selectedStudentId) {
      toast.error("No student selected");
      return;
    }

    try {
      const toastId = toast.loading("Updating phone number...");
      
      // Format phone number to ensure it starts with + and remove spaces/dashes
      let formattedPhone = values.phone.trim();
      
      // Add + if missing
      if (!formattedPhone.startsWith('+')) {
        formattedPhone = '+' + formattedPhone;
      }
      
      console.log(`Saving formatted phone number: ${formattedPhone} for student ${selectedStudentId}`);
      
      // First update the adult_students table
      // Get the student info first
      const { data: studentData, error: studentError } = await supabase
        .from('students')
        .select('id, email, first_name, last_name, name')
        .eq('id', selectedStudentId)
        .maybeSingle();
        
      if (studentError) {
        console.error("Error fetching student data:", studentError);
      }
      
      // Update adult_students table directly first
      const { error: adultError } = await supabase
        .from('adult_students')
        .upsert({
          id: selectedStudentId,
          email: studentData?.email || 'email@example.com',
          first_name: studentData?.first_name || studentData?.name?.split(' ')[0] || 'First',
          last_name: studentData?.last_name || studentData?.name?.split(' ').slice(1).join(' ') || 'Last',
          phone_number: formattedPhone
        });
        
      if (adultError) {
        console.error("Error updating adult student record:", adultError);
        throw adultError;
      }
      
      console.log("Successfully updated adult_students table with phone:", formattedPhone);
      
      // Verify the phone number is saved correctly by retrieving it
      const { data: verifyData, error: verifyError } = await supabase
        .from('adult_students')
        .select('phone_number')
        .eq('id', selectedStudentId)
        .single();
        
      if (verifyError) {
        console.error("Error verifying saved phone:", verifyError);
      } else {
        console.log("Verification - Phone saved in database:", verifyData?.phone_number);
      }

      toast.dismiss(toastId);
      toast.success("Phone number updated successfully");
      setIsPhoneDialogOpen(false);
      phoneForm.reset();
      
      // Refetch adult student data
      refetch();
      
    } catch (error: any) {
      toast.error(error.message || "Failed to update phone number");
    }
  }, [selectedStudentId, phoneForm, refetch]);

  // Handle deleting user
  const handleDeleteUser = useCallback(async () => {
    if (!selectedStudentId) {
      toast.error("No student selected");
      return;
    }

    try {
      const toastId = toast.loading("Deleting user...");
      
      // Call the manage-users function to delete user
      const { error } = await supabase.functions.invoke('manage-users', {
        body: {
          action: 'deleteUser',
          userId: selectedStudentId
        }
      });

      if (error) throw error;
      
      toast.dismiss(toastId);
      toast.success("User deleted successfully");
      setIsDeleteDialogOpen(false);
      
      // Refetch adult student data
      refetch();
      
    } catch (error: any) {
      toast.error(error.message || "Failed to delete user");
    }
  }, [selectedStudentId, refetch]);

  // Open email dialog
  const openEmailDialog = useCallback((studentId: string, currentEmail: string) => {
    setSelectedStudentId(studentId);
    emailForm.reset({ email: currentEmail });
    setIsEmailDialogOpen(true);
  }, [emailForm]);

  // Open phone dialog
  const openPhoneDialog = useCallback(async (studentId: string) => {
    setSelectedStudentId(studentId);
    
    try {
      // First check adult_students table directly for phone number
      const { data: adultData, error: adultError } = await supabase
        .from('adult_students')
        .select('phone_number')
        .eq('id', studentId)
        .single();
        
      if (adultError) {
        console.log("Error checking adult_students table:", adultError.message);
      } else {
        console.log("Found phone in adult_students:", adultData?.phone_number);
      }
      
      // Use phone number from adult_students table if available
      let phone = adultData?.phone_number || "+1";
      
      // Format phone number
      if (phone && !phone.startsWith('+')) {
        phone = `+${phone}`;
      }
      
      // Set form values
      phoneForm.reset({ 
        phone, 
        enableNotifications: true 
      });
      
      setIsPhoneDialogOpen(true);
    } catch (error) {
      console.error("Error fetching phone data:", error);
      phoneForm.reset({ phone: "+1", enableNotifications: true });
      setIsPhoneDialogOpen(true);
    }
  }, [phoneForm]);

  // Open delete dialog
  const openDeleteDialog = useCallback((studentId: string) => {
    setSelectedStudentId(studentId);
    setIsDeleteDialogOpen(true);
  }, []);

  return (
    <Card className="border border-slate-200 shadow-sm bg-white">
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-slate-800">Adult Student Management</h2>
          <Button 
            onClick={syncAdultStudents}
            className="bg-green-600 hover:bg-green-700"
          >
            Sync Adult Students
          </Button>
        </div>
        
        {isLoading ? (
          <div className="py-10 text-center">
            <Loader2 className="h-10 w-10 animate-spin text-blue-600 mx-auto mb-4" />
            <p className="text-slate-600">Loading adult students...</p>
          </div>
        ) : isError ? (
          <div className="py-8 text-center bg-red-50 rounded-lg border border-red-200 mb-4">
            <AlertTriangle className="h-12 w-12 mx-auto text-red-500 mb-4" />
            <p className="text-red-600 mb-4">Failed to load adult student data.</p>
            <Button onClick={() => refetch()} className="bg-blue-600 hover:bg-blue-700">
              Reload Data
            </Button>
          </div>
        ) : (
          <AdultStudentTable 
            students={adultStudents}
            onEditEmail={openEmailDialog}
            onEditPhone={openPhoneDialog}
            onDelete={openDeleteDialog}
          />
        )}
      </div>

      {/* Email Edit Dialog */}
      <Dialog open={isEmailDialogOpen} onOpenChange={setIsEmailDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Student Email</DialogTitle>
            <DialogDescription>
              Update the email address for this adult student.
            </DialogDescription>
          </DialogHeader>
          <Form {...emailForm}>
            <form onSubmit={emailForm.handleSubmit(handleUpdateEmail)} className="space-y-4">
              <FormField
                control={emailForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="email@example.com"
                        {...field}
                        className="border-slate-300"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEmailDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                  Update Email
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Phone Number Dialog */}
      <Dialog open={isPhoneDialogOpen} onOpenChange={setIsPhoneDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Manage Phone Number</DialogTitle>
            <DialogDescription>
              Update the phone number for notifications.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...phoneForm}>
            <form onSubmit={phoneForm.handleSubmit(handleUpdatePhone)} className="space-y-4">
              <FormField
                control={phoneForm.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Number</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="+1 555 555 5555" 
                        {...field}
                        className="border-slate-300"
                      />
                    </FormControl>
                    <FormMessage />
                    <p className="text-xs text-gray-500">
                      Format: +1 555 555 5555 (include country code)
                    </p>
                  </FormItem>
                )}
              />
              
              <FormField
                control={phoneForm.control}
                name="enableNotifications"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border border-slate-200 p-4">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        className="data-[state=checked]:bg-blue-600"
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>
                        Enable SMS notifications
                      </FormLabel>
                      <p className="text-sm text-slate-500">
                        Receive notifications about lesson status and homework assignments
                      </p>
                    </div>
                  </FormItem>
                )}
              />
              
              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsPhoneDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Save Changes
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete User</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this user? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end space-x-2 mt-4">
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive"
              onClick={handleDeleteUser}
            >
              Delete User
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
};
