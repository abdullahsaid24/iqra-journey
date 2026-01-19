
import { UserTable } from "./UserTable";

interface TeacherUsersTabProps {
  users: any[];
}

export const TeacherUsersTab = ({ users }: TeacherUsersTabProps) => {
  return <UserTable users={users} />;
};
