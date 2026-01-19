
import { Card } from "@/quran/components/ui/card";
import { Tabs } from "@/quran/components/ui/tabs";
import { UserSearchBar } from "./UserSearchBar";
import { LoadingState } from "./LoadingState";
import { ErrorState } from "./ErrorState";
import { useTabs } from "./hooks/useTabs";
import { UserTabsList } from "./TabsList";
import { UserTabsContent } from "./TabsContent";

export const UserManagementTab = () => {
  // Use the custom hook to manage tab state and data
  const {
    searchQuery,
    isLoadingUsers,
    usersError,
    refetchUsers,
    parentUsers,
    isLoadingParents,
    parentsError,
    refetchParents,
    students,
    refetchStudents,
    filteredUsers,
    teacherUsers,
    regularStudentUsers,
    adultStudentUsers,
    filteredParentUsers,
    handleSearch
  } = useTabs();

  // If loading show loading state
  if (isLoadingUsers) {
    return <LoadingState />;
  }

  // If error show error state
  if (usersError) {
    return <ErrorState error={usersError} onRetry={refetchUsers} />;
  }

  return (
    <div className="animate-fade-in">
      <Card className="bg-white border-slate-200 shadow-sm">
        <div className="p-6">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-2">User Management</h2>
            <p className="text-slate-500">Manage all users, including teachers, parents, and students.</p>
          </div>

          <UserSearchBar
            searchQuery={searchQuery}
            onSearch={handleSearch}
            filteredUsers={filteredUsers}
            teacherUsers={teacherUsers}
            regularStudentUsers={regularStudentUsers}
            adultStudentUsers={adultStudentUsers}
            parentUsers={filteredParentUsers}
          />

          <Tabs defaultValue="parent" className="w-full mt-6">
            <UserTabsList
              teacherUsers={teacherUsers}
              parentUsers={parentUsers}
              students={students}
              adultStudentUsers={adultStudentUsers}
            />

            <UserTabsContent
              teacherUsers={teacherUsers}
              parentUsers={parentUsers}
              isLoadingParents={isLoadingParents}
              parentsError={parentsError}
              refetchParents={refetchParents}
              refetchUsers={refetchUsers}
              refetchStudents={refetchStudents}
              students={students}
              regularStudentUsers={regularStudentUsers}
              adultStudentUsers={adultStudentUsers}
              filteredUsers={filteredUsers}
            />
          </Tabs>
        </div>
      </Card>
    </div>
  );
};
