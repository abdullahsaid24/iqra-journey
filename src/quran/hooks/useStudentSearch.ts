
import { useState } from 'react';
import { findStudentUuidByName } from '@/lib/studentUtils';
import { toast } from 'sonner';

export const useStudentSearch = () => {
  const [studentId, setStudentId] = useState<string | null>(null);

  const searchStudentByName = async (name: string) => {
    const uuid = await findStudentUuidByName(name);
    if (uuid) {
      setStudentId(uuid);
      toast.success(`Found student UUID: ${uuid}`);
    } else {
      toast.error('No student found with that name');
    }
    return uuid;
  };

  return { studentId, searchStudentByName };
};
