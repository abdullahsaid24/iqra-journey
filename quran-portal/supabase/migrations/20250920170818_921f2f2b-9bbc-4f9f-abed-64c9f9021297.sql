-- Enable RLS on tables that don't have it enabled
ALTER TABLE class_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekday_attendance ENABLE ROW LEVEL SECURITY;

-- Add basic RLS policies for class_links (admin/teacher access)
CREATE POLICY "Admin and teacher access for class_links" ON class_links
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'teacher')
  )
);

-- Add RLS policies for weekday_attendance (admin/teacher access + students can view their own)
CREATE POLICY "Admin and teacher manage weekday attendance" ON weekday_attendance
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'teacher')
  )
);

CREATE POLICY "Students can view their own weekday attendance" ON weekday_attendance
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM students s
    WHERE s.id = weekday_attendance.student_id 
    AND s.email = (auth.jwt() ->> 'email')
  )
);