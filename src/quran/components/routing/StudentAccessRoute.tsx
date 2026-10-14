import { ReactNode, useEffect, useState } from "react";
import { Navigate, useLocation, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/quran/lib/supabase";
import { useUserRole } from "@/quran/hooks/useUserRole";
import { Loader2 } from "lucide-react";

/**
 * Guards a route that names a student in its URL.
 *
 * ProtectedRoute only answers "is this person signed in", which is not enough
 * for a page addressed as /quran/student/:studentId/... - any signed-in user
 * could put another child's id in the address bar. This answers "is this person
 * allowed to see THIS student":
 *
 *   staff    - any student
 *   student  - only themselves
 *   parent   - only a child they are linked to
 *
 * This is the UI half. The database half is the RLS on the tables involved; a
 * guard in the browser is a convenience, not a security boundary.
 */

interface StudentAccessRouteProps {
  children: ReactNode;
}

export const StudentAccessRoute = ({ children }: StudentAccessRouteProps) => {
  const { studentId } = useParams();
  const location = useLocation();
  const { userRole, studentId: ownStudentId, isLoading: roleLoading } = useUserRole();

  const isStaff = userRole === "admin" || userRole === "teacher";

  // Only parents need a lookup; everyone else is decided by their role alone.
  const { data: parentOwnsStudent, isLoading: linkLoading } = useQuery({
    queryKey: ["parent-owns-student", studentId],
    queryFn: async () => {
      if (!studentId) return false;
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const { data, error } = await supabase
        .from("parent_student_links")
        .select("student_id")
        .eq("parent_user_id", user.id)
        .eq("student_id", studentId)
        .maybeSingle();

      if (error) {
        console.error("Could not verify parent access:", error);
        return false;
      }
      return !!data;
    },
    enabled: userRole === "parent" && !!studentId,
    staleTime: 5 * 60 * 1000,
  });

  /**
   * A student's own id lands a moment after their role, so the decision waits
   * for it - but only briefly. useUserRole resolves that id by matching the
   * login's email to students.email, and for a student whose email does not
   * match, or who has none, it never arrives. Waiting on it unconditionally
   * left those students on a spinner forever instead of sending them somewhere.
   */
  const [graceExpired, setGraceExpired] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setGraceExpired(true), 1500);
    return () => clearTimeout(t);
  }, []);

  const isLoading =
    roleLoading ||
    (userRole === "parent" && linkLoading) ||
    (userRole === "student" && !ownStudentId && !!studentId && !graceExpired);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-quran-primary" />
      </div>
    );
  }

  const allowed =
    isStaff ||
    (userRole === "student" && ownStudentId === studentId) ||
    (userRole === "parent" && parentOwnsStudent === true);

  if (!allowed) {
    if (userRole === "parent") return <Navigate to="/quran/parent-dashboard" replace />;
    if (userRole === "student") {
      return (
        <Navigate
          to={ownStudentId ? `/quran/student/${ownStudentId}/stats` : "/quran/student"}
          replace
        />
      );
    }
    return <Navigate to="/quran/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};
