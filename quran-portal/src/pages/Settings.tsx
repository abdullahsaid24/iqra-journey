
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AccountSettings } from "@/components/settings/AccountSettings";
import { PasswordChangeForm } from "@/components/settings/PasswordChangeForm";
import { CreateUserForm } from "@/components/settings/CreateUserForm";
import { UserManagementTab } from "@/components/settings/user-management/UserManagement";
import { useUserRole } from "@/hooks/useUserRole";
import { AdminTeacherUserForm } from "@/components/settings/AdminTeacherUserForm";
import { TeacherManagementTab } from "@/components/settings/teacher-management/TeacherManagementTab";
import { NotificationTemplatesTab } from "@/components/settings/notification-templates/NotificationTemplatesTab";
import { AdultStudentManagementForm } from "@/components/settings/parent-management/AdultStudentManagementForm";
import { RegistrationsTab } from "@/components/settings/registrations/RegistrationsTab";
import { StudentLevelsReset } from "@/components/settings/StudentLevelsReset";
import { AutoResetStatus } from "@/components/settings/AutoResetStatus";
import { SubscriptionManagementTab } from "@/components/settings/subscription-management/SubscriptionManagementTab";
import { DirectMessagingTab } from "@/components/settings/DirectMessagingTab";
import { useEffect, useState } from "react";

const Settings = () => {
  const navigate = useNavigate();
  const { isAdmin } = useUserRole();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState("account");
  
  useEffect(() => {
    // Check if there's a tab query parameter
    const params = new URLSearchParams(location.search);
    const tabParam = params.get("tab");
    
    if (tabParam && ["account", "users", "admin-teacher", "teacher-classes", "notifications", "adult-students", "registrations", "subscriptions", "messaging"].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [location.search]);

  return (
    <div className="container mx-auto p-4 md:p-8">
      <Button
        variant="outline"
        onClick={() => navigate(-1)}
        className="mb-4 md:mb-8"
      >
        Back
      </Button>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4 md:space-y-8">
        <div className="overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0">
          <TabsList className="w-full md:w-auto inline-flex bg-muted min-w-max">
            <TabsTrigger value="account" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-xs md:text-sm px-2 md:px-3">
              Account
            </TabsTrigger>
            {isAdmin && (
              <>
                <TabsTrigger value="users" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-xs md:text-sm px-2 md:px-3">
                  Users
                </TabsTrigger>
                <TabsTrigger value="admin-teacher" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-xs md:text-sm px-2 md:px-3">
                  Admin
                </TabsTrigger>
                <TabsTrigger value="teacher-classes" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-xs md:text-sm px-2 md:px-3">
                  Teachers
                </TabsTrigger>
                <TabsTrigger value="notifications" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-xs md:text-sm px-2 md:px-3">
                  Notifications
                </TabsTrigger>
                <TabsTrigger value="adult-students" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-xs md:text-sm px-2 md:px-3">
                  Adults
                </TabsTrigger>
                <TabsTrigger value="registrations" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-xs md:text-sm px-2 md:px-3">
                  Registrations
                </TabsTrigger>
                <TabsTrigger value="subscriptions" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-xs md:text-sm px-2 md:px-3">
                  Subscriptions
                </TabsTrigger>
                <TabsTrigger value="messaging" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-xs md:text-sm px-2 md:px-3">
                  Messaging
                </TabsTrigger>
              </>
            )}
          </TabsList>
        </div>

        <TabsContent value="account" className="space-y-8">
          <AccountSettings />
          <PasswordChangeForm />
          {isAdmin && <CreateUserForm />}
          {isAdmin && (
            <div className="space-y-6">
              <AutoResetStatus />
              <StudentLevelsReset />
            </div>
          )}
        </TabsContent>

        {isAdmin && (
          <TabsContent value="users">
            <UserManagementTab />
          </TabsContent>
        )}

        {isAdmin && (
          <TabsContent value="admin-teacher">
            <AdminTeacherUserForm />
          </TabsContent>
        )}
        
        {isAdmin && (
          <TabsContent value="teacher-classes">
            <TeacherManagementTab />
          </TabsContent>
        )}
        
        {isAdmin && (
          <TabsContent value="notifications">
            <NotificationTemplatesTab />
          </TabsContent>
        )}
        
        {isAdmin && (
          <TabsContent value="adult-students">
            <AdultStudentManagementForm />
          </TabsContent>
        )}
        
        {isAdmin && (
          <TabsContent value="registrations">
            <RegistrationsTab />
          </TabsContent>
        )}
        
        {isAdmin && (
          <TabsContent value="subscriptions">
            <SubscriptionManagementTab />
          </TabsContent>
        )}
        
        {isAdmin && (
          <TabsContent value="messaging">
            <DirectMessagingTab />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
};

export default Settings;
