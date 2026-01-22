
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export const useCreateUser = () => {
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);

  const createUserMutation = useMutation({
    mutationFn: async ({
      email,
      password,
      role,
      firstName,
      lastName,
      parentId,
      classId,
      phoneNumber,
      secondaryPhoneNumber,
      isAdultStudent = false
    }: {
      email: string;
      password: string;
      role: string;
      firstName?: string;
      lastName?: string;
      parentId?: string;
      classId?: string;
      phoneNumber?: string;
      secondaryPhoneNumber?: string;
      isAdultStudent?: boolean;
    }) => {
      setLoading(true);
      console.log("Creating user with data:", {
        email,
        role,
        firstName,
        lastName,
        parentId,
        classId,
        phoneNumber,
        secondaryPhoneNumber,
        isAdultStudent
      });

      try {
        // Format phone numbers if provided
        let formattedPhone = phoneNumber?.trim();
        if (formattedPhone && !formattedPhone.startsWith('+')) {
          formattedPhone = '+' + formattedPhone;
        }
        
        let formattedSecondaryPhone = secondaryPhoneNumber?.trim();
        if (formattedSecondaryPhone && !formattedSecondaryPhone.startsWith('+')) {
          formattedSecondaryPhone = '+' + formattedSecondaryPhone;
        }
        
        // Call the create-user-with-role edge function
        const { data, error } = await supabase.functions.invoke('create-user-with-role', {
          body: {
            email,
            password,
            role: isAdultStudent ? 'student' : role,
            firstName,
            lastName,
            parentId,
            classId,
            phoneNumber: formattedPhone,
            secondaryPhoneNumber: formattedSecondaryPhone,
            isAdultStudent
          }
        });

        if (error) {
          console.error("Error in create-user-with-role:", error);
          throw error;
        }

        if (!data || !data.user) {
          console.error("No user data returned");
          throw new Error("Failed to create user");
        }

        // If this is an adult student, ensure the data is synced
        if (isAdultStudent) {
          await supabase.functions.invoke('manage-users', {
            body: {
              action: 'syncAdultStudents'
            }
          });
        }

        return data.user;
      } catch (error: any) {
        console.error("Error in createUser:", error);
        
        // Provide more specific error messages
        if (error?.message === "Edge Function returned a non-2xx status code") {
          throw new Error("Unable to create user. The email might already exist or there's a server issue.");
        }
        
        throw error;
      } finally {
        setLoading(false);
      }
    },
    onSuccess: () => {
      toast.success("User created successfully");
      // Invalidate all relevant queries to trigger refetch
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['parents'] });
      queryClient.invalidateQueries({ queryKey: ['adult-students'] });
    },
    onError: (error: any) => {
      console.error("Mutation error:", error);
      toast.error(error.message || "Failed to create user");
    },
  });

  const createUser = async (
    email: string,
    password: string,
    role: string,
    firstName?: string,
    lastName?: string,
    parentId?: string,
    classId?: string,
    phoneNumber?: string,
    secondaryPhoneNumber?: string,
    isAdultStudent: boolean = false
  ) => {
    try {
      await createUserMutation.mutateAsync({
        email,
        password,
        role,
        firstName,
        lastName,
        parentId,
        classId,
        phoneNumber,
        secondaryPhoneNumber,
        isAdultStudent
      });
      return true;
    } catch (error) {
      return false;
    }
  };

  return { createUser, loading };
};
