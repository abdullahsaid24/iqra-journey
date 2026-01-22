-- Fix the student absence level trigger to properly track monthly absences
-- The absence_level should be based on total absences this month, not consecutive absences
CREATE OR REPLACE FUNCTION public.update_student_absence_level()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
    monthly_absences_count integer;
BEGIN
  IF NEW.status = 'absent' THEN
    -- Increment consecutive absences
    UPDATE students
    SET consecutive_absences = consecutive_absences + 1
    WHERE id = NEW.student_id;
    
    -- Count total absences for this student in the current month
    SELECT COUNT(*) INTO monthly_absences_count
    FROM weekday_attendance
    WHERE student_id = NEW.student_id
      AND status = 'absent'
      AND attendance_date >= date_trunc('month', CURRENT_DATE)
      AND attendance_date < date_trunc('month', CURRENT_DATE) + interval '1 month';
    
    -- Update absence level based on monthly absence count
    UPDATE students
    SET absence_level = CASE 
      WHEN monthly_absences_count >= 3 THEN 3
      WHEN monthly_absences_count = 2 THEN 2
      ELSE 1
    END
    WHERE id = NEW.student_id;
    
  ELSIF NEW.status = 'present' THEN
    -- Reset consecutive absences when present (but keep monthly absence level)
    UPDATE students
    SET consecutive_absences = 0
    WHERE id = NEW.student_id;
  END IF;
  
  RETURN NEW;
END;
$$;