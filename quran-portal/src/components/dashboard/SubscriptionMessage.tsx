
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { handleSignOut } from "@/lib/authUtils";

interface SubscriptionMessageProps {
  title: string;
  message: string;
  onSubscribe?: () => void;
  showSubscribeButton?: boolean;
}

export const SubscriptionMessage = ({ 
  title, 
  message, 
  onSubscribe,
  showSubscribeButton = false 
}: SubscriptionMessageProps) => {
  const navigate = useNavigate();

  return (
    <div className="rounded-lg border border-quran-border bg-white/10 p-8 backdrop-blur text-center">
      <h2 className="text-2xl font-bold text-white mb-4">{title}</h2>
      <p className="text-white/70 mb-8">{message}</p>
      <div className="flex justify-center gap-4">
        {showSubscribeButton && onSubscribe && (
          <Button 
            onClick={onSubscribe}
            className="bg-quran-primary text-white hover:bg-quran-primary/90"
          >
            Subscribe Now
          </Button>
        )}
        <Button
          variant="outline"
          onClick={() => handleSignOut(navigate)}
          className="text-white border-white hover:bg-white hover:text-quran-bg"
        >
          <LogOut className="mr-2 h-4 w-4" />
          Sign Out
        </Button>
      </div>
    </div>
  );
};
