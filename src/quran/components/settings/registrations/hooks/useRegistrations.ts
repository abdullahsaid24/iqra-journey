
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/quran/lib/supabase";

export const useRegistrations = () => {
  return useQuery({
    queryKey: ['registrations'],
    queryFn: async () => {
      console.log('Fetching registrations...');
      
      // Get all registrations with their students
      const { data: registrations, error: registrationsError } = await supabase
        .from('registrations')
        .select(`
          *,
          registration_students (
            id,
            name,
            age
          )
        `)
        .order('created_at', { ascending: false });

      if (registrationsError) {
        console.error('Error fetching registrations:', registrationsError);
        throw registrationsError;
      }

      // Guard against empty registrations
      if (!registrations || registrations.length === 0) {
        console.log('No registrations found');
        return [];
      }

      // Get parent-student links to show which parents have linked children
      const { data: parentLinks, error: linksError } = await supabase
        .from('parent_student_links')
        .select(`
          parent_user_id,
          phone_number,
          secondary_phone_number,
          students (
            id,
            name,
            email
          )
        `);

      if (linksError) {
        console.warn('Error fetching parent links (non-blocking):', linksError);
      }

      // Check which registration emails already exist in auth.users
      const emailChecks = await Promise.all(
        registrations.map(async (registration) => {
          try {
            const { data, error } = await supabase.rpc('check_email_exists', {
              check_email: registration.email
            });
            
            if (error) {
              console.warn(`Error checking email ${registration.email}:`, error);
              return { email: registration.email, exists: false };
            }
            
            return { email: registration.email, exists: data || false };
          } catch (err) {
            console.warn(`Exception checking email ${registration.email}:`, err);
            return { email: registration.email, exists: false };
          }
        })
      );

      const emailExistsMap = emailChecks.reduce((acc, check) => {
        acc[check.email] = check.exists;
        return acc;
      }, {} as Record<string, boolean>);

      // Combine the data
      const formattedRegistrations = registrations.map(registration => ({
        ...registration,
        students: registration.registration_students || [],
        accountExists: emailExistsMap[registration.email] || false,
        parentLinks: (parentLinks || []).filter(link => 
          link.phone_number === registration.phone || 
          link.secondary_phone_number === registration.phone
        ).map(link => ({
          ...link,
          students: Array.isArray(link.students) ? link.students : [link.students].filter(Boolean)
        }))
      }));

      console.log('Formatted registrations:', formattedRegistrations);
      return formattedRegistrations;
    }
  });
};
