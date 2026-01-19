
import { Link } from "react-router-dom";
import { Calendar, Users } from "lucide-react";
import { ClassWithStudents } from "@/quran/types/dashboard";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/quran/components/ui/card";
import { Button } from "@/quran/components/ui/button";
import { Badge } from "@/quran/components/ui/badge";
import { useEffect, useState } from "react";
import { supabase } from "@/quran/lib/supabase";

interface AttendanceClassCardProps {
  classItem: ClassWithStudents;
}

export const AttendanceClassCard = ({ classItem }: AttendanceClassCardProps) => {
  const studentCount = classItem.students?.length || 0;
  const [todayAttendanceCount, setTodayAttendanceCount] = useState<number | null>(null);
  const [monthlyAbsentCount, setMonthlyAbsentCount] = useState<number>(0);

  // Check today's attendance status
  useEffect(() => {
    const checkTodayAttendance = async () => {
      const today = new Date().toISOString().split('T')[0];

      try {
        const { data, error } = await supabase
          .from('weekday_attendance')
          .select('id')
          .eq('class_id', classItem.id)
          .eq('attendance_date', today);

        if (error) throw error;

        setTodayAttendanceCount(data?.length || 0);
      } catch (err) {
        console.error('Error checking today\'s attendance:', err);
      }
    };

    // Get monthly absence count for the class
    const getMonthlyAbsences = async () => {
      // Get the first day of the current month
      const now = new Date();
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
      const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

      try {
        const { data, error } = await supabase
          .from('weekday_attendance')
          .select('id')
          .eq('class_id', classItem.id)
          .eq('status', 'absent')
          .gte('attendance_date', firstDayOfMonth)
          .lte('attendance_date', lastDayOfMonth);

        if (error) throw error;

        setMonthlyAbsentCount(data?.length || 0);
      } catch (err) {
        console.error('Error getting monthly absences:', err);
      }
    };

    checkTodayAttendance();
    getMonthlyAbsences();
  }, [classItem.id]);

  const attendanceStatus = todayAttendanceCount === null
    ? 'checking'
    : todayAttendanceCount > 0
      ? 'recorded'
      : 'not_recorded';

  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow duration-300">
      <CardHeader className="bg-gradient-to-r from-quran-bg/80 to-quran-light/80 text-white">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg font-medium truncate">{classItem.name}</CardTitle>
          {monthlyAbsentCount > 0 && (
            <Badge variant="destructive" className="ml-2">
              {monthlyAbsentCount} {monthlyAbsentCount === 1 ? 'absence' : 'absences'} this month
            </Badge>
          )}
        </div>
        <div className="flex items-center text-white/80 text-sm">
          <Users className="h-4 w-4 mr-1" />
          {studentCount} student{studentCount !== 1 ? 's' : ''}
        </div>
      </CardHeader>

      <CardContent className="pt-4">
        <div className="space-y-2">
          <div className="flex items-center">
            <Calendar className="h-4 w-4 mr-2 text-gray-500" />
            <span className="text-sm text-gray-600">
              Today's attendance: {' '}
              {attendanceStatus === 'checking' ? (
                <Badge variant="outline">Checking...</Badge>
              ) : attendanceStatus === 'recorded' ? (
                <Badge variant="default" className="bg-green-500 hover:bg-green-600">Recorded</Badge>
              ) : (
                <Badge variant="outline">Not recorded</Badge>
              )}
            </span>
          </div>
        </div>
      </CardContent>

      <CardFooter className="flex justify-between border-t pt-4">
        <Button
          asChild
          variant="ghost"
          size="sm"
        >
          <Link to={`/quran/class/${classItem.id}/attendance`}>View Class</Link>
        </Button>

        <Button
          asChild
          size="sm"
        >
          <Link to={`/quran/class/${classItem.id}/attendance`}>
            {attendanceStatus === 'recorded' ? 'Edit Attendance' : 'Take Attendance'}
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
};
