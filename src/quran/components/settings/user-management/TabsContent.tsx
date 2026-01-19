
import { TabsContent } from "@/quran/components/ui/tabs";
import { TeacherUsersTab } from "./TeacherUsersTab";
import { ParentUsersTab } from "./ParentUsersTab";
import { StudentUsersTab } from "./StudentUsersTab";
import { AdultStudentUsersTab } from "./AdultStudentUsersTab";
import { AdminUsersTab } from "./AdminUsersTab";

interface TabsContentProps {
  teacherUsers: any[];
  parentUsers: any[];
  isLoadingParents: boolean;
  parentsError: any;
  refetchParents: () => void;
  refetchUsers: () => void;
  refetchStudents: () => void;
  students: any[];
  regularStudentUsers: any[];
  adultStudentUsers: any[];
  filteredUsers: any[];
}

export const UserTabsContent = ({
  teacherUsers,
  parentUsers,
  isLoadingParents,
  parentsError,
  refetchParents,
  refetchUsers,
  refetchStudents,
  students,
  regularStudentUsers,
  adultStudentUsers,
  filteredUsers
}: TabsContentProps) => {
  return (
    <>
      <TabsContent value="teacher" className="mt-6">
        <TeacherUsersTab users={teacherUsers} />
      </TabsContent>
      
      <TabsContent value="parent" className="mt-6">
        <ParentUsersTab 
          parents={parentUsers} 
          isLoading={isLoadingParents}
          error={parentsError}
          refetchParents={refetchParents}
          refetchUsers={refetchUsers}
          refetchStudents={refetchStudents}
          students={students}
        />
      </TabsContent>
      
      <TabsContent value="student" className="mt-6">
        <StudentUsersTab users={regularStudentUsers} />
      </TabsContent>
      
      <TabsContent value="adult_student" className="mt-6">
        <AdultStudentUsersTab 
          users={adultStudentUsers}
          refetchUsers={refetchUsers}
        />
      </TabsContent>
      
      <TabsContent value="admin" className="mt-6">
        <AdminUsersTab 
          users={filteredUsers?.filter(user => user && user.role === 'admin') || []} 
        />
      </TabsContent>
    </>
  );
};
