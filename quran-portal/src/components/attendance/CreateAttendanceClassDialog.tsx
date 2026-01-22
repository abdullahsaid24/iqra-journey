import { useState } from "react";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
interface CreateAttendanceClassDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}
export const CreateAttendanceClassDialog = ({
  open,
  onOpenChange
}: CreateAttendanceClassDialogProps) => {
  const [className, setClassName] = useState("");
  const queryClient = useQueryClient();
  const {
    mutate: createClass,
    isPending
  } = useMutation({
    mutationFn: async (name: string) => {
      const {
        data,
        error
      } = await supabase.from('classes').insert([{
        name
      }]).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['classes']
      });
      toast.success(`Class "${className}" has been created`);
      setClassName("");
      onOpenChange(false);
    },
    onError: error => {
      console.error("Error creating class:", error);
      toast.error("Failed to create class");
    }
  });
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (className.trim()) {
      createClass(className.trim());
    }
  };
  return <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-neutral-50">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create Attendance Class</DialogTitle>
            <DialogDescription>
              Create a new class for attendance tracking
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Class Name
              </Label>
              <Input id="name" placeholder="Enter class name" className="col-span-3" value={className} onChange={e => setClassName(e.target.value)} required />
            </div>
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
              Cancel
            </Button>
            <Button type="submit" disabled={!className.trim() || isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Class
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>;
};