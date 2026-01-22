-- Fix the absence level calculation logic - 1 absence should be level 2
UPDATE students 
SET absence_level = CASE 
  WHEN monthly_absence_count >= 3 THEN 3
  WHEN monthly_absence_count >= 1 THEN 2  -- Changed from = 2 to >= 1
  ELSE 1
END
FROM (
  SELECT 
    s.id as student_id,
    COALESCE(COUNT(wa.id), 0) as monthly_absence_count
  FROM students s
  LEFT JOIN weekday_attendance wa ON wa.student_id = s.id 
    AND wa.status = 'absent' 
    AND wa.attendance_date >= date_trunc('month', CURRENT_DATE)
    AND wa.attendance_date < date_trunc('month', CURRENT_DATE) + interval '1 month'
  GROUP BY s.id
) absence_counts
WHERE students.id = absence_counts.student_id;