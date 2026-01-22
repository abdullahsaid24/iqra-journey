
import { useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";

/**
 * Hook for fetching all unique recipient phone numbers across both parent_student_links and adult_students
 */
export function useGlobalRecipientNumbers() {
  const [recipients, setRecipients] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchNumbers = useCallback(async () => {
    setIsLoading(true);
    try {
      // Fetch parent_student_links
      const { data: parentLinks, error: parentLinksError } = await supabase
        .from("parent_student_links")
        .select("phone_number, secondary_phone_number")
        .not("phone_number", "is", null);

      // Fetch adult_students
      const { data: adultStudents, error: adultStudentsError } = await supabase
        .from("adult_students")
        .select("phone_number")
        .not("phone_number", "is", null);

      if (parentLinksError || adultStudentsError) {
        throw new Error(parentLinksError?.message || adultStudentsError?.message);
      }

      // Collect all unique numbers (using Set to avoid duplicates)
      const phoneSet = new Set<string>();

      // Process parent_student_links phone numbers
      if (parentLinks) {
        parentLinks.forEach(link => {
          if (link.phone_number && link.phone_number.trim()) {
            phoneSet.add(link.phone_number.trim());
          }
          if (link.secondary_phone_number && link.secondary_phone_number.trim()) {
            phoneSet.add(link.secondary_phone_number.trim());
          }
        });
      }

      // Process adult_students phone numbers
      if (adultStudents) {
        adultStudents.forEach(student => {
          if (student.phone_number && student.phone_number.trim()) {
            phoneSet.add(student.phone_number.trim());
          }
        });
      }

      setRecipients(Array.from(phoneSet));
    } catch (err) {
      setRecipients([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { recipients, isLoading, fetchNumbers };
}
