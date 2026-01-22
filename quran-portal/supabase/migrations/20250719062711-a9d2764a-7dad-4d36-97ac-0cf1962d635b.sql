-- First, drop the existing check constraint
ALTER TABLE homework_assignments DROP CONSTRAINT homework_assignments_status_check;

-- Then add a new constraint that includes 'absent' as a valid status
ALTER TABLE homework_assignments ADD CONSTRAINT homework_assignments_status_check 
CHECK (status = ANY (ARRAY['pending'::text, 'passed'::text, 'failed'::text, 'absent'::text]));

-- Now update all pending assignments to absent
UPDATE homework_assignments 
SET status = 'absent' 
WHERE status = 'pending';