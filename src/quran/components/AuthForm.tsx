
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/quran/components/ui/button";
import { Input } from "@/quran/components/ui/input";
import { Label } from "@/quran/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/quran/lib/supabase";
import { Eye, EyeOff } from "lucide-react";

interface AuthFormProps {
  mode: "signin" | "signup";
  role: "teacher" | "parent" | "student";
}

export const AuthForm = ({ mode, role }: AuthFormProps) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (mode === "signup" && password.length < 5) {
      toast.error("Password must be at least 5 characters long");
      return;
    }

    setLoading(true);

    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              role,
            },
            emailRedirectTo: window.location.origin,
          },
        });
        if (error) throw error;
        toast.success("Please check your email to verify your account.");
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        if (data.session) {
          // Get user roles from user_roles table
          const { data: roleData, error: roleError } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', data.session.user.id)
            .single();

          if (roleError) {
            if (roleError.code !== 'PGRST116') { // No rows returned (user has no role)
              console.error('Error fetching user role:', roleError);
              throw new Error("Unable to fetch user role");
            }
            toast.warning("Your account doesn't have any roles assigned. Please contact an administrator.");
            return;
          }

          // Persist the session (important for page refreshes)
          localStorage.setItem('supabase.auth.token', JSON.stringify(data.session));
          
          // Handle different role redirects
          if (roleData?.role === 'student') {
            try {
              const { data: studentData, error: studentError } = await supabase
                .rpc('get_student_by_email', {
                  p_email: email
                });

              if (studentError) throw studentError;

              if (studentData) {
                navigate(`/quran/student/${studentData}/stats`);
                toast.success("Welcome back!");
                return;
              } else {
                toast.warning("Student record not found. Please contact an administrator.");
              }
            } catch (studentError) {
              console.error("Error fetching student:", studentError);
              toast.error("Failed to fetch student details");
            }
          } else if (roleData?.role === 'parent') {
            navigate("/quran/parent-dashboard");
            toast.success("Welcome back!");
          } else if (roleData?.role === 'admin' || roleData?.role === 'teacher') {
            navigate("/quran/dashboard");
            toast.success("Welcome back!");
          } else {
            throw new Error("Invalid user role");
          }
        }
      }
    } catch (error: any) {
      console.error("Auth error:", error);
      toast.error(error.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="email" className="text-white/90">Email</Label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="bg-white/20 border-white/20 text-white placeholder-white/50 focus:border-white/40 transition-all"
          placeholder="Enter your email"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password" className="text-white/90">Password</Label>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="bg-white/20 border-white/20 text-white placeholder-white/50 focus:border-white/40 pr-10 transition-all"
            placeholder="Enter your password"
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute right-0 top-0 h-full px-3 hover:bg-transparent text-white/70 hover:text-white"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </Button>
        </div>
        {mode === "signup" && (
          <p className="text-sm text-white/70 mt-1">
            Password must be at least 5 characters long
          </p>
        )}
      </div>
      <Button 
        type="submit" 
        className="w-full bg-white text-quran-bg hover:bg-white/90 transition-all transform hover:scale-105"
        disabled={loading}
      >
        {loading ? "Loading..." : mode === "signin" ? "Sign In" : "Sign Up"}
      </Button>
    </form>
  );
};
