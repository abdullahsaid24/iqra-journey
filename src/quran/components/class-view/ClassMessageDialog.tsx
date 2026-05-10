import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/quran/components/ui/dialog";
import { Button } from "@/quran/components/ui/button";
import { Textarea } from "@/quran/components/ui/textarea";
import { Loader2, MessageCircle, Users, AlertTriangle } from "lucide-react";
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
          unreachableStudents: [],
          count: 0
        };
      }

      // Get all class student IDs (for direct parent_student_links lookup)
      const classStudentIds = students.map(s => s.id);

      // Get unique student emails (students can exist in multiple classes)
      const uniqueEmails = [...new Set(students.map(s => s.email).filter(Boolean))];
      console.log(`Found ${students.length} student records, ${uniqueEmails.length} unique emails`);

      // Get ALL student IDs across all classes that match these emails (for sibling discovery)
      let allStudentIds = [...classStudentIds];
      if (uniqueEmails.length > 0) {
        const {
          data: allStudentMatches,
          error: allStudentsError
        } = await supabase.from('students').select('id, email').in('email', uniqueEmails);
        if (allStudentsError) throw allStudentsError;

        const emailMatchedIds = allStudentMatches?.map(s => s.id) || [];
        allStudentIds = [...new Set([...classStudentIds, ...emailMatchedIds])];
      }
      console.log(`Found ${allStudentIds.length} total student IDs (class + email-matched)`);

      // Get parent_user_ids for ALL these students (including those with no email)
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
      let adultStudents = [];
      if (uniqueEmails.length > 0) {
        const {
          data,
          error: adultError
        } = await supabase.from('adult_students').select('phone_number, email').in('email', uniqueEmails);
        if (adultError) throw adultError;
        adultStudents = data || [];
      }

      // Collect unique phone numbers
      const phoneNumbers = new Set();
      const recipients: { phone: string; type: string; studentName: string }[] = [];
      const addedPhones = new Set(); // track phones already added to recipients list

      // Build a map: student_id -> parent phones (only for class students)
      const classStudentIdSet = new Set(students.map(s => s.id));

      // Build parent_user_id -> class student names mapping
      const parentToStudents = new Map<string, string[]>();
      parentUserIds?.forEach(pul => {
        const student = students.find(s => s.id === pul.student_id);
        if (student) {
          const existing = parentToStudents.get(pul.parent_user_id) || [];
          if (!existing.includes(student.name)) existing.push(student.name);
          parentToStudents.set(pul.parent_user_id, existing);
        }
      });

      // Add parent numbers (grouped by parent, showing class student names)
      parentLinks?.forEach(link => {
        const studentNames = parentToStudents.get(link.parent_user_id);
        const displayName = studentNames?.join(', ') || 'Unknown';

        if (link.phone_number?.trim()) {
          const phone = link.phone_number.trim();
          phoneNumbers.add(phone);
          if (!addedPhones.has(phone)) {
            addedPhones.add(phone);
            recipients.push({
              phone,
              type: 'Parent',
              studentName: displayName
            });
          }
        }
        if (link.secondary_phone_number?.trim()) {
          const phone = link.secondary_phone_number.trim();
          phoneNumbers.add(phone);
          if (!addedPhones.has(phone)) {
            addedPhones.add(phone);
            recipients.push({
              phone,
              type: 'Parent (Secondary)',
              studentName: displayName
            });
          }
        }
      });

      // Add adult student numbers
      adultStudents?.forEach(adult => {
        const student = students.find(s => s.email === adult.email);
        if (adult.phone_number?.trim()) {
          const phone = adult.phone_number.trim();
          phoneNumbers.add(phone);
          if (!addedPhones.has(phone)) {
            addedPhones.add(phone);
            recipients.push({
              phone,
              type: 'Adult Student',
              studentName: student?.name || 'Unknown'
            });
          }
        }
      });

      // Find unreachable students (no phone number found via any route)
      const reachableStudentIds = new Set();
      parentLinks?.forEach(link => {
        if (link.phone_number?.trim() || link.secondary_phone_number?.trim()) {
          reachableStudentIds.add(link.student_id);
        }
      });
      // Also mark students reachable via adult_students table
      adultStudents?.forEach(adult => {
        if (adult.phone_number?.trim()) {
          const matchingStudents = students.filter(s => s.email === adult.email);
          matchingStudents.forEach(s => reachableStudentIds.add(s.id));
        }
      });
      // Also mark students reachable via sibling (same email as a reachable student)
      const reachableEmails = new Set();
      students.forEach(s => {
        if (reachableStudentIds.has(s.id) && s.email) {
          reachableEmails.add(s.email);
        }
      });
      students.forEach(s => {
        if (s.email && reachableEmails.has(s.email)) {
          reachableStudentIds.add(s.id);
        }
      });

      const unreachableStudents = students.filter(s => !reachableStudentIds.has(s.id))
        .map(s => ({
          name: s.name,
          reason: (!s.email || !s.email.trim()) ? 'No email' : 'No phone number linked'
        }));
      return {
        phoneNumbers: Array.from(phoneNumbers),
        recipients,
        students,
        unreachableStudents,
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

        {/* Unreachable Students Warning */}
        {recipientData && recipientData.unreachableStudents && recipientData.unreachableStudents.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 p-3 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <span className="text-sm font-medium text-amber-900">
                {recipientData.unreachableStudents.length} student{recipientData.unreachableStudents.length !== 1 ? 's' : ''} will NOT receive this message
              </span>
            </div>
            <div className="max-h-28 overflow-y-auto">
              <div className="space-y-1">
                {recipientData.unreachableStudents.map((student, index) => (
                  <div key={index} className="text-xs text-amber-800 flex justify-between">
                    <span>{student.name}</span>
                    <span className="text-amber-600">{student.reason}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

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
