import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { useQuery } from "@tanstack/react-query";

interface ProcessRegistrationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  registration: any;
  onSuccess: () => void;
}

export const ProcessRegistrationDialog = ({
  open,
  onOpenChange,
  registration,
  onSuccess
}: ProcessRegistrationDialogProps) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [studentClassAssignments, setStudentClassAssignments] = useState<Record<string, string>>({});
  
  const { data: classes = [] } = useQuery({
    queryKey: ['classes'],
    queryFn: async () => {
      const { data, error } = await supabase.from('classes').select('*').order('name');
      if (error) throw error;
      return data || [];
    }
  });

  const handleProcessRegistration = async () => {
    setIsProcessing(true);
    
    try {
      // Validate all students have class assignments
      const students = registration.students || [];
      for (const student of students) {
        if (!studentClassAssignments[student.id]) {
          toast.error(`Please assign a class for ${student.name}`);
          setIsProcessing(false);
          return;
        }
      }

      const response = await supabase.functions.invoke('process-registration', {
        body: {
          registrationId: registration.id,
          classAssignments: studentClassAssignments
        }
      });

      if (response.error) throw response.error;

      toast.success("Registration processed successfully!");
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error processing registration:', error);
      toast.error(error.message || "Failed to process registration");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Process Registration</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Parent Info */}
          <div className="space-y-2">
            <h3 className="font-semibold text-lg">Parent Information</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <Label className="text-muted-foreground">Name</Label>
                <p className="font-medium">{registration.parent_name}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Email</Label>
                <p className="font-medium">{registration.email}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Phone</Label>
                <p className="font-medium">{registration.phone}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Type</Label>
                <p className="font-medium capitalize">{registration.registration_type}</p>
              </div>
            </div>
          </div>

          {/* Students */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Students</h3>
            {(registration.students || []).map((student: any) => (
              <div key={student.id} className="p-4 border rounded-lg space-y-3">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium">{student.name}</p>
                    <p className="text-sm text-muted-foreground">Age: {student.age}</p>
                  </div>
                </div>
                
                <div>
                  <Label htmlFor={`class-${student.id}`}>Assign to Class *</Label>
                  <Select
                    value={studentClassAssignments[student.id] || ""}
                    onValueChange={(value) => {
                      setStudentClassAssignments(prev => ({
                        ...prev,
                        [student.id]: value
                      }));
                    }}
                  >
                    <SelectTrigger id={`class-${student.id}`}>
                      <SelectValue placeholder="Select class" />
                    </SelectTrigger>
                    <SelectContent>
                      {classes.map((cls) => (
                        <SelectItem key={cls.id} value={cls.id}>
                          {cls.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            ))}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isProcessing}>
            Cancel
          </Button>
          <Button onClick={handleProcessRegistration} disabled={isProcessing}>
            {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create Accounts
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
