
import { TabsList, TabsTrigger } from "@/components/ui/tabs";

interface TabsListProps {
  teacherUsers: any[];
  parentUsers: any[];
  students: any[];
  adultStudentUsers: any[];
}

export const UserTabsList = ({
  teacherUsers,
  parentUsers,
  students,
  adultStudentUsers
}: TabsListProps) => {
  return (
    <TabsList className="grid w-full grid-cols-5 bg-black p-1 gap-1">
      <TabsTrigger 
        value="teacher" 
        className="data-[state=active]:bg-quran-primary data-[state=active]:text-white hover:text-quran-primary transition-colors text-white"
      >
        Teachers ({teacherUsers.length})
      </TabsTrigger>
      <TabsTrigger 
        value="parent" 
        className="data-[state=active]:bg-quran-primary data-[state=active]:text-white hover:text-quran-primary transition-colors text-white"
      >
        Parents ({parentUsers.length})
      </TabsTrigger>
      <TabsTrigger 
        value="student" 
        className="data-[state=active]:bg-quran-primary data-[state=active]:text-white hover:text-quran-primary transition-colors text-white"
      >
        Students ({students.length})
      </TabsTrigger>
      <TabsTrigger 
        value="adult_student" 
        className="data-[state=active]:bg-quran-primary data-[state=active]:text-white hover:text-quran-primary transition-colors text-white"
      >
        Adult Students ({adultStudentUsers.length})
      </TabsTrigger>
      <TabsTrigger 
        value="admin" 
        className="data-[state=active]:bg-quran-primary data-[state=active]:text-white hover:text-quran-primary transition-colors text-white"
      >
        Admins
      </TabsTrigger>
    </TabsList>
  );
};
