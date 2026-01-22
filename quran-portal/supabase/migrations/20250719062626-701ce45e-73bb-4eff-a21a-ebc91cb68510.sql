-- Update all pending homework assignments to show as absent
UPDATE homework_assignments 
SET status = 'absent' 
WHERE status = 'pending';