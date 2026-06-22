
import { useState } from "react";
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
import { Bell, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useBatchAbsentNotify } from "@/quran/hooks/useBatchAbsentNotify";

interface NotifyAbsentButtonProps {
  classId: string;
}

export const NotifyAbsentButton = ({ classId }: NotifyAbsentButtonProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const {
    absentStudents,
    absentCount,
    isLoading,
    notifyAllAbsent,
    isNotifying,
    notifyResult,
  } = useBatchAbsentNotify(classId);

  const handleNotify = () => {
    notifyAllAbsent(absentStudents, {
      onSuccess: (result) => {
        const message =
          result.failed > 0
            ? `Sent ${result.sent} notifications (${result.failed} failed)`
            : `Sent ${result.sent} notifications successfully`;
        toast.success(message);
        setIsOpen(false);
      },
      onError: (error) => {
        console.error("Batch notify error:", error);
        toast.error("Failed to send notifications");
      },
    });
  };

  if (isLoading) return null;

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="bg-amber-50 text-amber-600 hover:bg-amber-500 hover:text-white border-amber-500 flex items-center gap-1 text-xs sm:text-sm px-2 sm:px-3"
        onClick={() => setIsOpen(true)}
        disabled={absentCount === 0}
      >
        <Bell className="h-3 w-3 sm:h-4 sm:w-4" />
        <span className="hidden sm:inline">Notify Absent</span>
        <span className="sm:hidden">Notify</span>
        {absentCount > 0 && (
          <span className="ml-1 inline-flex items-center justify-center rounded-full bg-amber-600 text-white text-xs font-medium h-5 min-w-[20px] px-1">
            {absentCount}
          </span>
        )}
      </Button>

      <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Notify Absent Students</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div>
                <p className="mb-3">
                  Send absence notification SMS to the following {absentCount} student
                  {absentCount !== 1 ? "s" : ""}:
                </p>
                <ScrollArea className="max-h-[200px]">
                  <ul className="space-y-1">
                    {absentStudents.map((student) => (
                      <li
                        key={student.id}
                        className="flex items-center gap-2 py-1 px-2 rounded bg-amber-50 text-amber-800 text-sm"
                      >
                        <span className="w-2 h-2 rounded-full bg-amber-400 flex-shrink-0" />
                        {student.name}
                        <span className="text-xs text-amber-500 ml-auto">
                          Level {student.absence_level}
                        </span>
                      </li>
                    ))}
                  </ul>
                </ScrollArea>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isNotifying}>Cancel</AlertDialogCancel>
            <Button
              onClick={handleNotify}
              disabled={isNotifying || absentCount === 0}
              className="bg-amber-600 hover:bg-amber-700 text-white"
            >
              {isNotifying ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Bell className="mr-2 h-4 w-4" />
                  Send Notifications
                </>
              )}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
