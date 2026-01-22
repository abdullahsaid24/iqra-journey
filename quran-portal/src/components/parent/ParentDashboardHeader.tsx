
import { Button } from "@/components/ui/button";
import { Settings, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { handleSignOut } from "@/lib/authUtils";
import { toast } from "sonner";

interface ParentDashboardHeaderProps {
  title: string;
}

export const ParentDashboardHeader = ({ title }: ParentDashboardHeaderProps) => {
  const navigate = useNavigate();

  const handleSettingsClick = () => {
    navigate('/settings');
  };

  const handleLogout = async () => {
    try {
      await handleSignOut(navigate);
    } catch (error) {
      console.error('Error signing out:', error);
      toast.error('Failed to sign out');
    }
  };

  return (
    <div className="mb-8 flex items-center justify-between">
      <h1 className="text-3xl font-bold text-quran-primary">{title}</h1>
      <div className="flex gap-2">
        <Button 
          variant="outline" 
          size="icon" 
          onClick={handleSettingsClick}
          className="hover:bg-white/10 bg-white/80 backdrop-blur-sm"
        >
          <Settings className="h-5 w-5 text-quran-primary" />
        </Button>
        <Button 
          variant="outline" 
          size="icon" 
          onClick={handleLogout}
          className="hover:bg-white/10 bg-white/80 backdrop-blur-sm"
        >
          <LogOut className="h-5 w-5 text-quran-primary" />
        </Button>
      </div>
    </div>
  );
};
