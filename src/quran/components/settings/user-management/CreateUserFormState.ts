
import { z } from "zod";
import { useState } from "react";

export type UserRole = 'admin' | 'teacher' | 'parent' | 'student';

export const createUserSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }),
  password: z
    .string()
    .min(8, { message: "Password must be at least 8 characters" }),
  role: z.enum(["admin", "teacher", "parent", "student"] as const),
  first_name: z
    .string()
    .min(1, { message: "First name is required" })
    .optional(),
  last_name: z
    .string()
    .min(1, { message: "Last name is required" })
    .optional(),
});

export type CreateUserFormState = z.infer<typeof createUserSchema>;

interface UseCreateUserFormProps {
  adminTeacherOnly?: boolean;
}

export const useCreateUserForm = (props?: UseCreateUserFormProps) => {
  const { adminTeacherOnly = false } = props || {};
  
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("password123");
  const [firstName, setFirstName] = useState<string>("");
  const [lastName, setLastName] = useState<string>("");
  const [role, setRole] = useState<"parent" | "student" | "admin" | "teacher">(
    adminTeacherOnly ? "admin" : "parent"
  );
  const [selectedParentId, setSelectedParentId] = useState<string>("");
  const [selectedClassId, setSelectedClassId] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [isAdultStudent, setIsAdultStudent] = useState<boolean>(false);
  const [phoneNumber, setPhoneNumber] = useState<string>("+1 ");
  const [secondaryPhoneNumber, setSecondaryPhoneNumber] = useState<string>("");

  const resetForm = () => {
    setEmail("");
    setPassword("password123");
    setFirstName("");
    setLastName("");
    setRole(adminTeacherOnly ? "admin" : "parent");
    setSelectedParentId("");
    setSelectedClassId("");
    setIsAdultStudent(false);
    setPhoneNumber("+1 ");
    setSecondaryPhoneNumber("");
  };

  return {
    email,
    setEmail,
    password,
    setPassword,
    firstName,
    setFirstName,
    lastName,
    setLastName,
    role,
    setRole,
    selectedParentId,
    setSelectedParentId,
    selectedClassId,
    setSelectedClassId,
    loading,
    setLoading,
    resetForm,
    isAdultStudent,
    setIsAdultStudent,
    phoneNumber,
    setPhoneNumber,
    secondaryPhoneNumber,
    setSecondaryPhoneNumber
  };
};
