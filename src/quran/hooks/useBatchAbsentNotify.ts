
import { useQuery, useMutation } from '@tanstack/react-query';
import { supabase } from '@/quran/lib/supabase';

interface AbsentStudent {
  id: string;
  name: string;
  absence_level: number;
}

interface BatchNotifyResult {
  sent: number;
  failed: number;
  total: number;
}

export const useBatchAbsentNotify = (classId: string | undefined) => {
  // Query to get students who are NOT marked present today
  const absentStudentsQuery = useQuery<AbsentStudent[]>({
    queryKey: ['absent-students', classId],
    queryFn: async () => {
      if (!classId) return [];

      // 1. Get all students in the class
      const { data: allStudents, error: studentsError } = await supabase
        .from('students')
        .select('id, name, absence_level')
        .eq('class_id', classId);

      if (studentsError) {
        console.error('Error fetching students:', studentsError);
        throw studentsError;
      }

      if (!allStudents || allStudents.length === 0) return [];

      // 2. Get today's present records
      const today = new Date().toISOString().split('T')[0];
      const { data: presentRecords, error: attendanceError } = await supabase
        .from('weekday_attendance')
        .select('student_id')
        .eq('class_id', classId)
        .eq('attendance_date', today)
        .eq('status', 'present');

      if (attendanceError) {
        console.error('Error fetching attendance:', attendanceError);
        throw attendanceError;
      }

      // 3. Filter to students NOT in the present list
      const presentIds = new Set(presentRecords?.map(r => r.student_id) || []);

      return allStudents
        .filter(student => !presentIds.has(student.id))
        .map(student => ({
          id: student.id,
          name: student.name,
          absence_level: student.absence_level || 1,
        }));
    },
    enabled: !!classId,
    refetchInterval: 30000, // Refresh every 30s to pick up new check-ins
  });

  // Determine if this is an adult (senior) class
  const getIsAdult = async (): Promise<boolean> => {
    if (!classId) return false;
    const { data: classData } = await supabase
      .from('classes')
      .select('name')
      .eq('id', classId)
      .single();

    if (!classData) return false;
    return classData.name.toLowerCase().includes('senior');
  };

  // Mutation to send SMS to all absent students
  const notifyMutation = useMutation<BatchNotifyResult, Error, AbsentStudent[]>({
    mutationFn: async (absentStudents: AbsentStudent[]) => {
      let sent = 0;
      let failed = 0;
      const total = absentStudents.length;
      const today = new Date().toISOString().split('T')[0];

      // Get current session for created_by
      const { data: session } = await supabase.auth.getSession();
      const userId = session?.session?.user?.id;

      // Determine if this is a senior/adult class
      const isAdult = await getIsAdult();

      for (const student of absentStudents) {
        try {
          // 1. Mark them absent in weekday_attendance (upsert) if we have a session
          if (userId && classId) {
            await supabase
              .from('weekday_attendance')
              .upsert(
                {
                  student_id: student.id,
                  class_id: classId,
                  attendance_date: today,
                  status: 'absent' as const,
                  created_by: userId,
                },
                { onConflict: 'student_id,class_id,attendance_date' }
              );
          }

          // 2. Fetch the appropriate notification preset based on absence_level
          const { data: presets } = await supabase
            .from('notification_presets')
            .select('content')
            .eq('type', 'lesson_absent')
            .eq('level', student.absence_level)
            .eq('is_adult', isAdult)
            .limit(1);

          if (!presets || presets.length === 0) {
            console.warn(`No notification preset found for absence_level ${student.absence_level}, is_adult: ${isAdult}`);
            failed++;
            continue;
          }

          // 3. Replace {{student_name}} placeholder with the student's name
          const smsMessage = presets[0].content.replace(/\{\{student_name\}\}/g, student.name);

          // 4. Send SMS via edge function
          const { error: smsError } = await supabase.functions.invoke('send-sms', {
            body: {
              student_id: student.id,
              sms_message: smsMessage,
              debug_mode: false,
            },
          });

          if (smsError) {
            console.error(`SMS failed for ${student.name}:`, smsError);
            failed++;
          } else {
            sent++;
          }
        } catch (err) {
          console.error(`Error processing ${student.name}:`, err);
          failed++;
        }
      }

      return { sent, failed, total };
    },
  });

  return {
    absentStudents: absentStudentsQuery.data || [],
    absentCount: absentStudentsQuery.data?.length || 0,
    isLoading: absentStudentsQuery.isLoading,
    notifyAllAbsent: notifyMutation.mutate,
    isNotifying: notifyMutation.isPending,
    notifyResult: notifyMutation.data,
  };
};
