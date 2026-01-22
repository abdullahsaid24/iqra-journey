import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

export const DirectMessagingTab = () => {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const { toast } = useToast();

  const handleSendMessage = async () => {
    if (!phoneNumber.trim() || !message.trim()) {
      toast({
        title: "Missing Information",
        description: "Please enter both phone number and message",
        variant: "destructive",
      });
      return;
    }

    setIsSending(true);

    try {
      const { data, error } = await supabase.functions.invoke("send-direct-sms", {
        body: {
          phone_number: phoneNumber,
          message: message,
        },
      });

      if (error) throw error;

      toast({
        title: "Message Sent",
        description: `SMS sent successfully to ${data.phone}`,
      });

      // Clear form on success
      setPhoneNumber("");
      setMessage("");
    } catch (error: any) {
      console.error("Error sending SMS:", error);
      toast({
        title: "Failed to Send Message",
        description: error.message || "An error occurred while sending the SMS",
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg md:text-xl">Direct Messaging</CardTitle>
        <CardDescription className="text-sm">
          Send SMS messages to any phone number using your Twilio setup
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="phone-number" className="text-sm md:text-base">Phone Number</Label>
          <Input
            id="phone-number"
            type="tel"
            placeholder="+1234567890 or 1234567890"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            disabled={isSending}
            className="h-11 md:h-10"
          />
          <p className="text-xs md:text-sm text-muted-foreground">
            Enter phone number with or without +1 prefix (US/Canada numbers)
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="message" className="text-sm md:text-base">Message</Label>
          <Textarea
            id="message"
            placeholder="Enter your message here..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            disabled={isSending}
            rows={6}
            className="resize-none"
          />
          <p className="text-xs md:text-sm text-muted-foreground">
            {message.length} characters
          </p>
        </div>

        <Button 
          onClick={handleSendMessage} 
          disabled={isSending || !phoneNumber.trim() || !message.trim()}
          className="w-full h-11 md:h-10 touch-manipulation"
        >
          {isSending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Sending...
            </>
          ) : (
            "Send Message"
          )}
        </Button>
      </CardContent>
    </Card>
  );
};
