
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/quran/lib/supabase";
import { ScrollArea } from "@/quran/components/ui/scroll-area";
import { toast } from "sonner";
import { ChildCard } from "./ChildCard";
import { ParentDashboardHeader } from "./ParentDashboardHeader";
import { EmptyChildrenState } from "./EmptyChildrenState";
import { LoadingState } from "./LoadingState";

interface ChildData {
  id: string;
  name: string;
  currentLesson?: {
    surah: string;
    verses: string;
  };
  stats?: {
    lessons_completed: number;
    total_mistakes: number;
    passing_rate: number;
  };
}

export const ParentDashboard = () => {
  const [children, setChildren] = useState<ChildData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchChildren = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          toast.error("Please log in to view your dashboard");
          navigate("/quran/login");
          return;
        }

        // Fetch children linked to parent
        const { data: links, error: linksError } = await supabase
          .from('parent_student_links')
          .select('student_id')
          .eq('parent_user_id', user.id);

        if (linksError) throw linksError;

        if (!links?.length) {
          setChildren([]);
          setIsLoading(false);
          return;
        }

        const studentIds = links.map(link => link.student_id);

        // Fetch student details with their most recent lesson
        const { data: studentsData, error: studentsError } = await supabase
          .from('students')
          .select(`
            id,
            name,
            student_stats (
              lessons_completed,
              total_mistakes,
              passing_rate
            )
          `)
          .in('id', studentIds)
          .order('created_at', { ascending: false });

        if (studentsError) throw studentsError;

        // For each student, fetch their latest active lesson separately to ensure accuracy
        const enrichedStudents = await Promise.all(studentsData.map(async (student) => {
          // Get the latest active lesson for this student
          const { data: latestLesson, error: lessonError } = await supabase
            .from('lessons')
            .select('surah, verses')
            .eq('student_id', student.id)
            .eq('is_active', true)
            .order('created_at', { ascending: false })
            .limit(1);
            
          if (lessonError) {
            console.error('Error fetching lesson for student:', student.id, lessonError);
          }

          return {
            id: student.id,
            name: student.name,
            currentLesson: latestLesson?.length > 0 ? latestLesson[0] : undefined,
            stats: student.student_stats?.[0],
          };
        }));

        setChildren(enrichedStudents);
      } catch (error) {
        console.error('Error fetching children:', error);
        toast.error("Failed to load children data");
      } finally {
        setIsLoading(false);
      }
    };

    fetchChildren();
  }, [navigate]);

  const handleStudentClick = (childId: string) => {
    // Navigate directly to the student stats page with state parameters
    navigate(`/quran/student/${childId}/stats`, {
      state: {
        from: "/quran/parent-dashboard",
        isParentView: true
      }
    });
  };

  if (isLoading) {
    return <LoadingState />;
  }

  if (!children.length) {
    return <EmptyChildrenState />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100/50">
      <div className="container mx-auto p-8">
        <ParentDashboardHeader title="My Children's Progress" />
        
        <ScrollArea className="h-[calc(100vh-12rem)]">
          <div className="grid gap-6 md:grid-cols-2">
            {children.map((child) => (
              <ChildCard
                key={child.id}
                id={child.id}
                name={child.name}
                currentLesson={child.currentLesson}
                stats={child.stats}
                onClick={handleStudentClick}
              />
            ))}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
};
