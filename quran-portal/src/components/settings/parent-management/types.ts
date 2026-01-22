
export interface Student {
  id: string;
  name: string;
  email?: string;
  class_id?: string;
}

export interface Parent {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  phone_number?: string;
  created_at: string;
  students?: Student[];
  role?: string;
}

export interface ParentTableProps {
  parents: Parent[];
  onManageStudents: (parentId: string, students: Student[]) => void;
  onEditEmail: (parentId: string, email: string) => void;
  onEditPhone: (parentId: string, phoneNumber: string) => void;
  onDelete: (parentId: string) => void;
}

export interface AdultStudent {
  id: string;
  email: string;
  phone_number?: string;
  created_at?: string;
  first_name?: string;
  last_name?: string;
  role?: string;
}

export interface AdultStudentTableProps {
  students: AdultStudent[];
  onEditEmail: (userId: string, email: string) => void;
  onEditPhone: (userId: string, phoneNumber: string) => void;
  onDelete: (userId: string) => void;
}
