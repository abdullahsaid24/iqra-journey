import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/quran/components/ui/dialog";
import { Button } from "@/quran/components/ui/button";
import { Textarea } from "@/quran/components/ui/textarea";
import { Loader2, MessageCircle, Info } from "lucide-react";
import { supabase } from "@/quran/lib/supabase";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/quran/components/ui/tooltip";
interface GlobalMessageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}
export function GlobalMessageDialog({
  open,
  onOpenChange
}: GlobalMessageDialogProps) {
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);

  // Fetch recipient count
  const {
    data: recipientCount,
    isLoading: isLoadingRecipients
  } = useQuery({
    queryKey: ['global-recipients-count'],
    queryFn: async () => {
      const phoneSet = new Set<string>();

      // Fetch primary phone numbers from parent_student_links
      const {
        data: parentLinks,
        error: parentLinksError
      } = await supabase.from("parent_student_links").select("phone_number, secondary_phone_number").not("phone_number", "is", null);
      if (parentLinksError) throw parentLinksError;

      // Fetch phone numbers from adult_students
      const {
        data: adultStudents,
        error: adultStudentsError
      } = await supabase.from("adult_students").select("phone_number").not("phone_number", "is", null);
      if (adultStudentsError) throw adultStudentsError;
      parentLinks?.forEach(link => {
        if (link.phone_number) phoneSet.add(link.phone_number.trim());
        if (link.secondary_phone_number) phoneSet.add(link.secondary_phone_number.trim());
      });
      adultStudents?.forEach(student => {
        if (student.phone_number) phoneSet.add(student.phone_number.trim());
      });
      return phoneSet.size;
    },
    enabled: open
  });
  const handleSendMessage = async () => {
    if (!message.trim()) {
      toast.error("Please enter a message to send");
      return;
    }
    try {
      setIsSending(true);
      const {
        data,
        error
      } = await supabase.functions.invoke("send-global-sms", {
        body: {
          message
        }
      });
      if (error) throw error;
      toast.success(`Message sent to ${data.sent || 0} recipient${data.sent !== 1 ? "s" : ""}`);
      setMessage("");
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error sending global message:", error);
      toast.error(`Failed to send message: ${error.message || "Unknown error"}`);
    } finally {
      setIsSending(false);
    }
  };
  return <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-neutral-50">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-neutral-950">
            <MessageCircle className="h-5 w-5" />
            Send Global Message
          </DialogTitle>
          <DialogDescription className="text-neutral-950">
            Send an announcement to all registered phone numbers in the system
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Recipient Info */}
          <div className="bg-gray-50 p-3 rounded-lg">
            <div className="flex items-center gap-2">
              <Info className="h-4 w-4 text-gray-600" />
              <span className="text-sm font-medium text-neutral-950">
                {isLoadingRecipients ? <span className="flex items-center gap-2">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Loading recipients...
                  </span> : `${recipientCount || 0} recipient${(recipientCount || 0) !== 1 ? 's' : ''}`}
              </span>
            </div>
          </div>

          {/* Message Input */}
          <div>
            <label htmlFor="message" className="block text-sm font-medium mb-2">
              Message
            </label>
            <Textarea id="message" value={message} onChange={e => setMessage(e.target.value)} placeholder="Enter your global announcement message..." rows={6} className="resize-none" />
            <div className="text-xs text-gray-500 mt-1">
              {message.length}/1600 characters (SMS limit)
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSending} className="bg-neutral-950 hover:bg-neutral-800">
              Cancel
            </Button>
            <Button onClick={handleSendMessage} disabled={isSending || !message.trim() || (recipientCount || 0) === 0} className="text-neutral-950">
              {isSending ? <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </> : `Send to ${recipientCount || 0} recipient${(recipientCount || 0) !== 1 ? 's' : ''}`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>;
}
