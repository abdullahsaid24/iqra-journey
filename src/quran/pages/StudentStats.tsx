
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/quran/components/ui/button";
import { useStudentStats } from "@/quran/hooks/useStudentStats";
import { LessonPassFailChart } from "@/quran/components/stats/LessonPassFailChart";
import { CurrentLessonsTable } from "@/quran/components/stats/CurrentLessonsTable";
import CountdownTimer from "@/quran/components/stats/CountdownTimer";
import { useUserRole } from "@/quran/hooks/useUserRole";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/quran/components/ui/carousel";
import { Card, CardContent } from "@/quran/components/ui/card";
import { format } from "date-fns";
import { useState } from "react";
import { GoalProgressBar } from "@/quran/components/stats/GoalProgressBar";

const StudentStats = () => {
  const { id: studentId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [selectedMonth, setSelectedMonth] = useState<Date>(new Date());
  const { userRole } = useUserRole();

  const { data: studentData, isLoading: isLoadingStudent } = useStudentStats(studentId, selectedMonth);

  const handleBack = () => {
    // Check if we're coming from parent dashboard
    const isParentView = location.state?.isParentView || userRole === 'parent';

    if (isParentView) {
      navigate('/quran/parent-dashboard');
    } else if (location.state?.from) {
      navigate(location.state.from);
    } else {
      const classMatch = location.pathname.match(/\/student\/([^/]+)\/stats/);
      if (classMatch) {
        navigate(`/quran/class/${studentData?.class_id || ''}`);
      } else {
        navigate(-1);
      }
    }
  };

  const handleMonthSelect = (date: Date) => {
    setSelectedMonth(date);
  };

  if (isLoadingStudent) {
    return <div className="min-h-screen bg-gray-50 p-8 text-gray-900">Loading...</div>;
  }

  if (!studentData) {
    return <div className="min-h-screen bg-gray-50 p-8 text-gray-900">Student not found</div>;
  }

  const stats = studentData.student_stats?.[0] || {
    lessons_completed: 0,
    lessons_failed: 0
  };

  const isCurrentMonth = selectedMonth.getMonth() === new Date().getMonth() && selectedMonth.getFullYear() === new Date().getFullYear();
  const isStudent = userRole === 'student';
  const isParentView = location.state?.isParentView || userRole === 'parent';
  const availableMonths = Array.from({ length: 12 }, (_, i) => {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    return date;
  }).reverse();

  const currentMonthIndex = availableMonths.findIndex(
    date => date.getMonth() === new Date().getMonth() && date.getFullYear() === new Date().getFullYear()
  );

  const currentLesson = studentData.current_assignments?.current_lesson || null;
  const pastHomework = studentData.current_assignments?.past_homework || [];

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8 pb-24 bg-slate-100">
      <div className="container mx-auto space-y-6 sm:space-y-8">
        <div className="flex flex-col sm:flex-row items-start justify-between gap-4 sm:gap-6 mb-6 sm:mb-8">
          <div className="flex flex-col gap-4 w-full sm:w-auto">
            {!isStudent && (
              <Button
                variant="outline"
                onClick={handleBack}
                className="bg-white text-gray-900 hover:bg-gray-100 w-fit"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                {isParentView ? 'Back to Dashboard' : 'Back to Class'}
              </Button>
            )}
            <div className="space-y-4">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                {studentData?.name}'s Progress Report
              </h1>
              {studentData.teacher && (
                <Card className="bg-white shadow-sm">
                  <CardContent className="p-4 sm:p-6">
                    <div className="space-y-2">
                      <p className="text-base font-medium text-gray-900">
                        {studentData.teacher.name}
                      </p>
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-gray-600">Contact Teacher</p>
                        <a
                          href={`mailto:${studentData.teacher.email}`}
                          className="text-sm text-blue-600 hover:text-blue-700"
                        >
                          {studentData.teacher.email}
                        </a>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-14 w-full sm:w-auto">
            <div className="relative flex items-center w-full sm:w-[200px]">
              <Carousel
                opts={{
                  align: "start",
                  loop: false,
                  startIndex: currentMonthIndex
                }}
                className="w-full sm:w-[200px]"
              >
                <CarouselContent className="px-2">
                  {availableMonths.map(date => (
                    <CarouselItem key={date.toISOString()} className="basis-full pl-0">
                      <Button
                        variant={
                          date.getMonth() === selectedMonth.getMonth() &&
                            date.getFullYear() === selectedMonth.getFullYear()
                            ? "default"
                            : "ghost"
                        }
                        onClick={() => handleMonthSelect(date)}
                        className={`w-full text-sm ${date.getMonth() === selectedMonth.getMonth() &&
                            date.getFullYear() === selectedMonth.getFullYear()
                            ? "bg-quran-primary text-white hover:bg-quran-primary/90"
                            : "text-gray-700 hover:text-quran-primary hover:bg-transparent"
                          }`}
                      >
                        {format(date, "MMMM yyyy")}
                      </Button>
                    </CarouselItem>
                  ))}
                </CarouselContent>
                <CarouselPrevious className="absolute -left-8 h-8 w-8 border-0 text-gray-700 hover:bg-transparent hover:text-quran-primary focus:bg-transparent">
                  <ChevronLeft className="h-6 w-6" />
                </CarouselPrevious>
                <CarouselNext className="absolute -right-8 h-8 w-8 border-0 text-gray-700 hover:bg-transparent hover:text-quran-primary focus:bg-transparent">
                  <ChevronRight className="h-6 w-6" />
                </CarouselNext>
              </Carousel>
            </div>
            {isCurrentMonth && <CountdownTimer />}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-1 lg:grid-cols-1 gap-4 sm:gap-6">
          <LessonPassFailChart passCount={stats.lessons_completed} failCount={stats.lessons_failed} />
        </div>

        <CurrentLessonsTable
          currentLesson={currentLesson}
          pastHomework={pastHomework}
        />
      </div>
      {studentId && <GoalProgressBar studentId={studentId} />}
    </div>
  );
};

export default StudentStats;
