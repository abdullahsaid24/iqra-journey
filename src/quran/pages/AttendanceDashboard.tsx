
import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/quran/components/ui/button";
import { useUserRole } from "@/quran/hooks/useUserRole";
import { useClasses } from "@/quran/hooks/useClasses";
import { SettingsIcon } from "@/quran/components/SettingsIcon";
import { Loader2, Plus, Calendar, LinkIcon } from "lucide-react";
import { AttendanceClassGrid } from "@/quran/components/attendance/AttendanceClassGrid";
import { CreateAttendanceClassDialog } from "@/quran/components/attendance/CreateAttendanceClassDialog";
import { LinkClassDialog } from "@/quran/components/attendance/LinkClassDialog";

const AttendanceDashboard = () => {
  const [isCreateClassOpen, setIsCreateClassOpen] = useState(false);
  const [isLinkClassOpen, setIsLinkClassOpen] = useState(false);
  
  const { isAdmin, userRole } = useUserRole();
  const { data: classes, isLoading } = useClasses(userRole);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100/50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-quran-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100/50">
      <div className="container mx-auto space-y-8 px-4 py-8">
        {/* Header */}
        <div className="space-y-4">
          <div className="flex items-center justify-between relative z-10">
            <Link to="/quran/dashboard">
              <Button variant="ghost" className="text-gray-700 hover:text-quran-primary transition-colors">
                Back to Dashboard
              </Button>
            </Link>
            <SettingsIcon />
          </div>
        </div>
        
        {/* Page Title */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">Attendance Management</h1>
          <p className="text-gray-500 mt-2">Create attendance classes or link to existing QuranProgress classes</p>
        </div>
        
        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button 
            className="flex items-center gap-2" 
            onClick={() => setIsCreateClassOpen(true)}
          >
            <Plus size={18} />
            Create Attendance Class
          </Button>
          
          <Button 
            className="flex items-center gap-2" 
            variant="outline"
            onClick={() => setIsLinkClassOpen(true)}
          >
            <LinkIcon size={18} />
            Link to Existing Class
          </Button>
        </div>
        
        {/* Classes Grid */}
        <div className="mt-6">
          <h2 className="text-xl font-semibold mb-4">Your Classes</h2>
          {classes && classes.length > 0 ? (
            <div className="bg-white/30 backdrop-blur-sm p-6 rounded-xl">
              <AttendanceClassGrid classes={classes} />
            </div>
          ) : (
            <div className="text-center py-16 bg-white/30 backdrop-blur-sm rounded-xl">
              <Calendar className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-4 text-lg font-medium text-gray-900">No attendance classes yet</h3>
              <p className="mt-1 text-sm text-gray-500">
                Get started by creating a new attendance class or linking to an existing class.
              </p>
              <div className="mt-6 flex justify-center gap-3">
                <Button onClick={() => setIsCreateClassOpen(true)}>
                  Create Class
                </Button>
                <Button variant="outline" onClick={() => setIsLinkClassOpen(true)}>
                  Link Class
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Dialogs */}
      <CreateAttendanceClassDialog 
        open={isCreateClassOpen} 
        onOpenChange={setIsCreateClassOpen}
      />
      
      <LinkClassDialog
        open={isLinkClassOpen}
        onOpenChange={setIsLinkClassOpen}
        existingClasses={classes || []}
      />
    </div>
  );
};

export default AttendanceDashboard;
