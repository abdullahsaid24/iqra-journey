
import { Card } from "@/components/ui/card";
import { Tabs } from "@/components/ui/tabs";
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
    <div className="min-h-screen bg-gradient-to-br from-quran-bg to-quran-light/80 p-6 animate-fade-in">
      <Card className="border border-quran-border bg-white/90 backdrop-blur-sm shadow-lg">
        <div className="p-6">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-quran-bg font-arabic mb-2">User Management</h2>
            <div className="w-32 h-1 bg-quran-primary mx-auto rounded-full" />
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
