import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/quran/components/ui/button";
import { Label } from "@/quran/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/quran/components/ui/radio-group";
import { toast } from "sonner";
import { SurahSelect } from "./SurahSelect";
import { VersesSelect } from "./VersesSelect";
import { supabase } from "@/quran/lib/supabase";
import { formatLessonDisplay, cleanVerseReferences } from "@/quran/lib/utils";

interface HomeworkAssignmentProps {
  studentId: string;
  onAssign: () => void;
}

export const HomeworkAssignment = ({ studentId, onAssign }: HomeworkAssignmentProps) => {
  const [selectedSurah, setSelectedSurah] = useState("");
  const [selectedVerses, setSelectedVerses] = useState("");
  const [status, setStatus] = useState<"pending" | "passed" | "failed">("pending");
  const queryClient = useQueryClient();

  const assignHomeworkMutation = useMutation({
    mutationFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("No session found");

      const { error } = await supabase
        .from("homework_assignments")
        .insert({
          student_id: studentId,
          surah: selectedSurah,
          verses: selectedVerses,
          status,
          assigned_by: session.user.id,
          type: 'homework'
        });

      if (error) throw error;
      
      const { data: studentData } = await supabase
        .from('students')
        .select('name')
        .eq('id', studentId)
        .single();
      
      if (studentData) {
        const { data: parentLinks } = await supabase
          .from('parent_student_links')
          .select('parent_user_id, phone_number')
          .eq('student_id', studentId);
          
        if (parentLinks && parentLinks.length > 0) {
          const notificationPromises = parentLinks.map(async (link) => {
            try {
              if (link.phone_number) {
                console.log(`Sending homework notification to parent ${link.parent_user_id} for student ${studentData.name}`);
                
                const formattedVerses = formatLessonDisplay(selectedSurah, `${selectedSurah}:${selectedVerses}`);
                
                const response = await supabase.functions.invoke('send-sms', {
                  body: {
                    student_id: studentId,
                    is_homework: true,
                    studentName: studentData.name,
                    messageType: 'homework_assigned',
                    sms_message: `Homework assigned for ${studentData.name}: ${formattedVerses}`,
                    debug_mode: true
                  }
                });
                
                if (response.error) {
                  console.error("SMS notification error:", response.error);
                  return { success: false, message: response.error.message };
                } 
                
                if (response.data) {
                  if (response.data.simulated) {
                    console.log("Simulated SMS notification:", response.data.intended_message);
                    return { success: true, simulated: true };
                  } else if (response.data.sent > 0) {
                    console.log("SMS notification sent successfully:", response.data);
                    return { success: true };
                  } else if (response.data.errors) {
                    console.warn("SMS notification issue:", response.data.errors);
                    return { success: false, message: response.data.errors[0] };
                  }
                }
                
                return { success: false, message: "Unknown response from SMS service" };
              } else {
                console.log(`Parent ${link.parent_user_id} has no phone number, skipping notification`);
                return { success: true, skipped: true };
              }
            } catch (notificationError: any) {
              console.error("Error sending notification:", notificationError);
              return { success: false, message: notificationError.message };
            }
          });
          
          const results = await Promise.all(notificationPromises);
          
          const successful = results.filter(r => r.success && !r.skipped);
          const simulated = results.filter(r => r.success && r.simulated);
          const failed = results.filter(r => !r.success);
          
          if (successful.length > 0) {
            if (simulated.length === successful.length) {
              toast.success(`Notification would be sent to parents (development mode)`);
            } else if (failed.length === 0) {
              toast.success(`Homework notifications sent successfully`);
            } else {
              toast.success(`Sent ${successful.length} notifications, ${failed.length} failed`);
            }
          } else if (failed.length > 0) {
            toast.warning(`Issue sending notifications: ${failed[0].message}`);
          }
        } else {
          console.log(`No parents linked to student ${studentId}, skipping notification`);
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["homework", studentId] });
      toast.success("Homework assigned successfully");
      onAssign();
    },
    onError: (error: any) => {
      console.error("Error assigning homework:", error);
      toast.error(`Failed to assign homework: ${error.message}`);
    },
  });

  const handleAssign = useCallback(async () => {
    if (!selectedSurah || !selectedVerses) {
      toast.error("Please select both surah and verses");
      return;
    }

    try {
      await assignHomeworkMutation.mutateAsync();
    } catch (error) {
      console.error("Error in handleAssign:", error);
    }
  }, [selectedSurah, selectedVerses, assignHomeworkMutation]);

  return (
    <div className="space-y-6 p-6 bg-white rounded-lg shadow-md">
      <h3 className="text-2xl font-semibold text-quran-bg">Assign Homework</h3>
      
      <div className="space-y-4">
        <SurahSelect
          selectedSurah={selectedSurah}
          onSurahChange={setSelectedSurah}
        />

        <VersesSelect
          selectedVerses={selectedVerses}
          onVersesChange={setSelectedVerses}
          selectedSurah={selectedSurah}
        />

        <div className="space-y-2">
          <Label>Status</Label>
          <RadioGroup
            value={status}
            onValueChange={(value) => setStatus(value as "pending" | "passed" | "failed")}
            className="flex space-x-4"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="pending" id="pending" />
              <Label htmlFor="pending">Pending</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="passed" id="passed" />
              <Label htmlFor="passed">Passed</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="failed" id="failed" />
              <Label htmlFor="failed">Failed</Label>
            </div>
          </RadioGroup>
        </div>

        <Button
          onClick={handleAssign}
          className="w-full bg-quran-primary text-white hover:bg-quran-primary/90"
          disabled={assignHomeworkMutation.isPending}
        >
          {assignHomeworkMutation.isPending ? "Assigning..." : "Assign Homework"}
        </Button>
      </div>
    </div>
  );
};
