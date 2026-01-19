
import { Button } from "@/quran/components/ui/button";
import { Input } from "@/quran/components/ui/input";
import { Label } from "@/quran/components/ui/label";
import { Card } from "@/quran/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/quran/components/ui/select";
import { useCreateUserForm } from "./user-management/CreateUserFormState";
import { useCreateUser } from "./user-management/useCreateUser";

export const AdminTeacherUserForm = () => {
  const {
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
    loading,
    setLoading,
    resetForm,
  } = useCreateUserForm({ adminTeacherOnly: true });

  const { createUser } = useCreateUser();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const success = await createUser(
        email,
        password,
        role,
        firstName,
        lastName
      );

      if (success) {
        resetForm();
      }
    } catch (error: any) {
      console.error('Create admin/teacher error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-6 bg-white border-slate-200 shadow-sm">
      <h2 className="text-2xl font-bold mb-6 text-slate-900">Create Admin or Teacher</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="firstName" className="text-slate-700">First Name</Label>
            <Input
              id="firstName"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
              className="bg-white border-slate-200 focus:ring-quran-primary"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="lastName" className="text-slate-700">Last Name</Label>
            <Input
              id="lastName"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
              className="bg-white border-slate-200 focus:ring-quran-primary"
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="email" className="text-slate-700">Email</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="bg-white border-slate-200 focus:ring-quran-primary"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password" className="text-slate-700">Password</Label>
          <Input
            id="password"
            type="text"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            className="bg-white border-slate-200 focus:ring-quran-primary"
          />
          <p className="text-xs text-slate-500">Default password is pre-filled but you can change it</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="role" className="text-slate-700">Role</Label>
          <Select
            value={role}
            onValueChange={(value: "admin" | "teacher") => {
              setRole(value);
            }}
          >
            <SelectTrigger className="bg-white border-slate-200 focus:ring-quran-primary text-slate-900">
              <SelectValue placeholder="Select role" />
            </SelectTrigger>
            <SelectContent className="bg-white border-slate-200">
              <SelectItem value="admin" className="hover:bg-slate-100 text-slate-900">Admin</SelectItem>
              <SelectItem value="teacher" className="hover:bg-slate-100 text-slate-900">Teacher</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button type="submit" className="w-full bg-quran-primary hover:bg-quran-primary/90 text-white" disabled={loading}>
          {loading ? "Creating..." : "Create User"}
        </Button>
      </form>
    </Card>
  );
};
