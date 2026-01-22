
import { useMemo } from "react";

export const useFilteredUsers = (users: any[], searchQuery: string) => {
  // Filter users based on search query
  const filteredUsers = useMemo(() => {
    if (!searchQuery || searchQuery.trim() === '') {
      return users;
    }
    
    const query = searchQuery.toLowerCase().trim();
    return users.filter(user => {
      const fullName = `${user.first_name || ''} ${user.last_name || ''}`.toLowerCase();
      return fullName.includes(query) || 
        (user.email && user.email.toLowerCase().includes(query));
    });
  }, [users, searchQuery]);

  // Separate users by role
  const teacherUsers = useMemo(() => 
    filteredUsers?.filter(user => user.role === 'teacher') || [], 
    [filteredUsers]
  );
  
  const regularStudentUsers = useMemo(() => 
    filteredUsers?.filter(user => user.role === 'student' && !user.is_adult_student) || [], 
    [filteredUsers]
  );
  
  const adultStudentUsers = useMemo(() => 
    filteredUsers?.filter(user => user.role === 'student' && user.is_adult_student === true) || [], 
    [filteredUsers]
  );
  
  const filteredParentUsers = useMemo(() => 
    filteredUsers?.filter(user => user.role === 'parent') || [], 
    [filteredUsers]
  );

  return {
    filteredUsers,
    teacherUsers,
    regularStudentUsers,
    adultStudentUsers,
    filteredParentUsers
  };
};
