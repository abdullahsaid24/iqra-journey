
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/quran/lib/supabase";
import { getClassScope } from "@/quran/lib/classLinks";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/quran/components/ui/table";
import { Badge } from "@/quran/components/ui/badge";
import { Button } from "@/quran/components/ui/button";
import { UserX, Search } from "lucide-react";
import { toast } from "sonner";
import { useIsMobile } from "@/quran/hooks/use-mobile";
import { useState } from "react";
import { Input } from "@/quran/components/ui/input";
import { Textarea } from "@/quran/components/ui/textarea";
import {
  AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle,
  AlertDialogDescription, AlertDialogFooter,
} from "@/quran/components/ui/alert-dialog";
import { formatLessonDisplay } from "@/quran/lib/utils";
import { useNavigate } from "react-router-dom";
import type { StudentWithProgress, HomeworkAssignment } from "@/quran/types/student";
import { NotificationPresetSelect } from "@/quran/components/quran/NotificationPresetSelect";
import { schoolToday, schoolDateOf } from "@/quran/lib/schoolDate";

interface CurrentStatusTabProps {
  classId?: string;
  onStudentSelect: (studentId: string) => void;
}

const getClassNameFromId = (classId?: string): string => {
  if (!classId) return 'class';
  const classNames: Record<string, string> = {
    'a6184b1b-6299-4d0c-9f17-6cbf68591a35': 'Monday',
    'c44e5a86-41ef-4714-90c8-542bf6fdf9e4': 'Friday',
    '74410dba-7cee-41ab-81c0-a8bbe3e7a042': 'Wednesday',
    'ee5cf54f-e467-4654-8d7e-051a259d27e4': 'Thursday'
  };
  return classNames[classId] || 'class';
};

