
import { Button } from "@/components/ui/button";
import { useWeekdayAttendance } from "@/hooks/useWeekdayAttendance";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { NotificationPresetSelect } from "@/components/quran/NotificationPresetSelect";
import { supabase } from "@/lib/supabase";
import { WeekdayAttendanceListPortal } from "./WeekdayAttendanceListPortal";
import { AttendanceHistory } from "@/components/attendance/AttendanceHistory";

interface WeekdayAttendanceProps {
  classId: string;
}

const getAttendanceTitle = (classId: string) => {
  // Map class IDs to their respective day titles
  const classTitles: Record<string, string> = {
    '2dcc106b-adfe-4717-b64d-40135a32a5f1': 'Monday Class',
    '3f96c141-b1ca-495c-9d36-f6c3768e4307': 'Wednesday Class',
    '4c5c84f2-ddac-4e09-a92e-8537c5502降2e': 'Thursday Class',
    '5e8e9f3a-7b0d-4f1a-b8c9-6d2e1f3a4b5c': 'Friday Class'
  };
  return classTitles[classId] || 'Class Attendance';
};

const getClassNameFromId = (classId: string): string => {
  const classNames: Record<string, string> = {
    'a6184b1b-6299-4d0c-9f17-6cbf68591a35': 'Monday',
    'c44e5a86-41ef-4714-90c8-542bf6fdf9e4': 'Friday',
    '74410dba-7cee-41ab-81c0-a8bbe3e7a042': 'Wednesday',
    'ee5cf54f-e467-4654-8d7e-051a259d27e4': 'Thursday'
  };
  return classNames[classId] || 'class';
};

