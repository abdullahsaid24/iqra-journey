import { Settings } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
export const SettingsIcon = () => {
  return <Link to="/settings">
      <Button variant="ghost" size="icon" className="text-slate-950">
        <Settings className="h-6 w-6" />
      </Button>
    </Link>;
};