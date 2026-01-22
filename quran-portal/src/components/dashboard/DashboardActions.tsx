
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";

interface DashboardActionsProps {
  onAddClass: () => void;
  isDeleteMode: boolean;
  onToggleDeleteMode: (value: boolean) => void;
  isSubscribed?: boolean;
  onSubscribe?: () => void;
}

export const DashboardActions = ({
  onAddClass,
  isDeleteMode,
  onToggleDeleteMode,
  isSubscribed,
  onSubscribe,
}: DashboardActionsProps) => {
  return (
    <div className="flex gap-2 sm:gap-3 animate-fade-in">
      <Button
        variant="outline"
        onClick={onAddClass}
        className="bg-white/80 hover:bg-white text-quran-primary border border-white/20
          hover:text-quran-primary/90 transition-all duration-300 shadow-sm
          backdrop-blur-sm hover:shadow-md h-9 sm:h-10 px-3 sm:px-4 text-sm"
      >
        <Plus className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
        Add Class
      </Button>
      <Button
        variant="outline"
        onClick={() => onToggleDeleteMode(!isDeleteMode)}
        className={`h-9 sm:h-10 px-3 sm:px-4 text-sm bg-white/80 border border-white/20 backdrop-blur-sm
          transition-all duration-300 shadow-sm hover:shadow-md
          ${isDeleteMode 
            ? 'bg-red-500 text-white hover:bg-red-600 border-red-400' 
            : 'text-red-500 hover:bg-red-500 hover:text-white'
          }`}
      >
        <Trash2 className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
        Remove
      </Button>
      {!isSubscribed && onSubscribe && (
        <Button 
          onClick={onSubscribe}
          className="h-9 sm:h-10 px-3 sm:px-4 text-sm bg-quran-primary text-white hover:bg-quran-primary/90
            transition-all duration-300 shadow-sm hover:shadow-md
            backdrop-blur-sm"
        >
          Subscribe
        </Button>
      )}
    </div>
  );
};
