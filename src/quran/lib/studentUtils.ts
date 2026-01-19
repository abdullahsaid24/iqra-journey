import { supabase } from "@/integrations/supabase/client";

export const findStudentUuidByName = async (name: string) => {
  try {
    const { data, error } = await supabase
      .from('students')
      .select('id')
      .eq('name', name)
      .single();

    if (error) {
      console.error('Error finding student:', error);
      return null;
    }

    return data?.id || null;
  } catch (error) {
    console.error('Unexpected error finding student:', error);
    return null;
  }
};

export const findStudentByEmail = async (email: string) => {
  try {
    const { data, error } = await supabase
      .from('students')
      .select('id, name, email')
      .eq('email', email)
      .single();

    if (error) {
      console.error('Error finding student by email:', error);
      return null;
    }

    return data || null;
  } catch (error) {
    console.error('Unexpected error finding student by email:', error);
    return null;
  }
};

export const findAdultStudentPhoneByEmail = async (email: string) => {
  if (!email) {
    console.error("Email parameter is missing or empty");
    return null;
  }
  
  try {
    console.log(`Looking up phone number for email: ${email}`);
    
    // 1. First try to find the student by email
    const { data: studentData, error: studentError } = await supabase
      .from('students')
      .select('id, name')
      .eq('email', email)
      .maybeSingle();
    
    if (studentError) {
      console.error('Error finding student by email:', studentError);
    }
    
    let studentId = studentData?.id || null;
    console.log(`Student lookup result: ${studentId ? "Found" : "Not found"} ${studentData ? JSON.stringify(studentData) : ""}`);
    
    // 2. If we found a student, check adult_students table by student ID
    if (studentId) {
      console.log(`Looking up adult_students record by ID: ${studentId}`);
      const { data: adultDataById, error: adultErrorById } = await supabase
        .from('adult_students')
        .select('phone_number')
        .eq('id', studentId)
        .maybeSingle();
        
      if (adultErrorById) {
        console.error('Error finding adult student by ID:', adultErrorById);
      }
      
      if (adultDataById?.phone_number) {
        console.log(`Found phone in adult_students table by ID for ${email}: ${adultDataById.phone_number}`);
        return adultDataById.phone_number;
      }
      
      // 3. If no adult_students record by ID, check parent_student_links
      console.log(`No adult student record found, checking parent_student_links for student ID: ${studentId}`);
      const { data: parentLinkData, error: parentLinkError } = await supabase
        .from('parent_student_links')
        .select('phone_number')
        .eq('student_id', studentId)
        .maybeSingle();
  
      if (parentLinkError) {
        console.error('Error finding parent link:', parentLinkError);
      }
  
      if (parentLinkData?.phone_number) {
        console.log(`Found phone in parent_student_links for ${email}: ${parentLinkData.phone_number}`);
        return parentLinkData.phone_number;
      }
    }

    // 4. If student not found by email or no phone found yet, check adult_students table directly
    console.log(`Checking adult_students table directly by email: ${email}`);
    const { data: adultStudentData, error: adultStudentError } = await supabase
      .from('adult_students')
      .select('phone_number')
      .eq('email', email)
      .maybeSingle();

    if (adultStudentError) {
      console.error('Error finding adult student by email:', adultStudentError);
    }

    if (adultStudentData?.phone_number) {
      console.log(`Found phone in adult_students table for ${email}: ${adultStudentData.phone_number}`);
      return adultStudentData.phone_number;
    }

    console.log(`No phone number found for ${email} in any table`);
    return null;
  } catch (error) {
    console.error('Unexpected error finding adult student phone:', error);
    return null;
  }
};
