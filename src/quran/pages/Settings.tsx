
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/quran/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/quran/components/ui/tabs";
import { AccountSettings } from "@/quran/components/settings/AccountSettings";
import { PasswordChangeForm } from "@/quran/components/settings/PasswordChangeForm";
import { CreateUserForm } from "@/quran/components/settings/CreateUserForm";
import { UserManagementTab } from "@/quran/components/settings/user-management/UserManagement";
import { useUserRole } from "@/quran/hooks/useUserRole";
import { AdminTeacherUserForm } from "@/quran/components/settings/AdminTeacherUserForm";
import { TeacherManagementTab } from "@/quran/components/settings/teacher-management/TeacherManagementTab";
import { NotificationTemplatesTab } from "@/quran/components/settings/notification-templates/NotificationTemplatesTab";
import { AdultStudentManagementForm } from "@/quran/components/settings/parent-management/AdultStudentManagementForm";
import { RegistrationsTab } from "@/quran/components/settings/registrations/RegistrationsTab";
import { StudentLevelsReset } from "@/quran/components/settings/StudentLevelsReset";
import { AutoResetStatus } from "@/quran/components/settings/AutoResetStatus";
import { SubscriptionManagementTab } from "@/quran/components/settings/subscription-management/SubscriptionManagementTab";
import { DirectMessagingTab } from "@/quran/components/settings/DirectMessagingTab";
import { useEffect, useState } from "react";

const Settings = () => {
  const navigate = useNavigate();
  const { isAdmin } = useUserRole();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState("account");

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tabParam = params.get("tab");

    if (tabParam && ["account", "users", "admin-teacher", "teacher-classes", "notifications", "adult-students", "registrations", "subscriptions", "messaging"].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [location.search]);

  const menuItems = [
    { id: "account", label: "Account", icon: null },
    ...(isAdmin ? [
      { id: "users", label: "Users", icon: null },
      { id: "admin-teacher", label: "Admin Management", icon: null },
      { id: "teacher-classes", label: "Teachers & Classes", icon: null },
      { id: "notifications", label: "Notifications", icon: null },
      { id: "adult-students", label: "Adult Students", icon: null },
      { id: "registrations", label: "Registrations", icon: null },
      { id: "subscriptions", label: "Subscriptions", icon: null },
      { id: "messaging", label: "Messaging", icon: null },
    ] : [])
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="container mx-auto p-4 md:p-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Settings</h1>
            <p className="text-slate-500 mt-1">Manage your account preferences and application settings.</p>
          </div>
          <Button
            variant="outline"
            onClick={() => navigate(-1)}
            className="bg-white hover:bg-slate-100 text-slate-700 border-slate-200"
          >
            Back
          </Button>
        </div>

        <div className="flex flex-col md:flex-row gap-6">
          {/* Sidebar Navigation */}
          <div className="w-full md:w-64 shrink-0">
            <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
              <nav className="flex flex-col p-2 space-y-1">
                {menuItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full text-left px-4 py-2.5 rounded-md text-sm font-medium transition-colors ${activeTab === item.id
                        ? "bg-quran-primary/10 text-quran-primary"
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                      }`}
                  >
                    {item.label}
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="flex-1 min-w-0">
            <div className="space-y-6">
              {activeTab === "account" && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <AccountSettings />
                  <PasswordChangeForm />
                  {isAdmin && <CreateUserForm />}
                  {isAdmin && (
                    <div className="space-y-6">
                      <AutoResetStatus />
                      <StudentLevelsReset />
                    </div>
                  )}
                </div>
              )}

              {isAdmin && activeTab === "users" && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <UserManagementTab />
                </div>
              )}

              {isAdmin && activeTab === "admin-teacher" && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <AdminTeacherUserForm />
                </div>
              )}

              {isAdmin && activeTab === "teacher-classes" && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <TeacherManagementTab />
                </div>
              )}

              {isAdmin && activeTab === "notifications" && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <NotificationTemplatesTab />
                </div>
              )}

              {isAdmin && activeTab === "adult-students" && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <AdultStudentManagementForm />
                </div>
              )}

              {isAdmin && activeTab === "registrations" && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <RegistrationsTab />
                </div>
              )}

              {isAdmin && activeTab === "subscriptions" && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <SubscriptionManagementTab />
                </div>
              )}

              {isAdmin && activeTab === "messaging" && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <DirectMessagingTab />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
