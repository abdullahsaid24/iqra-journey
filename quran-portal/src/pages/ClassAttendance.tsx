import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft, Home, History } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useClassStudents } from "@/hooks/useClassStudents";
import { useWeekdayAttendance } from "@/hooks/useWeekdayAttendance";
import { NotificationPresetSelect } from "@/components/quran/NotificationPresetSelect";
import { AttendanceHistory } from "@/components/attendance/AttendanceHistory";
import { MonthlyAbsenceBadge } from "@/components/attendance/MonthlyAbsenceBadge";

const getAttendanceTitle = (classId: string | undefined) => {
  if (!classId) return 'Class Attendance';
  
  const classTitles: Record<string, string> = {
    '2dcc106b-adfe-4717-b64d-40135a32a5f1': 'Monday Class',     // Saturday Junior
    '3f96c141-b1ca-495c-9d36-f6c3768e4307': 'Wednesday Class',  // Sunday Senior
    '4c5c84f2-ddac-4e09-a92e-8537c5502降2e': 'Thursday Class',  // Saturday Senior
    '5e8e9f3a-7b0d-4f1a-b8c9-6d2e1f3a4b5c': 'Friday Class'     // Sunday Junior
  };
  
  return classTitles[classId] || 'Class Attendance';
};

const ClassAttendance = () => {
  const { classId } = useParams();
  const navigate = useNavigate();
  const [className, setClassName] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [isPresetOpen, setIsPresetOpen] = useState<boolean>(false);
  const [selectedStudent, setSelectedStudent] = useState<{ id: string, name: string } | null>(null);
  
  const { classData, markAttendance, linkedWeekdayClassId } = useWeekdayAttendance(classId || '');

  useEffect(() => {
    const fetchClassName = async () => {
      if (!classId) return;
      
      try {
        const { data, error } = await supabase
          .from('classes')
          .select('name')
          .eq('id', classId)
          .single();
        
        if (error) throw error;
        if (data) setClassName(data.name);
      } catch (error) {
        console.error('Error fetching class name:', error);
        toast.error('Failed to load class information');
      } finally {
        setLoading(false);
      }
    };

    fetchClassName();
  }, [classId]);

  const handleMarkPresent = (studentId: string) => {
    markAttendance({ studentId, status: 'present' });
    toast.success('Marked as present');
  };

  const handleMarkAbsent = (studentId: string, studentName: string) => {
    setSelectedStudent({ id: studentId, name: studentName });
    setIsPresetOpen(true);
  };
  
  const handleSelectPreset = async (message: string) => {
    if (!selectedStudent) return;
    
    try {
      await markAttendance({
        studentId: selectedStudent.id,
        status: 'absent',
        note: message
      });
      
      toast.success(`Marked ${selectedStudent.name} as absent`);
      
      if (message) {
        const formattedMessage = message.replace('{{student_name}}', selectedStudent.name);
        
        try {
          const { data, error } = await supabase.functions.invoke('send-sms', {
            body: {
              student_id: selectedStudent.id,
              sms_message: formattedMessage,
              debug_mode: false
            }
          });
          
          if (error) {
            console.error('Error sending SMS notification:', error);
            toast.error('Failed to send notification');
          } else {
            console.log('SMS notification sent:', data);
            toast.success('Notification sent to parent/guardian');
          }
        } catch (error) {
          console.error('Error invoking send-sms function:', error);
          toast.error('Failed to send notification');
        }
      }
      
      setIsPresetOpen(false);
      setSelectedStudent(null);
    } catch (error) {
      console.error('Error marking absent with notification:', error);
      toast.error('Failed to mark attendance');
    }
  };

  const clearTodayAttendance = async () => {
    if (!classId) return;
    
    const today = new Date().toISOString().split('T')[0];
    
    try {
      const { error } = await supabase
        .from('weekday_attendance')
        .delete()
        .eq('class_id', classId)
        .eq('attendance_date', today);
        
      if (error) throw error;
      
      window.location.reload();
      toast.success('Attendance records cleared');
    } catch (error) {
      console.error('Error clearing attendance:', error);
      toast.error('Failed to clear attendance records');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-quran-bg to-quran-light p-4 sm:p-8 flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 text-white animate-spin mx-auto" />
          <p className="text-white font-medium text-xl">Loading attendance...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-quran-bg to-quran-light p-4 sm:p-8">
      <div className="container mx-auto max-w-4xl">
        <div className="flex items-center justify-between mb-8">
          <div className="flex gap-2">
            <Button 
              variant="ghost" 
              className="text-white hover:text-quran-primary"
              onClick={() => navigate('/dashboard')}
            >
              <Home className="mr-2 h-4 w-4" />
              Dashboard
            </Button>
            <Button
              variant="ghost"
              onClick={() => navigate(`/class/${classId}`)}
              className="text-white hover:text-quran-primary"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Class
            </Button>
          </div>
          
          <div className="flex gap-2">
            <Button
              variant="ghost"
              onClick={clearTodayAttendance}
              className="text-white hover:text-red-300"
            >
              Clear Today's Records
            </Button>
            
            {classId && <AttendanceHistory classId={classId} />}
          </div>
        </div>

        <div className="bg-white/10 backdrop-blur-sm p-6 rounded-xl shadow-lg">
          <h1 className="text-2xl font-bold mb-6 text-white">
            {className} - {getAttendanceTitle(classId)}
          </h1>

          {!classData ? (
            <div className="text-center p-6 bg-white/5 rounded-lg">
              <p className="text-white text-lg">
                No attendance data available for this class.
              </p>
            </div>
          ) : classData.students && classData.students.length > 0 ? (
            <ScrollArea className="h-[calc(100vh-250px)]">
              <div className="space-y-4">
                {classData.students.map((student) => (
                  <div 
                    key={student.id}
                    className="flex items-center justify-between p-4 bg-white/20 rounded-lg"
                  >
                    <div className="flex flex-col">
                      <span className="font-medium text-white">{student.name}</span>
                      {classId && <MonthlyAbsenceBadge studentId={student.id} classId={classId} />}
                    </div>
                    <div className="space-x-3">
                      <Button
                        size="sm"
                        variant="outline"
                        className="bg-green-500/20 hover:bg-green-500/30 text-white border-green-400"
                        onClick={() => handleMarkPresent(student.id)}
                      >
                        Present
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="bg-red-500/20 hover:bg-red-500/30 text-white border-red-400"
                        onClick={() => handleMarkAbsent(student.id, student.name)}
                      >
                        Absent
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          ) : (
            <div className="text-center p-6 bg-white/5 rounded-lg">
              <p className="text-white text-lg">No students found in this class.</p>
            </div>
          )}
        </div>
      </div>
      
      <NotificationPresetSelect
        open={isPresetOpen}
        onOpenChange={setIsPresetOpen}
        type="lesson_absent"
        onSelect={handleSelectPreset}
        classId={linkedWeekdayClassId || classId}
        isWeekday={true}
      />
    </div>
  );
};

export default ClassAttendance;
