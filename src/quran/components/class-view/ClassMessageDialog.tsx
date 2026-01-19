import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/quran/components/ui/dialog";
import { Button } from "@/quran/components/ui/button";
import { Textarea } from "@/quran/components/ui/textarea";
import { Loader2, MessageCircle, Users } from "lucide-react";
import { supabase } from "@/quran/lib/supabase";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
interface ClassMessageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  classId: string;
  className: string;
}
export function ClassMessageDialog({
  open,
  onOpenChange,
  classId,
  className
}: ClassMessageDialogProps) {
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [showRecipients, setShowRecipients] = useState(false);

  // Fetch recipient count for this class
  const {
    data: recipientData,
    isLoading: isLoadingRecipients
  } = useQuery({
    queryKey: ['class-recipients', classId],
    queryFn: async () => {
      // First, check if this class has any linked classes
      const { data: linkedClassData } = await supabase
        .from('class_links')
        .select('weekday_class_id, weekend_class_id')
        .or(`weekday_class_id.eq.${classId},weekend_class_id.eq.${classId}`)
        .maybeSingle();

      // Get all linked class IDs (including the current class)
      const linkedClassIds = [classId];
      if (linkedClassData) {
        if (linkedClassData.weekday_class_id !== classId) {
          linkedClassIds.push(linkedClassData.weekday_class_id);
        }
        if (linkedClassData.weekend_class_id !== classId) {
          linkedClassIds.push(linkedClassData.weekend_class_id);
        }
      }

      console.log('Fetching students for class IDs:', linkedClassIds);

      // Get students in this class AND any linked classes
      const {
        data: students,
        error: studentsError
      } = await supabase.from('students').select('id, name, email').in('class_id', linkedClassIds);
      if (studentsError) throw studentsError;
      if (!students || students.length === 0) {
        return {
          phoneNumbers: [],
          students: [],
          count: 0
        };
      }

      // Get unique student emails (students can exist in multiple classes)
      const uniqueEmails = [...new Set(students.map(s => s.email).filter(Boolean))];
      console.log(`Found ${students.length} student records, ${uniqueEmails.length} unique emails`);

      // Get ALL student IDs across all classes that match these emails
      const {
        data: allStudentMatches,
        error: allStudentsError
      } = await supabase.from('students').select('id, email').in('email', uniqueEmails);
      if (allStudentsError) throw allStudentsError;

      const allStudentIds = allStudentMatches?.map(s => s.id) || [];
      console.log(`Found ${allStudentIds.length} total student IDs across all classes`);

      // Get parent_user_ids for these students
      const { data: parentUserIds, error: parentUserIdsError } = await supabase
        .from('parent_student_links')
        .select('parent_user_id, student_id')
        .in('student_id', allStudentIds);
      if (parentUserIdsError) throw parentUserIdsError;

      const uniqueParentUserIds = [...new Set(parentUserIds?.map(p => p.parent_user_id) || [])];
      console.log(`Found ${uniqueParentUserIds.length} unique parent users`);

      // Get ALL phone numbers for these parents (from ANY of their links)
      const {
        data: parentLinks,
        error: parentError
      } = await supabase
        .from('parent_student_links')
        .select('phone_number, secondary_phone_number, parent_user_id, student_id')
        .in('parent_user_id', uniqueParentUserIds);
      if (parentError) throw parentError;

      // Get adult student phone numbers by email
      const {
        data: adultStudents,
        error: adultError
      } = await supabase.from('adult_students').select('phone_number, email').in('email', uniqueEmails);
      if (adultError) throw adultError;

      // Collect unique phone numbers
      const phoneNumbers = new Set();
      const recipients = [];

      // Add parent numbers
      parentLinks?.forEach(link => {
        const studentMatch = allStudentMatches?.find(s => s.id === link.student_id);
        const student = students.find(s => s.email === studentMatch?.email);
        if (link.phone_number?.trim()) {
          phoneNumbers.add(link.phone_number.trim());
          recipients.push({
            phone: link.phone_number.trim(),
            type: 'Parent',
            studentName: student?.name || 'Unknown'
          });
        }
        if (link.secondary_phone_number?.trim()) {
          phoneNumbers.add(link.secondary_phone_number.trim());
          recipients.push({
            phone: link.secondary_phone_number.trim(),
            type: 'Parent (Secondary)',
            studentName: student?.name || 'Unknown'
          });
        }
      });

      // Add adult student numbers
      adultStudents?.forEach(adult => {
        const student = students.find(s => s.email === adult.email);
        if (adult.phone_number?.trim()) {
          phoneNumbers.add(adult.phone_number.trim());
          recipients.push({
            phone: adult.phone_number.trim(),
            type: 'Adult Student',
            studentName: student?.name || 'Unknown'
          });
        }
      });
      return {
        phoneNumbers: Array.from(phoneNumbers),
        recipients,
        students,
        count: phoneNumbers.size
      };
    },
    enabled: open
  });
  const handleSendMessage = async () => {
    if (!message.trim()) {
      toast.error("Please enter a message");
      return;
    }
    setIsSending(true);
    try {
      const response = await supabase.functions.invoke('send-class-sms', {
        body: {
          class_id: classId,
          message: message.trim()
        }
      });
      if (response.error) {
        console.error("Error sending class SMS:", response.error);
        toast.error("Failed to send message");
      } else if (response.data?.sent > 0) {
        toast.success(`Message sent to ${response.data.sent} recipient${response.data.sent > 1 ? 's' : ''} in ${className}`);
        setMessage("");
        onOpenChange(false);
      } else {
        toast.warning("No messages were sent. Please check if there are valid phone numbers for this class.");
      }
    } catch (error) {
      console.error("Error sending class message:", error);
      toast.error("Failed to send message");
    } finally {
      setIsSending(false);
    }
  };
  return <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="max-w-2xl bg-white">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2 text-slate-900">
          <MessageCircle className="h-5 w-5 text-quran-primary" />
          Send Message to {className}
        </DialogTitle>
        <DialogDescription className="text-slate-600">
          Send an announcement to all parents and adult students in this class
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-4">
        {/* Recipient Info */}
        <div className="bg-slate-50 border border-slate-200 p-3 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-slate-500" />
              <span className="text-sm font-medium text-slate-900">
                {isLoadingRecipients ? <span className="flex items-center gap-2">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Loading recipients...
                </span> : `${recipientData?.count || 0} recipient${(recipientData?.count || 0) !== 1 ? 's' : ''}`}
              </span>
            </div>
            {recipientData && recipientData.count > 0 && <Button variant="ghost" size="sm" onClick={() => setShowRecipients(!showRecipients)} className="text-quran-primary hover:text-quran-primary/80 hover:bg-quran-primary/10">
              {showRecipients ? 'Hide' : 'View'} Recipients
            </Button>}
          </div>

          {showRecipients && recipientData && <div className="mt-3 max-h-32 overflow-y-auto">
            <div className="space-y-1">
              {recipientData.recipients.map((recipient, index) => <div key={index} className="text-xs text-slate-600 flex justify-between">
                <span>{recipient.studentName}</span>
                <span>{recipient.type}: {recipient.phone}</span>
              </div>)}
            </div>
          </div>}
        </div>

        {/* Message Input */}
        <div>
          <label htmlFor="message" className="block text-sm font-medium mb-2 text-slate-900">
            Message
          </label>
          <Textarea
            id="message"
            value={message}
            onChange={e => setMessage(e.target.value)}
            placeholder="Enter your message to send to all parents and adult students in this class..."
            rows={6}
            className="resize-none bg-white border-slate-200 focus:ring-quran-primary"
          />
          <div className="text-xs text-slate-500 mt-1">
            {message.length}/1600 characters (SMS limit)
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSending} className="bg-white text-slate-700 border-slate-200 hover:bg-slate-50">
            Cancel
          </Button>
          <Button
            onClick={handleSendMessage}
            disabled={isSending || !message.trim() || (recipientData?.count || 0) === 0}
            className="bg-quran-primary text-white hover:bg-quran-primary/90"
          >
            {isSending ? <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Sending...
            </> : `Send to ${recipientData?.count || 0} recipient${(recipientData?.count || 0) !== 1 ? 's' : ''}`}
          </Button>
        </div>
      </div>
    </DialogContent>
  </Dialog>;
}
