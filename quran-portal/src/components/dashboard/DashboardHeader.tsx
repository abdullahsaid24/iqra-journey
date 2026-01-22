
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Calendar, MessageCircle } from "lucide-react";
import { useState } from "react";
import { GlobalMessageDialog } from "./GlobalMessageDialog";

export const DashboardHeader = () => {
  const [isGlobalMessageOpen, setIsGlobalMessageOpen] = useState(false);

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Classes Dashboard</h1>
          <p className="text-gray-500">
            Manage your Quran classes and student progress
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            onClick={() => setIsGlobalMessageOpen(true)}
            className="flex items-center gap-2"
          >
            <MessageCircle className="h-4 w-4" />
            Global Message
          </Button>
          <Button asChild variant="outline">
            <Link to="/attendance-dashboard" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Attendance Management
            </Link>
          </Button>
        </div>
      </div>
      
      <GlobalMessageDialog
        open={isGlobalMessageOpen}
        onOpenChange={setIsGlobalMessageOpen}
      />
    </div>
  );
};
