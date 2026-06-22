
import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/quran/lib/supabase";
import { Button } from "@/quran/components/ui/button";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
} from "@/quran/components/ui/alert-dialog";
import { ScrollArea } from "@/quran/components/ui/scroll-area";
import { toast } from "sonner";
import { Loader2, CheckCircle2, Clock, BookOpen, Users, Search } from "lucide-react";
import { useClassSchedule } from "@/quran/hooks/useClassSchedule";

const SELF_CHECKIN_USER_ID = "00000000-0000-0000-0000-000000000000";

interface StudentWithStatus {
  id: string;
  name: string;
  isPresent: boolean;
}

const SelfCheckIn = () => {
  const queryClient = useQueryClient();
  const schedule = useClassSchedule();
  const [selectedClassId, setSelectedClassId] = useState<{ attendance: string; fetch: string } | null>(null);
  const [confirmStudent, setConfirmStudent] = useState<StudentWithStatus | null>(null);
  const [justCheckedIn, setJustCheckedIn] = useState<Set<string>>(new Set());
  const [currentTime, setCurrentTime] = useState(new Date());
  const [searchQuery, setSearchQuery] = useState("");

  // Update current time every minute
  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);

  // Resolve which class to use
  const activeClassId = selectedClassId?.attendance || schedule.classId;
  const activeFetchClassId = selectedClassId?.fetch || schedule.fetchStudentsClassId;

  // Fetch students for the active class using the fetch ID (since students are linked to the weekday classes)
  const { data: studentsRaw, isLoading: studentsLoading } = useQuery({
    queryKey: ["checkin-students", activeFetchClassId],
    queryFn: async () => {
      if (!activeFetchClassId) return [];
      const { data, error } = await supabase
        .from("students")
        .select("id, name")
        .eq("class_id", activeFetchClassId)
        .order("name");
      if (error) throw error;
      return data || [];
    },
    enabled: !!activeFetchClassId,
  });

  // Fetch today's attendance for the active class
  const { data: attendanceRaw } = useQuery({
    queryKey: ["checkin-attendance", activeClassId],
    queryFn: async () => {
      if (!activeClassId) return [];
      const today = new Date().toISOString().split("T")[0];
      const { data, error } = await supabase
        .from("weekday_attendance")
        .select("student_id, status")
        .eq("class_id", activeClassId)
        .eq("attendance_date", today)
        .eq("status", "present");
      if (error) throw error;
      return data || [];
    },
    enabled: !!activeClassId,
    refetchInterval: 15000,
  });

  // Merge students with attendance status, present students to the bottom
  const students: StudentWithStatus[] = useMemo(() => {
    if (!studentsRaw) return [];
    const presentIds = new Set(attendanceRaw?.map((r) => r.student_id) || []);
    const merged = studentsRaw.map((s) => ({
      ...s,
      isPresent: presentIds.has(s.id) || justCheckedIn.has(s.id),
    }));
    // Sort: not-present first, then present
    return merged.sort((a, b) => {
      if (a.isPresent === b.isPresent) return a.name.localeCompare(b.name);
      return a.isPresent ? 1 : -1;
    });
  }, [studentsRaw, attendanceRaw, justCheckedIn]);

  const filteredStudents = useMemo(() => {
    if (!searchQuery) return students;
    const lowerQuery = searchQuery.toLowerCase();
    return students.filter(s => s.name.toLowerCase().includes(lowerQuery));
  }, [students, searchQuery]);

  // Check-in mutation
  const checkInMutation = useMutation({
    mutationFn: async (studentId: string) => {
      if (!activeClassId) throw new Error("No class selected");
      const today = new Date().toISOString().split("T")[0];
      const { error } = await supabase.from("weekday_attendance").upsert(
        {
          student_id: studentId,
          class_id: activeClassId,
          attendance_date: today,
          status: "present" as const,
          created_by: SELF_CHECKIN_USER_ID,
        },
        { onConflict: "student_id,class_id,attendance_date" }
      );
      if (error) throw error;
    },
    onSuccess: (_, studentId) => {
      setJustCheckedIn((prev) => new Set(prev).add(studentId));
      queryClient.invalidateQueries({ queryKey: ["checkin-attendance", activeClassId] });
      toast.success("Checked in successfully!");
      setConfirmStudent(null);
    },
    onError: (error) => {
      console.error("Check-in error:", error);
      toast.error("Failed to check in. Please try again.");
    },
  });

  const handleStudentTap = (student: StudentWithStatus) => {
    if (student.isPresent) return;
    setConfirmStudent(student);
  };

  const handleConfirmCheckIn = () => {
    if (!confirmStudent) return;
    checkInMutation.mutate(confirmStudent.id);
  };

  const todayFormatted = currentTime.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const timeFormatted = currentTime.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  // ─── Closed / Waiting Screen ───
  if (!schedule.isWithinTimeWindow && !schedule.needsLevelSelection && !schedule.classId) {
    return (
      <div className="min-h-[100dvh] relative overflow-hidden bg-[#0a0f16] flex flex-col items-center justify-center p-6 text-center">
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[40%] bg-emerald-600/20 blur-[100px] rounded-full mix-blend-screen" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[50%] bg-teal-600/20 blur-[120px] rounded-full mix-blend-screen" />
        </div>

        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-[2rem] p-8 max-w-md w-full space-y-6 relative z-10 shadow-[0_8px_32px_rgba(0,0,0,0.3)]">
          <div className="text-6xl mb-2">🕌</div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Iqra Attendance</h1>
          <p className="text-slate-400 text-lg font-medium">{todayFormatted}</p>
          <div className="flex items-center justify-center gap-2 text-white text-xl font-semibold">
            <Clock className="h-5 w-5 text-emerald-400" />
            {timeFormatted}
          </div>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-2">
            <p className="text-emerald-400 font-medium">{schedule.timeWindowMessage}</p>
            <p className="text-slate-500 text-sm">No class is scheduled for {schedule.dayName}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!schedule.isWithinTimeWindow) {
    return (
      <div className="min-h-[100dvh] relative overflow-hidden bg-[#0a0f16] flex flex-col items-center justify-center p-6 text-center">
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[40%] bg-emerald-600/20 blur-[100px] rounded-full mix-blend-screen" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[50%] bg-teal-600/20 blur-[120px] rounded-full mix-blend-screen" />
        </div>

        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-[2rem] p-8 max-w-md w-full space-y-6 relative z-10 shadow-[0_8px_32px_rgba(0,0,0,0.3)]">
          <div className="text-6xl mb-2">🕌</div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Iqra Attendance</h1>
          <p className="text-slate-400 text-lg font-medium">{todayFormatted}</p>
          <div className="flex items-center justify-center gap-2 text-white text-xl font-semibold">
            <Clock className="h-5 w-5 text-emerald-400" />
            {timeFormatted}
          </div>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-2">
            <p className="text-emerald-400 font-medium text-lg">{schedule.timeWindowMessage}</p>
            <p className="text-slate-500 text-sm">{schedule.dayName} class</p>
          </div>
          {/* Decorative pattern */}
          <div className="flex justify-center gap-2 pt-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="w-2.5 h-2.5 rounded-full bg-emerald-500/30"
                style={{ animationDelay: `${i * 0.2}s` }}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ─── Weekend Level Selection ───
  if (schedule.needsLevelSelection && !selectedClassId) {
    return (
      <div className="min-h-[100dvh] relative overflow-hidden bg-[#0a0f16] flex flex-col items-center justify-center p-6">
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[40%] bg-emerald-600/20 blur-[100px] rounded-full mix-blend-screen" />
          <div className="absolute top-[30%] right-[-10%] w-[60%] h-[50%] bg-teal-600/20 blur-[120px] rounded-full mix-blend-screen" />
        </div>

        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-[2rem] p-8 max-w-md w-full space-y-6 text-center relative z-10 shadow-[0_8px_32px_rgba(0,0,0,0.3)]">
          <div className="text-4xl mb-4 text-emerald-400">🕌</div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Select Your Class</h1>
          <p className="text-slate-400 font-medium">{todayFormatted}</p>

          <div className="space-y-4 pt-4">
            <button
              onClick={() => setSelectedClassId({
                attendance: schedule.juniorClassId!,
                fetch: schedule.juniorFetchClassId!
              })}
              className="w-full py-6 px-6 rounded-[24px] bg-white/5 border border-white/10 text-white text-xl font-semibold shadow-lg hover:bg-white/10 hover:border-white/20 active:scale-[0.98] transition-all flex items-center justify-center gap-3 group"
            >
              <div className="bg-emerald-500/20 p-3 rounded-full text-emerald-400 group-hover:bg-emerald-500/30 transition-colors">
                <BookOpen className="h-6 w-6" />
              </div>
              Junior Class
            </button>
            <button
              onClick={() => setSelectedClassId({
                attendance: schedule.seniorClassId!,
                fetch: schedule.seniorFetchClassId!
              })}
              className="w-full py-6 px-6 rounded-[24px] bg-white/5 border border-white/10 text-white text-xl font-semibold shadow-lg hover:bg-white/10 hover:border-white/20 active:scale-[0.98] transition-all flex items-center justify-center gap-3 group"
            >
              <div className="bg-teal-500/20 p-3 rounded-full text-teal-400 group-hover:bg-teal-500/30 transition-colors">
                <Users className="h-6 w-6" />
              </div>
              Senior Class
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── Student List & Check-In ───
  const presentCount = students.filter((s) => s.isPresent).length;

  return (
    <div className="min-h-[100dvh] relative overflow-hidden bg-[#0a0f16] flex flex-col">
      {/* Premium Ambient Background */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[40%] bg-emerald-600/20 blur-[100px] rounded-full mix-blend-screen" />
        <div className="absolute top-[30%] right-[-10%] w-[60%] h-[50%] bg-teal-600/20 blur-[120px] rounded-full mix-blend-screen" />
        <div className="absolute bottom-[-10%] left-[20%] w-[50%] h-[40%] bg-blue-600/20 blur-[100px] rounded-full mix-blend-screen" />
      </div>

      <div className="relative z-10 flex flex-col flex-1">
        {/* Modern Header */}
        <div className="px-6 pt-10 pb-4 flex flex-col items-center">
          <div className="inline-flex items-center justify-center px-4 py-1.5 mb-4 rounded-full bg-white/5 border border-white/10 backdrop-blur-md">
            <span className="text-emerald-400 text-sm font-medium flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              Check-in Active
            </span>
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">بسم الله</h1>
          <p className="text-slate-400 text-sm mt-2 font-medium">{todayFormatted}</p>
        {schedule.needsLevelSelection && (
            <Button
              variant="ghost"
              className="mt-4 text-slate-400 hover:text-white hover:bg-white/10 rounded-full text-xs font-medium px-4 h-8"
              onClick={() => setSelectedClassId(null)}
            >
              ← Switch Class Level
            </Button>
          )}
        </div>

        {/* Premium Floating Search Bar */}
        {!studentsLoading && students.length > 0 && (
          <div className="px-6 pb-4 sticky top-0 z-20">
            <div className="relative group">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-emerald-400 transition-colors" />
              <input
                type="text"
                placeholder="Find your name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white/5 backdrop-blur-xl border border-white/10 text-white placeholder:text-slate-500 rounded-full py-4 pl-14 pr-6 text-base font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:bg-white/10 transition-all shadow-[0_8px_32px_rgba(0,0,0,0.2)]"
              />
            </div>
          </div>
        )}

        {/* Student List */}
        {studentsLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-full p-4 shadow-xl">
              <Loader2 className="h-8 w-8 text-emerald-400 animate-spin" />
            </div>
          </div>
        ) : students.length === 0 ? (
          <div className="flex-1 flex items-center justify-center px-6">
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-[2rem] p-8 text-center max-w-sm w-full">
              <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 border border-white/10">
                <Users className="h-8 w-8 text-slate-400" />
              </div>
              <p className="text-slate-300 text-lg font-medium">No students found</p>
              <p className="text-slate-500 text-sm mt-2">There are no students registered for this specific class.</p>
            </div>
          </div>
        ) : (
          <ScrollArea className="flex-1 px-6 pb-24">
            <div className="space-y-3 pb-8">
              {filteredStudents.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-slate-400 text-lg font-medium">No matching names</p>
                  <p className="text-slate-500 text-sm mt-1">Try a different search term</p>
                </div>
            ) : (
              filteredStudents.map((student, index) => (
                <button
                  key={student.id}
                  onClick={() => handleStudentTap(student)}
                  disabled={student.isPresent}
                  style={{ animationDelay: `${Math.min(index * 0.05, 0.5)}s` }}
                  className={`w-full text-left rounded-[24px] p-5 min-h-[80px] flex items-center justify-between transition-all duration-300 active:scale-[0.97] hover:scale-[1.02] animate-in fade-in slide-in-from-bottom-4 ${
                    student.isPresent
                      ? "bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/30 shadow-[0_0_30px_rgba(16,185,129,0.15)]"
                      : "bg-white/5 backdrop-blur-xl border border-white/10 hover:bg-white/10 hover:border-white/20 active:bg-white/15 shadow-[0_8px_32px_rgba(0,0,0,0.1)] hover:shadow-[0_8px_32px_rgba(0,0,0,0.2)]"
                  }`}
                >
                  <span
                    className={`text-[1.1rem] font-semibold tracking-tight ${
                      student.isPresent ? "text-emerald-300" : "text-slate-200"
                    }`}
                  >
                  {student.name}
                </span>
                {student.isPresent ? (
                  <div className="flex items-center gap-2 bg-emerald-500/20 border border-emerald-500/30 px-3 py-1.5 rounded-full shadow-[0_0_15px_rgba(16,185,129,0.2)]">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                    <span className="text-emerald-400 text-sm font-bold tracking-wide uppercase">Present</span>
                  </div>
                ) : (
                  <div className="w-10 h-10 rounded-full border border-white/10 bg-white/5 flex items-center justify-center text-slate-400 group-hover:bg-white/10 group-hover:text-white transition-colors">
                    <div className="w-3 h-3 rounded-full bg-white/20" />
                  </div>
                )}
              </button>
            )))}
          </div>
        </ScrollArea>
      )}
      </div>

      {/* Confirmation Dialog */}
      <AlertDialog
        open={!!confirmStudent}
        onOpenChange={(open) => {
          if (!open) setConfirmStudent(null);
        }}
      >
        <AlertDialogContent className="max-w-[340px] mx-auto rounded-[2rem] bg-[#131b26] border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)] p-6">
          <AlertDialogHeader className="space-y-4">
            <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto border border-emerald-500/30">
              <CheckCircle2 className="h-8 w-8 text-emerald-400" />
            </div>
            <AlertDialogTitle className="text-center text-2xl font-bold text-white tracking-tight">
              Mark Present
            </AlertDialogTitle>
            <AlertDialogDescription className="text-center text-base text-slate-400">
              Are you checking in as <br />
              <span className="font-bold text-emerald-400 text-lg mt-1 block">
                {confirmStudent?.name}
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-col gap-3 mt-6">
            <Button
              onClick={handleConfirmCheckIn}
              disabled={checkInMutation.isPending}
              className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white rounded-2xl py-6 text-lg font-bold shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all"
            >
              {checkInMutation.isPending ? (
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              ) : (
                <CheckCircle2 className="mr-2 h-5 w-5" />
              )}
              Yes, Check In
            </Button>
            <AlertDialogCancel
              className="w-full py-6 text-lg rounded-2xl border-white/10 bg-white/5 hover:bg-white/10 text-white font-semibold transition-all"
              disabled={checkInMutation.isPending}
            >
              Cancel
            </AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default SelfCheckIn;
