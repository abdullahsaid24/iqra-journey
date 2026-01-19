
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/quran/components/ui/alert";
import { Button } from "@/quran/components/ui/button";

interface ErrorStateProps {
  error: any;
  onRetry: () => void;
}

export const ErrorState = ({ error, onRetry }: ErrorStateProps) => {
  return (
    <div className="p-6">
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          Failed to load users: {String(error)}
          <div className="mt-2">
            <Button 
              onClick={onRetry} 
              className="px-4 py-2 bg-quran-primary text-white rounded-md hover:bg-quran-primary/90 transition-colors"
            >
              Retry
            </Button>
          </div>
        </AlertDescription>
      </Alert>
    </div>
  );
};
