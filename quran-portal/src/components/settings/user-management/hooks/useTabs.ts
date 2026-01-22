
import { useState } from "react";
import { useUsers } from "./useUsers";
import { useParentUsers } from "./useParentUsers";
import { useStudents } from "./useStudents";
import { useFilteredUsers } from "./useFilteredUsers";

export const useTabs = () => {
  const [searchQuery, setSearchQuery] = useState("");
  
  // Fetch all users
  const { 
    data: users = [], 
    isLoading: isLoadingUsers, 
    error: usersError, 
    refetch: refetchUsers
  } = useUsers();

  // Fetch students
  const {
    data: students = [],
    refetch: refetchStudents
  } = useStudents();

  // Fetch parent users and their linked students
  const {
    data: parentUsers = [],
    isLoading: isLoadingParents,
    error: parentsError,
    refetch: refetchParents
  } = useParentUsers();

  // Filter users
  const {
    filteredUsers,
    teacherUsers,
    regularStudentUsers,
    adultStudentUsers,
    filteredParentUsers
  } = useFilteredUsers(users, searchQuery);

  // Handle user search
  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  return {
    searchQuery,
    users,
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
  };
};