export const CurrentStatusTab = ({ classId, onStudentSelect }: CurrentStatusTabProps) => {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [isPresetOpen, setIsPresetOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<{ id: string, name: string } | null>(null);
  const [isBulkAbsentOpen, setIsBulkAbsentOpen] = useState(false);
  const [bulkMessage, setBulkMessage] = useState("");
  const [isBulkProcessing, setIsBulkProcessing] = useState(false);

  const { data: students, isLoading, refetch } = useQuery<StudentWithProgress[]>({
    queryKey: ['current-status', classId],
    queryFn: async () => {
      const query = supabase
        .from('students')
        .select(`
          *,
          lessons (
            surah,
            verses,
            is_active
          ),
          homework_assignments (
            type,
            status,
            created_at,
            surah,
            verses
          ),
          monthly_progress (
            lessons_passed,
            lessons_failed,
            review_near_passed,
            review_near_failed,
            review_far_passed,
            review_far_failed,
            active_days
          )
        `)
        .eq('lessons.is_active', true)
        .order('name');

      if (classId) {
        // One row per child, parked on the weekend side of a linked pair, so the
        // roster is this class plus its counterpart.
        const scope = await getClassScope(classId);
        query.in('class_id', scope);
        // ...but lessons and homework are per class, so only show this class's.
        query.eq('lessons.class_id', classId);
        query.eq('homework_assignments.class_id', classId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as unknown as StudentWithProgress[];
    },
  });

  const { data: todayAttendance } = useQuery({
    queryKey: ['today-attendance', classId],
    queryFn: async () => {
      if (!classId) return [];

      const today = schoolToday();
      const { data, error } = await supabase
        .from('weekday_attendance')
        .select('student_id, status')
        .eq('class_id', classId)
        .eq('attendance_date', today);

      if (error) throw error;
      return data || [];
    },
    enabled: !!classId
  });

  const handleSelectPreset = async (message: string) => {
    if (!selectedStudent) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Please sign in to mark student as absent");
        return;
      }

      const today = schoolToday();
      const toastId = toast.loading("Marking student as absent...");

      const { error: attendanceError } = await supabase
        .from('weekday_attendance')
        .upsert({
          student_id: selectedStudent.id,
          class_id: classId || '',
          attendance_date: today,
          status: 'absent',
          note: message,
          created_by: user.id
        }, {
          onConflict: 'student_id,class_id,attendance_date'
        });

      if (attendanceError) {
        console.error("Error marking attendance:", attendanceError);
        toast.dismiss(toastId);
        toast.error("Failed to mark student as absent");
        return;
      }

      try {
        const className = getClassNameFromId(classId);
        const formattedMessage = message
          .replace(/\{\{?student_?name\}\}?/gi, selectedStudent.name)
          .replace(/\{\{?class_?name\}\}?/gi, className);
        console.log("Sending SMS notification for student:", selectedStudent.id, "with message:", formattedMessage);

        const response = await supabase.functions.invoke('send-sms', {
          body: {
            student_id: selectedStudent.id,
            is_passing: false,
            is_homework: false,
            sms_message: formattedMessage,
            debug_mode: false
          }
        });

        console.log('SMS notification response:', response);

        toast.dismiss(toastId);

        if (response.error) {
          console.error("Error sending SMS notification:", response.error);
          toast.warning("Student marked as absent but SMS notification failed");
        } else if (response.data?.sent > 0) {
          toast.success(`SMS notification sent successfully`);
          if (classId) {
            navigate(`/quran/class/${classId}`);
          }
        } else if (response.data?.errors && response.data.errors.length > 0) {
          console.log("SMS notification errors:", response.data.errors);
          toast.warning("Student marked as absent but SMS notification failed");
        } else {
          console.log("SMS notification response:", response.data);
          toast.success("Student marked as absent");
          if (classId) {
            navigate(`/quran/class/${classId}`);
          }
        }
      } catch (smsError) {
        console.error("Error sending SMS notification:", smsError);
        toast.dismiss(toastId);
        toast.warning("Student marked as absent but SMS notification failed");
      }

      queryClient.invalidateQueries({ queryKey: ['today-attendance', classId] });
      setIsPresetOpen(false);
      setSelectedStudent(null);

    } catch (error) {
      console.error("Error marking student as absent:", error);
      toast.error("Failed to mark student as absent");
    }
  };

  const handleExcusedAbsent = async (studentId: string, name: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Please sign in to mark student as absent");
        return;
      }

      const today = schoolToday();
      const toastId = toast.loading("Marking student as excused absent...");

      const { error: attendanceError } = await supabase
        .from('weekday_attendance')
        .upsert({
          student_id: studentId,
          class_id: classId || '',
          attendance_date: today,
          status: 'absent',
          note: 'Excused Absence',
          created_by: user.id
        }, {
          onConflict: 'student_id,class_id,attendance_date'
        });

      if (attendanceError) {
        console.error("Error marking attendance:", attendanceError);
        toast.dismiss(toastId);
        toast.error("Failed to mark student as excused absent");
        return;
      }

      toast.dismiss(toastId);
      toast.success(`${name} marked as excused absent`);
      queryClient.invalidateQueries({ queryKey: ['today-attendance', classId] });

    } catch (error) {
      console.error("Error marking student as excused absent:", error);
      toast.error("Failed to mark student as excused absent");
    }
  };

  const handleMarkAbsent = (studentId: string, name: string) => {
    setSelectedStudent({ id: studentId, name });
    setIsPresetOpen(true);
  };

  const handleMarkAllAbsent = () => {
    if (!studentsNeedingAttention || studentsNeedingAttention.length === 0) {
      toast.error('No students to mark absent');
      return;
    }
    setBulkMessage("");
    setIsBulkAbsentOpen(true);
  };

  const confirmMarkAllAbsent = async () => {
    setIsBulkProcessing(true);
    setIsBulkAbsentOpen(false);

    // Blank means keep the existing behaviour: each student gets the preset for
    // their own absence level. A custom message replaces that for everyone, with
    // the same placeholders substituted.
    const customMessage = bulkMessage.trim();

    const results = {
      marked: 0,
      notificationsSent: 0,
      failed: [] as string[]
    };

    toast.loading(`Processing ${studentsNeedingAttention.length} students...`);

    for (const student of studentsNeedingAttention) {
      try {
        const absenceLevel = student.absence_level || 1;

        const { data: presets } = customMessage
          ? { data: null }
          : await supabase
              .from('notification_presets')
              .select('*')
              .eq('type', 'lesson_absent')
              .eq('level', absenceLevel)
              .eq('is_adult', false)
              .limit(1);

        const className = getClassNameFromId(classId);
        let message = '';
        if (customMessage) {
          message = customMessage;
        } else if (presets && presets.length > 0) {
          message = presets[0].content;
        }
        message = message
          .replace(/\{\{?student_?name\}\}?/gi, student.name)
          .replace(/\{\{?class_?name\}\}?/gi, className);

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) continue;

        const today = schoolToday();
        const { error: attendanceError } = await supabase
          .from('weekday_attendance')
          .upsert({
            student_id: student.id,
            class_id: classId || '',
            attendance_date: today,
            status: 'absent',
            note: message,
            created_by: user.id
          }, {
            onConflict: 'student_id,class_id,attendance_date'
          });

        if (attendanceError) {
          console.error(`Error marking ${student.name}:`, attendanceError);
          results.failed.push(student.name);
          continue;
        }
        results.marked++;

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

        await new Promise(resolve => setTimeout(resolve, 150));
      } catch (error) {
        console.error(`Error processing ${student.name}:`, error);
        results.failed.push(student.name);
      }
    }

    toast.dismiss();

    if (results.failed.length === 0) {
      toast.success(`Successfully marked ${results.marked} students absent and sent ${results.notificationsSent} notifications`);
      if (classId) {
        navigate(`/quran/class/${classId}`);
      }
    } else {
      toast.warning(`Marked ${results.marked} absent, sent ${results.notificationsSent} notifications. Failed: ${results.failed.join(', ')}`);
    }

    queryClient.invalidateQueries({ queryKey: ['today-attendance', classId] });
    queryClient.invalidateQueries({ queryKey: ['current-status', classId] });
    setIsBulkProcessing(false);
  };

  if (isLoading) {
    return <div className="p-4 text-center text-lg">Loading...</div>;
  }

  const allStudents = students || [];
  const filteredStudents = allStudents?.filter(student =>
    student.name?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const getLastStatus = (student: StudentWithProgress) => {
    // Check if student is marked absent today
    const todayAbsent = todayAttendance?.find(att => att.student_id === student.id && att.status === 'absent');
    if (todayAbsent) {
      return "Absent";
    }

    if (!student.homework_assignments || student.homework_assignments.length === 0) {
      return "No assignments";
    }

    const lastAssignment = student.homework_assignments
      .filter(assignment => assignment.type === 'lesson')
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];

    if (!lastAssignment) {
      return "No lessons";
    }

    return lastAssignment.status === 'passed' ? 'Passed' :
      lastAssignment.status === 'failed' ? 'Failed' :
        lastAssignment.status === 'absent' ? 'Absent' : 'Pending';
  };

  const getLessonStatus = (student: StudentWithProgress) => {
    const today = schoolToday();

    if (!student.homework_assignments || student.homework_assignments.length === 0) {
      return "Not updated";
    }

    // created_at is a UTC timestamp; compare the school-local day it falls on,
    // not the leading characters of the UTC string.
    const todayAssignments = student.homework_assignments.filter(assignment =>
      schoolDateOf(assignment.created_at) === today
    );

    return todayAssignments.length > 0 ? "Updated today" : "Not updated";
  };

  const isStudentCompleted = (student: StudentWithProgress) => {
    const lessonStatus = getLessonStatus(student);
    const todayAbsent = todayAttendance?.find(att => att.student_id === student.id && att.status === 'absent');

    return lessonStatus === "Updated today" || todayAbsent;
  };

  const completedStudents = filteredStudents.filter(student => isStudentCompleted(student));
  const studentsNeedingAttention = filteredStudents.filter(student => !isStudentCompleted(student));

  const renderStudentTable = (students: StudentWithProgress[], title: string, showCount: boolean = true, showBulkAction: boolean = false) => (
    <div className="rounded-md border w-full overflow-x-auto mb-6">
      <div className="py-4 px-6 bg-quran-bg text-white font-medium text-2xl flex items-center justify-between">
        <span>{title} {showCount && `(${students.length})`}</span>
        {showBulkAction && students.length > 0 && (
          <Button
            onClick={handleMarkAllAbsent}
            variant="outline"
            className="bg-amber-50 hover:bg-amber-100 text-amber-900 border-amber-200"
          >
            <UserX className="h-4 w-4 mr-2" />
            Mark Absent for Rest ({students.length} student{students.length !== 1 ? 's' : ''})
          </Button>
        )}
      </div>
      <Table className="min-w-full text-xl">
        <TableHeader>
          <TableRow className="bg-quran-bg text-white">
            <TableHead className="text-white text-xl font-semibold min-w-[200px] py-5">Student</TableHead>
            <TableHead className="text-white text-xl font-semibold min-w-[250px] py-5">Current Lesson</TableHead>
            <TableHead className="text-white text-xl font-semibold min-w-[180px] py-5">Lesson Status</TableHead>
            <TableHead className="text-white text-xl font-semibold min-w-[150px] py-5">Last Status</TableHead>
            <TableHead className="text-white text-xl font-semibold min-w-[200px] py-5">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {students.map((student) => {
            const currentLesson = student.lessons?.[0];
            const lastStatus = getLastStatus(student);
            const lessonStatus = getLessonStatus(student);
            const absenceLevel = student.absence_level || 1;

            const rowBgColor = student.id.charCodeAt(0) % 2 === 0
              ? "bg-quran-bg/10 hover:bg-quran-bg/20"
              : "bg-quran-bg/5 hover:bg-quran-bg/15";

            return (
              <TableRow
                key={student.id}
                className={rowBgColor}
              >
                <TableCell
                  className="font-medium text-xl cursor-pointer hover:text-quran-primary hover:underline py-5"
                  onClick={() => onStudentSelect(student.id)}
                >
                  {student.name}
                </TableCell>
                <TableCell className="text-xl py-5">
                  {currentLesson ? formatLessonDisplay(currentLesson.surah, currentLesson.verses) : 'Not set'}
                </TableCell>
                <TableCell className="py-5">
                  <Badge
                    variant={lessonStatus === "Updated today" ? "default" : "secondary"}
                    className={`text-lg px-4 py-2 ${lessonStatus === "Updated today" ? "bg-green-500 text-white" : ""}`}
                  >
                    {lessonStatus}
                  </Badge>
                </TableCell>
                <TableCell className="py-5">
                  <Badge
                    variant={
                      lastStatus === 'Passed' ? 'default' :
                        lastStatus === 'Failed' ? 'destructive' :
                          lastStatus === 'Absent' ? 'outline' :
                            'secondary'
                    }
                    className={`text-lg px-4 py-2 ${lastStatus === 'Passed' ? 'bg-green-500 text-white' :
                        lastStatus === 'Absent' ? 'border-orange-500 text-orange-500' : ''
                      }`}
                  >
                    {lastStatus}
                  </Badge>
                </TableCell>
                <TableCell className="py-5">
                  <div className="flex items-center gap-3">
                    <Button
                      variant="outline"
                      size="lg"
                      onClick={() => handleMarkAbsent(student.id, student.name || "")}
                      className="border-amber-500 text-amber-500 hover:bg-amber-100 hover:text-amber-600 px-5 py-3 text-lg"
                    >
                      <UserX className="h-5 w-5 mr-2" />
                      Absent
                    </Button>
                    <Badge
                      variant={
                        absenceLevel === 3 ? 'destructive' :
                          absenceLevel === 2 ? 'outline' :
                            'secondary'
                      }
                      className={`text-lg px-4 py-2 ${absenceLevel === 2 ? 'border-amber-500 text-amber-500' : ''
                        }`}
                    >
                      Level {absenceLevel}
                    </Badge>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="relative">
        <Search className="absolute left-3 top-3 h-6 w-6 text-quran-bg opacity-70" />
        <Input
          placeholder="Search students..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-12 border-quran-border text-xl py-4"
        />
      </div>

      {/* Students Needing Attention Section */}
      {studentsNeedingAttention.length > 0 && renderStudentTable(studentsNeedingAttention, "Students Needing Attention", true, true)}

      {/* Completed Students Section */}
      {completedStudents.length > 0 && renderStudentTable(completedStudents, "Completed Students")}

      {/* Show message if no students found */}
      {filteredStudents.length === 0 && (
        <div className="text-center p-8 bg-white/5 rounded-lg">
          <p className="text-gray-500 text-xl">No students found.</p>
        </div>
      )}

      <NotificationPresetSelect
        open={isPresetOpen}
        onOpenChange={setIsPresetOpen}
        type="lesson_absent"
        onSelect={handleSelectPreset}
        classId={classId}
        isWeekday={true}
        studentName={selectedStudent?.name}
        studentId={selectedStudent?.id}
        onExcusedAbsent={selectedStudent ? () => handleExcusedAbsent(selectedStudent.id, selectedStudent.name) : undefined}
      />

      <AlertDialog open={isBulkAbsentOpen} onOpenChange={setIsBulkAbsentOpen}>
        <AlertDialogContent className="max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle>
              Mark {studentsNeedingAttention.length} student{studentsNeedingAttention.length !== 1 ? 's' : ''} absent
            </AlertDialogTitle>
            <AlertDialogDescription>
              {getClassNameFromId(classId)} - each student will be marked absent for today and their
              parent notified.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="max-h-32 overflow-y-auto rounded-md border bg-slate-50 p-2 text-sm text-slate-700">
            {studentsNeedingAttention.map(s => s.name).join(', ')}
          </div>

          <div className="space-y-2">
            <label htmlFor="bulk-absent-message" className="text-sm font-medium">
              Custom message <span className="font-normal text-slate-500">(optional)</span>
            </label>
            <Textarea
              id="bulk-absent-message"
              value={bulkMessage}
              onChange={e => setBulkMessage(e.target.value)}
              placeholder="Leave blank to send each student's usual absence message."
              rows={4}
              className="resize-none"
            />
            <p className="text-xs text-slate-500">
              {bulkMessage.trim()
                ? `This message goes to all ${studentsNeedingAttention.length}. You can use {{student_name}} and {{class_name}}. ${bulkMessage.length} characters, ${bulkMessage.length === 0 ? 0 : Math.ceil(bulkMessage.length / 153)} SMS segment${Math.ceil(bulkMessage.length / 153) !== 1 ? 's' : ''} each.`
                : "Blank uses each student's own absence-level message, as now."}
            </p>
          </div>

          <AlertDialogFooter>
            <Button variant="outline" onClick={() => setIsBulkAbsentOpen(false)} disabled={isBulkProcessing}>
              Cancel
            </Button>
            <Button onClick={confirmMarkAllAbsent} disabled={isBulkProcessing} className="bg-amber-600 hover:bg-amber-700 text-white">
              {isBulkProcessing
                ? 'Processing...'
                : `Mark absent & notify (${studentsNeedingAttention.length})`}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
