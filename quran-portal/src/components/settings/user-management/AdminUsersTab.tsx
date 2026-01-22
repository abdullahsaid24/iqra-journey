
import { UserTable } from "./UserTable";

interface AdminUsersTabProps {
  users: any[];
}

export const AdminUsersTab = ({ users }: AdminUsersTabProps) => {
  return <UserTable users={users} />;
};
