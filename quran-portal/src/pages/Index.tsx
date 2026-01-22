
import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ClassManagementModal } from "@/components/ClassManagementModal";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { ClassGrid } from "@/components/dashboard/ClassGrid";
import { DashboardActions } from "@/components/dashboard/DashboardActions";
import { DashboardSkeleton } from "@/components/dashboard/DashboardSkeleton";
import { useUserRole } from "@/hooks/useUserRole";
import { useClasses } from "@/hooks/useClasses";
import { useClassMutations } from "@/hooks/useClassMutations";
import { SettingsIcon } from "@/components/SettingsIcon";

const Index = () => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDeleteMode, setIsDeleteMode] = useState(false);
  const [hoverClassId, setHoverClassId] = useState<string | null>(null);

  const { isAdmin, userRole } = useUserRole();
  const { data: classes, isLoading } = useClasses(userRole);
  const { handleAddClass, handleDeleteClass } = useClassMutations();

  const onDeleteClass = async (classId: string) => {
    const success = await handleDeleteClass(classId);
    if (success) {
      setIsDeleteMode(false);
    }
  };

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100/50">
      <div className="container mx-auto space-y-8 px-4 py-8">
        <div className="space-y-4">
          <div className="flex items-center justify-between relative z-10">
            <Link to="/">
              <Button variant="ghost" className="text-gray-700 hover:text-quran-primary transition-colors">
                Back to Home
              </Button>
            </Link>
            <SettingsIcon />
          </div>
          {isAdmin && (
            <div className="flex justify-end">
              <DashboardActions
                onAddClass={() => setIsAddModalOpen(true)}
                isDeleteMode={isDeleteMode}
                onToggleDeleteMode={setIsDeleteMode}
              />
            </div>
          )}
        </div>

        <DashboardHeader />

        <div className="rounded-xl backdrop-blur-sm bg-white/30">
          <ClassGrid
            classes={classes || []}
            isDeleteMode={isDeleteMode}
            hoverClassId={hoverClassId}
            onHover={setHoverClassId}
            onDelete={onDeleteClass}
          />
        </div>

        <ClassManagementModal
          open={isAddModalOpen}
          onOpenChange={setIsAddModalOpen}
          onAddClass={handleAddClass}
        />
      </div>
    </div>
  );
};

export default Index;
