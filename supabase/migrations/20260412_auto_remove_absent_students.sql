-- Update the trigger function to auto-remove students after 8 consecutive absences
-- Student record is preserved but class_id is set to NULL
CREATE OR REPLACE FUNCTION public.update_student_absence_level()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
    monthly_absences_count integer;
    new_consecutive_absences integer;
BEGIN
  IF NEW.status = 'absent' THEN
    -- Calculate new consecutive absences count
    SELECT (consecutive_absences + 1) INTO new_consecutive_absences
    FROM students WHERE id = NEW.student_id;

    -- Count total absences for this student in the current month
    SELECT COUNT(*) INTO monthly_absences_count
    FROM weekday_attendance
    WHERE student_id = NEW.student_id
      AND status = 'absent'
      AND attendance_date >= date_trunc('month', CURRENT_DATE)
      AND attendance_date < date_trunc('month', CURRENT_DATE) + interval '1 month';
    
    -- Update student: absences, level, and auto-remove if 4+ consecutive
    UPDATE students
    SET 
      consecutive_absences = new_consecutive_absences,
      absence_level = CASE 
        WHEN monthly_absences_count >= 3 THEN 3
        WHEN monthly_absences_count >= 1 THEN 2
        ELSE 1
      END,
      -- AUTO-REMOVE: clear class_id after 8 consecutive absences
      class_id = CASE 
        WHEN new_consecutive_absences >= 8 THEN NULL 
        ELSE class_id 
      END
    WHERE id = NEW.student_id;
    
  ELSIF NEW.status = 'present' THEN
    -- Reset consecutive absences when present
    UPDATE students
    SET consecutive_absences = 0
    WHERE id = NEW.student_id;
  END IF;
  
  RETURN NEW;
END;
$$;
