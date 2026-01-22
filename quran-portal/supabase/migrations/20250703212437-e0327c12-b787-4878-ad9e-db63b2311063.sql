-- Update the existing function to reset both absence and failure levels
CREATE OR REPLACE FUNCTION reset_monthly_absence_levels()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  -- Reset both absence levels and failure levels for all students
  UPDATE students
  SET 
    consecutive_absences = 0,
    absence_level = 1,
    failure_level = 1
  WHERE absence_level > 1 OR consecutive_absences > 0 OR failure_level > 1;
END;
$$;