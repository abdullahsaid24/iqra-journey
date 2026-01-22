
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface CustomMessageSectionProps {
  type: "lesson_fail" | "lesson_absent" | "lesson_pass" | "lesson_repeat";
  customMessage: string;
  setCustomMessage: (v: string) => void;
  onSend: (msg: string) => void;
}

export function CustomMessageSection({
  type,
  customMessage,
  setCustomMessage,
  onSend,
}: CustomMessageSectionProps) {
  if (type === "lesson_pass") return null;

  return (
    <div>
      <div>
        <div className="text-xs mb-1">Or enter custom message:</div>
        <Textarea
          placeholder="Enter custom SMS message..."
          value={customMessage}
          onChange={e => setCustomMessage(e.target.value)}
          className="bg-white"
        />
      </div>
      <Button
        variant="default"
        onClick={() => {
          if (customMessage.trim()) onSend(customMessage.trim());
        }}
        disabled={!customMessage.trim()}
        className="bg-quran-primary hover:bg-quran-primary/90 mt-2"
      >
        Send Custom Message
      </Button>
    </div>
  );
}
