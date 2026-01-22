
-- Drop the existing trigger and function with CASCADE to handle dependencies
DROP TRIGGER IF EXISTS reset_absence_level_on_lesson_pass ON homework_assignments CASCADE;
DROP FUNCTION IF EXISTS reset_absence_on_lesson_pass() CASCADE;

-- Create a new function that only resets absence levels monthly
CREATE OR REPLACE FUNCTION reset_monthly_absence_levels()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  -- Reset absence levels for all students at the beginning of each month
  -- This should be called by a cron job or manually at month start
  UPDATE students
  SET 
    consecutive_absences = 0,
    absence_level = 1
  WHERE absence_level > 1 OR consecutive_absences > 0;
END;
$$;

-- Create a trigger that only updates failure level on lesson outcomes
CREATE OR REPLACE FUNCTION update_lesson_failure_level()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  -- Only process lesson-type assignments (keep existing failure level logic)
  IF NEW.type = 'lesson' THEN
    IF NEW.status = 'passed' THEN
      UPDATE students
      SET failure_level = 1,
          last_lesson_status = 'passed'
      WHERE id = NEW.student_id;
      
    ELSIF NEW.status = 'failed' THEN
      UPDATE students
      SET failure_level = LEAST(failure_level + 1, 3),
          last_lesson_status = 'failed'
      WHERE id = NEW.student_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create the new trigger for lesson failure level only
CREATE TRIGGER update_lesson_failure_level_trigger
  AFTER INSERT OR UPDATE ON homework_assignments
  FOR EACH ROW
  EXECUTE FUNCTION update_lesson_failure_level();
