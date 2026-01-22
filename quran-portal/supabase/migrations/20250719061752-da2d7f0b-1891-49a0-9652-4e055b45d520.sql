-- Recalculate absence levels for all students based on their current month's absences
UPDATE students 
SET absence_level = CASE 
  WHEN monthly_absence_count >= 3 THEN 3
  WHEN monthly_absence_count = 2 THEN 2
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