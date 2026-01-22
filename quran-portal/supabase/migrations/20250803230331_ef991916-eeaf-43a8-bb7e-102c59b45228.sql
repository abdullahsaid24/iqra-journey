-- Make student_id nullable in parent_student_links to allow phone-only records
ALTER TABLE parent_student_links 
ALTER COLUMN student_id DROP NOT NULL;

-- Update RLS policies to handle nullable student_id
DROP POLICY IF EXISTS "Parents can view their own student links" ON parent_student_links;

CREATE POLICY "Parents can view their own links" 
ON parent_student_links 
FOR SELECT 
USING (auth.uid() = parent_user_id);

-- Ensure admins can still manage all links
DROP POLICY IF EXISTS "Admins can manage all parent-student links" ON parent_student_links;

CREATE POLICY "Admins can manage all parent-student links" 
ON parent_student_links 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM user_roles 
  WHERE user_id = auth.uid() AND role = 'admin'
));