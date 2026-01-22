import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { StudentHeader } from "@/components/student/StudentHeader";
import { StudentDetails } from "@/components/student/StudentDetails";
import { toast } from "sonner";

const Student = () => {
  const { id } = useParams();
  const [studentData, setStudentData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStudentData = async () => {
      try {
        const { data: student, error } = await supabase
          .from('students')
          .select('*')
          .eq('id', id)
          .single();

        if (error) throw error;

        if (!student) {
          toast.error("Student not found");
          return;
        }

        // Fetch the latest lesson
        const { data: lessons, error: lessonError } = await supabase
          .from('lessons')
          .select('*')
          .eq('student_id', id)
          .order('created_at', { ascending: false })
          .limit(1);

        if (lessonError) throw lessonError;

        const currentLesson = lessons?.[0] || { surah: '', verses: '' };

        setStudentData({
          ...student,
          currentLesson: {
            surah: currentLesson.surah,
            verses: currentLesson.verses
          }
          // class_id is already included from the student object
        });
      } catch (error: any) {
        console.error('Error fetching student:', error);
        toast.error("Failed to load student data");
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      fetchStudentData();
    }
  }, [id]);

  const handleLessonComplete = async (surah: string, startVerse: string, endVerse: string) => {
    try {
      const { error } = await supabase
        .from('lessons')
        .insert({
          student_id: id,
          surah,
          verses: `${startVerse}-${endVerse}`,
        });

      if (error) throw error;

      setStudentData(prev => ({
        ...prev,
        currentLesson: {
          surah,
          verses: `${startVerse}-${endVerse}`
        }
      }));

      toast.success("Lesson updated successfully");
    } catch (error: any) {
      console.error('Error updating lesson:', error);
      toast.error("Failed to update lesson");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-quran-bg p-8">
        <div className="container mx-auto text-center text-white">
          Loading...
        </div>
      </div>
    );
  }

  if (!studentData) {
    return (
      <div className="min-h-screen bg-quran-bg p-8">
        <div className="container mx-auto text-center text-white">
          Student not found
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-quran-bg p-8">
      <div className="container mx-auto">
        <StudentHeader student={studentData} />
        <StudentDetails 
          studentData={studentData}
          onLessonComplete={handleLessonComplete}
        />
      </div>
    </div>
  );
};

export default Student;
