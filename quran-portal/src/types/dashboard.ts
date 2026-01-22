export interface ClassWithStudents {
  id: string;
  name: string;
  teachers?: { user_id: string; email: string; }[];
  students?: { id: string; name: string; }[];
}