export const WeekdayAttendance = ({
  classId
}: WeekdayAttendanceProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isPresetOpen, setIsPresetOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<{ id: string, name: string } | null>(null);
  const [presetType, setPresetType] = useState<"lesson_absent" | "lesson_fail">("lesson_absent");
  
  // Effect to ensure default presets exist
  useEffect(() => {
    const ensureDefaultPresetsExist = async () => {
      try {
        // Check if any presets already exist in notification_presets table
        const { data: existingPresets, error: checkError } = await supabase
          .from("notification_presets")
          .select("id")
          .eq("type", "lesson_absent")
          .limit(1);
          
        if (checkError) {
          console.error("Error checking for existing presets:", checkError);
          return;
        }
        
        // If no presets found, create default ones
        if (!existingPresets || existingPresets.length === 0) {
          console.log("No default presets found, creating some...");
          
          const defaultPresets = [
            {
              type: "lesson_absent",
              content: "{{student_name}} was marked absent in today's class.",
              is_default: true
            },
            {
              type: "lesson_absent",
              content: "{{student_name}} missed class today. Please let us know if there was any reason for the absence.",
              is_default: true
            },
            {
              type: "lesson_fail",
              content: "{{student_name}} had some difficulty with today's lesson. More practice is needed.",
              is_default: true
            }
          ];
          
          const { error: insertError } = await supabase
            .from("notification_presets")
            .insert(defaultPresets);
            
          if (insertError) {
            console.error("Error creating default presets:", insertError);
          } else {
            console.log("Successfully created default presets");
          }
        }
      } catch (err) {
        console.error("Error in ensureDefaultPresetsExist:", err);
      }
    };
    
    ensureDefaultPresetsExist();
  }, []);

  const {
    classData,
    markAttendance,
    linkedWeekdayClassId
  } = useWeekdayAttendance(classId);

  const handleMarkAbsent = async (studentId: string, name: string) => {
    setSelectedStudent({ id: studentId, name });
    setPresetType("lesson_absent");
    setIsPresetOpen(true);
  };

  const handleMarkPresent = async (studentId: string) => {
    try {
      await markAttendance({
        studentId,
        status: 'present'
      });
      toast.success('Marked as present');
    } catch (error) {
      console.error('Error marking present:', error);
      toast.error('Failed to mark attendance');
    }
  };

  const handleSelectPreset = async (message: string, newLesson?: { surah: string; verses: string }) => {
    if (!selectedStudent) return;

    try {
      await markAttendance({
        studentId: selectedStudent.id,
        status: 'absent',
        note: message
      });
      toast.success(`Marked ${selectedStudent.name} as absent`);
      if (message) {
        const className = getClassNameFromId(classId);
        const formattedMessage = message
          .replace('{{student_name}}', selectedStudent.name)
          .replace('{{class_name}}', className);
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

  const handleMarkAllAbsent = async () => {
    if (!classData?.students) return;

    const unmarkedStudents = classData.students.filter(s => !s.attendanceStatus);
    
    if (unmarkedStudents.length === 0) {
      toast.error('No students to mark absent');
      return;
    }

    if (!confirm(`Mark ${unmarkedStudents.length} student${unmarkedStudents.length !== 1 ? 's' : ''} as absent and send level-appropriate notifications?`)) {
      return;
    }

    const results = {
      marked: 0,
      notificationsSent: 0,
      failed: [] as string[]
    };

    toast.loading(`Processing ${unmarkedStudents.length} students...`);

    for (const student of unmarkedStudents) {
      try {
        const absenceLevel = student.absence_level || 1;
        
        // Fetch preset for this student's level
        const { data: presets } = await supabase
          .from('notification_presets')
          .select('*')
          .eq('type', 'lesson_absent')
          .eq('level', absenceLevel)
          .eq('is_adult', false)
          .limit(1);

        let message = '';
        if (presets && presets.length > 0) {
          const className = getClassNameFromId(classId);
          message = presets[0].content
            .replace('{{student_name}}', student.name)
            .replace('{{class_name}}', className);
        }

        // Mark attendance
        await markAttendance({
          studentId: student.id,
          status: 'absent',
          note: message
        });
        results.marked++;

        // Send SMS if we have a message
        if (message) {
          try {
            await supabase.functions.invoke('send-sms', {
              body: {
                student_id: student.id,
                sms_message: message,
                debug_mode: false
              }
            });
            results.notificationsSent++;
          } catch (smsError) {
            console.error(`Failed to send SMS for ${student.name}:`, smsError);
          }
        }

        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 150));
      } catch (error) {
        console.error(`Error processing ${student.name}:`, error);
        results.failed.push(student.name);
      }
    }

    toast.dismiss();

    if (results.failed.length === 0) {
      toast.success(`Successfully marked ${results.marked} students absent and sent ${results.notificationsSent} notifications`);
    } else {
      toast.warning(`Marked ${results.marked} absent, sent ${results.notificationsSent} notifications. Failed: ${results.failed.join(', ')}`);
    }
  };

  if (!classData) {
    return <Button variant="outline" onClick={() => setIsOpen(true)} className="w-full md:w-auto bg-white/10 text-white hover:bg-white/20">
        Attendance
      </Button>;
  }

  console.log("WeekdayAttendance component - classId:", classId, "linkedWeekdayClassId:", linkedWeekdayClassId);

  return (
    <>
      <div className="flex flex-col sm:flex-row gap-2">
        <Button 
          variant="outline" 
          onClick={() => setIsOpen(true)} 
          className="w-full md:w-auto bg-white/10 text-white hover:bg-white/20"
        >
          Mark Attendance
        </Button>
        
        <AttendanceHistory classId={classId} />
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[720px] max-w-[95vw] bg-white">
          <WeekdayAttendanceListPortal
            students={classData.students || []}
            classTitle={getAttendanceTitle(classId)}
            classId={classId}
            onMarkPresent={handleMarkPresent}
            onMarkAbsent={handleMarkAbsent}
            onMarkAllAbsent={handleMarkAllAbsent}
          />
        </DialogContent>
      </Dialog>

      <NotificationPresetSelect
        open={isPresetOpen}
        onOpenChange={setIsPresetOpen}
        type={presetType}
        onSelect={handleSelectPreset}
        classId={classId}
        isWeekday={true}
        studentName={selectedStudent?.name}
        studentId={selectedStudent?.id}
      />
    </>
  );
};
