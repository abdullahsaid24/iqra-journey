
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const findTestMustafaUuid = async () => {
  try {
    const { data, error } = await supabase
      .from('students')
      .select('id')
      .eq('name', 'testmustafa test')
      .single();

    if (error) {
      console.error('Error finding student:', error);
      toast.error('Failed to find student');
      return null;
    }

    if (data) {
      console.log('Student UUID:', data.id);
      toast.success(`Found UUID: ${data.id}`);
      return data.id;
    }

    toast.warning('No student found with name "testmustafa test"');
    return null;
  } catch (error) {
    console.error('Unexpected error:', error);
    toast.error('An unexpected error occurred');
    return null;
  }
};
