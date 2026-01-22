import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2, Info, Send, List as ListIcon } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { GlobalRecipientsModal } from "./GlobalRecipientsModal";
import { useGlobalRecipientNumbers } from "./useGlobalRecipientNumbers";

// Shadcn dialog for modal
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
export const GlobalMessagesTab = () => {
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [recipientCount, setRecipientCount] = useState<number | null>(null);
  const [isNumbersModalOpen, setIsNumbersModalOpen] = useState(false);
  const {
    recipients: phoneNumbers,
    isLoading: isLoadingNumbers,
    fetchNumbers: fetchPhoneNumbers
  } = useGlobalRecipientNumbers();
  const fetchRecipientCount = async () => {
    try {
      // We need to count unique phone numbers across both tables
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
      setRecipientCount(phoneSet.size);
    } catch (error: any) {
      console.error("Error fetching recipient count:", error);
      toast.error("Failed to fetch recipient count");
    }
  };
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
    } catch (error: any) {
      console.error("Error sending global message:", error);
      toast.error(`Failed to send message: ${error.message || "Unknown error"}`);
    } finally {
      setIsSending(false);
    }
  };

  // Fetch recipient count on component mount
  useState(() => {
    fetchRecipientCount();
  });
  return <Card className="border border-quran-border bg-white/90 backdrop-blur-sm shadow-lg">
      <div className="p-6 bg-neutral-50">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-quran-bg font-arabic mb-2">Global Notifications</h2>
          <p className="text-gray-600">Send a message to all registered phone numbers</p>
          <div className="w-32 h-1 bg-quran-primary mx-auto rounded-full mt-2" />
        </div>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <h3 className="text-xl font-medium mr-2 text-neutral-950">Send Global Message</h3>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="sm" className="text-gray-500">
                      <Info className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>This will send an SMS to all registered phone numbers in the system</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <div className="text-sm text-gray-500 flex items-center space-x-2 cursor-pointer select-none">
              <Button variant="outline" size="sm" className="px-3 py-1 h-8" onClick={() => setIsNumbersModalOpen(true)} disabled={recipientCount === null}>
                <ListIcon className="h-4 w-4 mr-1" />
                {recipientCount !== null ? `${recipientCount} recipient${recipientCount !== 1 ? "s" : ""}` : "Loading..."}
              </Button>
            </div>
          </div>
          <Textarea value={message} onChange={e => setMessage(e.target.value)} placeholder="Enter your message here..." className="min-h-[150px]" />
          <div className="flex justify-end">
            <Button onClick={handleSendMessage} disabled={isSending || !message.trim()} className="bg-quran-primary hover:bg-quran-primary/90">
              {isSending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
              Send Message
            </Button>
          </div>
        </div>
      </div>
      <GlobalRecipientsModal open={isNumbersModalOpen} onOpenChange={setIsNumbersModalOpen} recipients={phoneNumbers} isLoading={isLoadingNumbers} onFetch={fetchPhoneNumbers} />
    </Card>;
};