
import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, UserCheck } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useState, useEffect } from "react";
import { Separator } from "@/components/ui/separator";
import { NotificationPresetButtonList } from "./NotificationPresetButtonList";
import { LessonUpdateSection } from "./LessonUpdateSection";
import { CustomMessageSection } from "./CustomMessageSection";
import { NotificationPresetTabs } from "@/components/settings/notification-templates/NotificationPresetTabs";

type PresetType = "lesson_fail" | "lesson_absent" | "lesson_repeat";

interface NotificationPresetSelectProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  type: PresetType;
  onSelect: (msg: string, newLesson?: { surah: string; verses: string }) => void;
  classId?: string;
  isWeekday?: boolean;
  studentName?: string;
  studentId?: string;
  onExcusedAbsent?: () => void;
}

export const NotificationPresetSelect = ({
  open, 
  onOpenChange, 
  type, 
  onSelect,
  classId,
  isWeekday,
  studentName = "Student",
  studentId,
  onExcusedAbsent
}: NotificationPresetSelectProps) => {
  const [customMessage, setCustomMessage] = useState("{{student_name}} ");
  const [updateLesson, setUpdateLesson] = useState(false);
  const [startSurah, setStartSurah] = useState("");
  const [endSurah, setEndSurah] = useState("");
  const [startVerses, setStartVerses] = useState("");
  const [endVerses, setEndVerses] = useState("");
  const [activeTab, setActiveTab] = useState("parent");
  const [className, setClassName] = useState("");

  // Fetch class name to determine if it's junior/senior
  useQuery({
    queryKey: ['class-name', classId],
    queryFn: async () => {
      if (!classId) return null;
      
      const { data: classData } = await supabase
        .from('classes')
        .select('name')
        .eq('id', classId)
        .single();
      
      if (classData) {
        setClassName(classData.name.toLowerCase());
        
        // Automatically set tab based on class name for junior/senior classes
        const lowerClassName = classData.name.toLowerCase();
        if (lowerClassName.includes('junior')) {
          setActiveTab("parent");
        } else if (lowerClassName.includes('senior')) {
          setActiveTab("adult");
        }
      }
      
      return classData;
    },
    enabled: open && !!classId
  });

  useEffect(() => {
    if (open) {
      setCustomMessage("{{student_name}} ");
    }
  }, [open]);

  const { data: presets, isLoading } = useQuery({
    queryKey: ['notification-presets', type, classId, isWeekday, activeTab, studentId],
    queryFn: async () => {
      let failureLevel = 1;
      let absenceLevel = 1;
      
      if (studentId) {
        const { data: studentData } = await supabase
          .from('students')
          .select('failure_level, absence_level')
          .eq('id', studentId)
          .single();
        
        if (studentData) {
          failureLevel = studentData.failure_level || 1;
          absenceLevel = studentData.absence_level || 1;
        }
      }

      console.log("Fetching presets for classId:", classId, "type:", type, "isWeekday:", isWeekday, "failureLevel:", failureLevel, "absenceLevel:", absenceLevel);
      
      if (isWeekday) {
        const { data: weekdayPresets, error: weekdayError } = await supabase
          .from("weekday_notification_presets")
          .select("*")
          .eq("type", type)
          .eq("class_id", classId);
          
        if (weekdayError) {
          console.error("Error fetching weekday presets:", weekdayError);
        } else if (weekdayPresets && weekdayPresets.length > 0) {
          console.log("Fetched class-specific weekday presets:", weekdayPresets);
          return weekdayPresets;
        }
        
        const { data: generalWeekdayPresets, error: generalError } = await supabase
          .from("weekday_notification_presets")
          .select("*")
          .eq("type", type)
          .is("class_id", null);
          
        if (generalError) {
          console.error("Error fetching general weekday presets:", generalError);
        } else if (generalWeekdayPresets && generalWeekdayPresets.length > 0) {
          console.log("Fetched general weekday presets:", generalWeekdayPresets);
          return generalWeekdayPresets;
        }
      }
      
      const query = supabase
        .from("notification_presets")
        .select("*")
        .eq("type", type)
        .eq("is_adult", activeTab === "adult");

      // Filter by the appropriate level based on preset type
      if (type === 'lesson_fail') {
        console.log(`Fetching lesson_fail presets for level ${failureLevel}`);
        query.eq('level', failureLevel);
      } else if (type === 'lesson_absent') {
        console.log(`Fetching lesson_absent presets for absence level ${absenceLevel}`);
        query.eq('level', absenceLevel);
      }
        
      const { data: generalPresets, error } = await query;
        
      if (error) {
        console.error("Error fetching general presets:", error);
        throw error;
      }
      
      console.log("Fetched default presets:", generalPresets);
      return generalPresets || [];
    },
    enabled: open
  });

  const handleSend = (message: string) => {
    console.log("NotificationPresetSelect received message to send:", message);
    
    // Check for message duplication and fix it if found
    let cleanedMessage = message;
    const halfLength = message.length / 2;
    const firstHalf = message.substring(0, halfLength);
    const secondHalf = message.substring(halfLength);
    
    if (firstHalf.trim() === secondHalf.trim() && halfLength > 10) {
      cleanedMessage = firstHalf.trim();
      console.log("Detected and fixed duplicated content in message");
    }
    
    // Fix the repeated (780) pattern that might appear
    cleanedMessage = cleanedMessage.replace(/(?:\(780\)\s*){2,}/g, '(780) ');
    
    // Ensure phone number is in correct format
    cleanedMessage = cleanedMessage.replace(/\(780\)\s*99\s*0[-\s]?7823/g, '(780) 990-7823');
    cleanedMessage = cleanedMessage.replace(/780[-\s]?990[-\s]?7823/, '(780) 990-7823');
    
    // Make sure we send the complete message without truncation
    const fullMessage = cleanedMessage.trim();
    console.log("Full preprocessed message:", fullMessage);
    
    if (updateLesson && startSurah && startVerses && endSurah && endVerses) {
      const formattedLessonRef = `${startSurah}: ${startVerses}-${endVerses}`;
      const formattedMessage = fullMessage.replace('{{lesson}}', formattedLessonRef);
      console.log("Sending formatted message with lesson:", formattedMessage);
      onSelect(formattedMessage, {
        surah: startSurah,
        verses: `${startVerses}-${endVerses}`
      });
    } else {
      console.log("Sending regular message:", fullMessage);
      onSelect(fullMessage);
    }
    setCustomMessage("{{student_name}} ");
    setUpdateLesson(false);
    setStartSurah("");
    setEndSurah("");
    setStartVerses("");
    setEndVerses("");
  };

  const handleExcusedAbsentClick = () => {
    if (onExcusedAbsent) {
      onExcusedAbsent();
      onOpenChange(false);
    }
  };

  // Hide tabs for junior/senior classes since they're auto-determined
  const showTabs = !className.includes('junior') && !className.includes('senior');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-screen h-screen max-w-full max-h-full bg-white text-black shadow-lg border border-gray-200 overflow-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            Send message to {studentName}
          </DialogTitle>
          <DialogDescription>
            Choose a preset message below or mark as excused absent
          </DialogDescription>
        </DialogHeader>
        
        {/* Excused Absent Button */}
        {onExcusedAbsent && (
          <div className="mb-4">
            <Button
              onClick={handleExcusedAbsentClick}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white py-3 text-lg font-medium"
              size="lg"
            >
              <UserCheck className="h-5 w-5 mr-2" />
              Mark as Excused Absent (No SMS)
            </Button>
          </div>
        )}
        
        {showTabs && <NotificationPresetTabs activeTab={activeTab} onTabChange={setActiveTab} />}
        
        {isLoading ? (
          <div className="flex justify-center items-center py-6">
            <Loader2 className="animate-spin h-5 w-5" />
          </div>
        ) : (
          <div className="flex flex-col gap-3 w-full">
            <LessonUpdateSection
              updateLesson={updateLesson}
              setUpdateLesson={setUpdateLesson}
              startSurah={startSurah}
              setStartSurah={setStartSurah}
              endSurah={endSurah}
              setEndSurah={setEndSurah}
              startVerses={startVerses}
              setStartVerses={setStartVerses}
              endVerses={endVerses}
              setEndVerses={setEndVerses}
            />
            
            <Separator className="my-2" />
            
            <NotificationPresetButtonList presets={presets ?? []} onSend={handleSend} />

            <CustomMessageSection
              type={type}
              customMessage={customMessage}
              setCustomMessage={setCustomMessage}
              onSend={handleSend}
            />

            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="bg-white hover:bg-gray-50"
            >
              Cancel
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
