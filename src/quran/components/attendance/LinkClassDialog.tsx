import { useState } from "react";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { supabase } from "@/quran/lib/supabase";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/quran/components/ui/dialog";
import { Label } from "@/quran/components/ui/label";
import { Button } from "@/quran/components/ui/button";
import { Loader2 } from "lucide-react";
import { ClassWithStudents } from "@/quran/types/dashboard";
import { ScrollArea } from "@/quran/components/ui/scroll-area";
import { RadioGroup, RadioGroupItem } from "@/quran/components/ui/radio-group";
interface LinkClassDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  existingClasses: ClassWithStudents[];
}
export const LinkClassDialog = ({
  open,
  onOpenChange,
  existingClasses
}: LinkClassDialogProps) => {
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const {
    mutate: linkClass,
    isPending
  } = useMutation({
    mutationFn: async (classId: string) => {
      // Logic to link the class would go here
      // For now, we'll just return success
      return {
        success: true
      };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['classes']
      });
      toast.success("Class has been linked successfully");
      setSelectedClassId(null);
      onOpenChange(false);
    },
    onError: error => {
      console.error("Error linking class:", error);
      toast.error("Failed to link class");
    }
  });
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedClassId) {
      linkClass(selectedClassId);
    } else {
      toast.error("Please select a class to link");
    }
  };
  return <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-neutral-50">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="text-neutral-950">Link to Existing Class</DialogTitle>
            <DialogDescription className="text-neutral-950">
              Select an existing QuranProgress class to link for attendance tracking
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <Label className="mb-2 block bg-neutral-950">Select a class:</Label>
            
            {existingClasses.length > 0 ? <ScrollArea className="h-[200px] rounded-md border p-4">
                <RadioGroup value={selectedClassId || ""} onValueChange={setSelectedClassId}>
                  {existingClasses.map(classItem => <div key={classItem.id} className="flex items-center space-x-2 py-2 border-b last:border-0">
                      <RadioGroupItem value={classItem.id} id={classItem.id} />
                      <Label htmlFor={classItem.id} className="flex-grow">
                        <div className="font-medium bg-neutral-950">{classItem.name}</div>
                        <div className="text-sm text-gray-500">
                          {classItem.students?.length || 0} students
                        </div>
                      </Label>
                    </div>)}
                </RadioGroup>
              </ScrollArea> : <div className="text-center py-8 text-gray-500">
                No classes available to link
              </div>}
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isPending} className="text-neutral-950">
              Cancel
            </Button>
            <Button type="submit" disabled={!selectedClassId || isPending} className="text-neutral-950">
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Link Class
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>;
};
